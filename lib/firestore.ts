import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

export async function syncWatchHistoryToFirestore(video: any) {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    const historyRef = doc(db, `users/${uid}/watchHistory`, video.id);
    await setDoc(historyRef, {
      ...video,
      timestamp: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error('[Firestore] Failed to sync watch history:', error);
  }
}

export async function getWatchHistoryFromFirestore() {
  if (!auth.currentUser) return [];
  const uid = auth.currentUser.uid;
  try {
    const historyRef = collection(db, `users/${uid}/watchHistory`);
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('[Firestore] Failed to get watch history:', error);
    return [];
  }
}

export async function syncSearchQueryToFirestore(queryText: string) {
  if (!auth.currentUser || !queryText.trim()) return;
  const uid = auth.currentUser.uid;
  try {
    // Generate a simple ID for the query, or let Firestore auto-generate
    const searchRef = doc(collection(db, `users/${uid}/searchHistory`));
    await setDoc(searchRef, {
      query: queryText,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('[Firestore] Failed to sync search query:', error);
  }
}

export async function toggleMyListInFirestore(video: any, isAdding: boolean) {
  if (!auth.currentUser) return;
  const uid = auth.currentUser.uid;
  try {
    const listRef = doc(db, `users/${uid}/myList`, video.id);
    if (isAdding) {
      await setDoc(listRef, {
        ...video,
        addedAt: serverTimestamp()
      });
    } else {
      await deleteDoc(listRef);
    }
  } catch (error) {
    console.error('[Firestore] Failed to toggle my list:', error);
  }
}

/**
 * Returns a Map of videoId -> progress (0-1) for all videos
 * the current user has partially watched. Used by VideoCard to
 * render the red progress bar overlay.
 */
export async function getProgressMapFromFirestore(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (!auth.currentUser) return map;
  const uid = auth.currentUser.uid;
  try {
    const historyRef = collection(db, `users/${uid}/watchHistory`);
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(d => {
      const data = d.data();
      if (data.time && data.duration && data.duration > 0) {
        map.set(d.id, Math.min(data.time / data.duration, 1));
      }
    });
  } catch (error) {
    console.error('[Firestore] Failed to get progress map:', error);
  }
  return map;
}

/**
 * Returns an array of continue-watching videos (partially watched, not finished).
 * Filters out videos where progress > 95% (already finished).
 */
export async function getContinueWatchingFromFirestore(): Promise<any[]> {
  if (!auth.currentUser) return [];
  const uid = auth.currentUser.uid;
  try {
    const historyRef = collection(db, `users/${uid}/watchHistory`);
    const q = query(historyRef, orderBy('timestamp', 'desc'), limit(20));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((v: any) => {
        if (!v.time || !v.duration || v.duration <= 0) return false;
        const pct = v.time / v.duration;
        return pct > 0.05 && pct < 0.95; // Between 5% and 95%
      });
  } catch (error) {
    console.error('[Firestore] Failed to get continue watching:', error);
    return [];
  }
}

export async function getMyListFromFirestore(): Promise<any[]> {
  if (!auth.currentUser) return [];
  const uid = auth.currentUser.uid;
  try {
    const listRef = collection(db, `users/${uid}/myList`);
    const q = query(listRef, orderBy('addedAt', 'desc'), limit(30));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('[Firestore] Failed to get my list:', error);
    return [];
  }
}
