import * as SQLite from 'expo-sqlite';
import { 
  syncWatchHistoryToFirestore, 
  syncSearchQueryToFirestore, 
  toggleMyListInFirestore 
} from './firestore';

const DB_NAME = 'youtube_core.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let databaseDisabled = false;
let writeQueue: Promise<void> = Promise.resolve();

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (databaseDisabled) {
    throw new Error('SQLite persistence disabled');
  }

  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;
  
  initPromise = SQLite.openDatabaseAsync(DB_NAME)
    .then(db => {
      dbInstance = db;
      return db;
    })
    .catch(error => {
      initPromise = null;
      databaseDisabled = true;
      throw error;
    });
  
  return initPromise;
}

export async function initDatabase() {
  try {
    const db = await getDB();
    
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS playback_progress (
        id TEXT PRIMARY KEY,
        time REAL,
        duration REAL,
        title TEXT,
        channel TEXT,
        thumbnail TEXT,
        last_watched INTEGER
      );

      CREATE TABLE IF NOT EXISTS search_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT UNIQUE,
        timestamp INTEGER
      );

      CREATE TABLE IF NOT EXISTS my_list (
        id TEXT PRIMARY KEY,
        title TEXT,
        channel TEXT,
        thumbnail TEXT,
        added_at INTEGER
      );
    `);
    
    console.log('[DB] Database initialized successfully');
    return db;
  } catch (error) {
    console.error('[DB] Initialization failed:', error);
    databaseDisabled = true;
    throw error;
  }
}

export async function savePlaybackProgress(video: { 
  id: string, 
  time: number, 
  duration: number, 
  title: string, 
  channel: string, 
  thumbnail: string 
}) {
  if (databaseDisabled || !isValidPlaybackProgress(video)) {
    return;
  }

  writeQueue = writeQueue
    .catch(() => undefined)
    .then(() => savePlaybackProgressNow(video));

  await writeQueue;
}

async function savePlaybackProgressNow(video: { 
  id: string, 
  time: number, 
  duration: number, 
  title: string, 
  channel: string, 
  thumbnail: string 
}) {
  try {
    const db = await getDB();
    await db.runAsync(
      `INSERT OR REPLACE INTO playback_progress
        (id, time, duration, title, channel, thumbnail, last_watched)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        String(video.id),
        Number(video.time),
        Number(video.duration),
        video.title || '',
        video.channel || '',
        video.thumbnail || '',
        Date.now(),
      ]
    );
    
    // Sync to Firestore
    syncWatchHistoryToFirestore(video);
  } catch (e) {
    if (isNativeDatabaseFailure(e)) {
      databaseDisabled = true;
      console.warn('[DB] SQLite persistence disabled after native database failure');
      return;
    }
    console.error('[DB] savePlaybackProgress failed:', e);
  }
}

export async function getPlaybackProgress(videoId: string) {
  if (databaseDisabled || !videoId) return null;

  try {
    const db = await getDB();
    return await db.getFirstAsync<{ time: number, duration: number }>(
      'SELECT time, duration FROM playback_progress WHERE id = ?',
      [videoId]
    );
  } catch (e) {
    console.error('[DB] getPlaybackProgress failed:', e);
    return null;
  }
}

export async function getWatchHistory() {
  if (databaseDisabled) return [];

  try {
    const db = await getDB();
    return await db.getAllAsync<any>(
      'SELECT * FROM playback_progress ORDER BY last_watched DESC LIMIT 50'
    );
  } catch (e) {
    console.error('[DB] getWatchHistory failed:', e);
    return [];
  }
}

export async function saveSearchQuery(query: string) {
  if (databaseDisabled || !query.trim()) return;

  try {
    const db = await getDB();
    await db.runAsync(
      'INSERT OR REPLACE INTO search_history (query, timestamp) VALUES (?, ?)',
      [query, Date.now()]
    );
    
    // Sync to Firestore
    syncSearchQueryToFirestore(query);
  } catch (e) {
    console.error('[DB] saveSearchQuery failed:', e);
  }
}

export async function getRecentSearches() {
  if (databaseDisabled) return [];

  try {
    const db = await getDB();
    return await db.getAllAsync<{ query: string }>(
      'SELECT query FROM search_history ORDER BY timestamp DESC LIMIT 10'
    );
  } catch (e) {
    console.error('[DB] getRecentSearches failed:', e);
    return [];
  }
}

export async function toggleMyList(video: any) {
  if (databaseDisabled || !video?.id) return false;

  try {
    const db = await getDB();
    const exists = await db.getFirstAsync('SELECT id FROM my_list WHERE id = ?', [video.id]);
    
    if (exists) {
      await db.runAsync('DELETE FROM my_list WHERE id = ?', [video.id]);
      toggleMyListInFirestore(video, false);
      return false;
    } else {
      await db.runAsync(
        'INSERT INTO my_list (id, title, channel, thumbnail, added_at) VALUES (?, ?, ?, ?, ?)',
        [video.id, video.title, video.channel, video.thumbnail, Date.now()]
      );
      toggleMyListInFirestore(video, true);
      return true;
    }
  } catch (e) {
    console.error('[DB] toggleMyList failed:', e);
    return false;
  }
}

export async function getMyList() {
  if (databaseDisabled) return [];

  try {
    const db = await getDB();
    return await db.getAllAsync<any>('SELECT * FROM my_list ORDER BY added_at DESC');
  } catch (e) {
    console.error('[DB] getMyList failed:', e);
    return [];
  }
}

function isValidPlaybackProgress(video: { id: string; time: number; duration: number }) {
  return Boolean(
    video.id &&
    Number.isFinite(video.time) &&
    Number.isFinite(video.duration) &&
    video.duration > 0 &&
    video.time >= 0
  );
}

function isNativeDatabaseFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('NativeDatabase') || message.includes('NullPointerException');
}
