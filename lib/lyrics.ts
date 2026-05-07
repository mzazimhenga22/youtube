export interface SyncedLine {
  timeMs: number;
  text: string;
}

export interface LyricsData {
  type: 'plain' | 'synced';
  raw?: string;
  lines?: SyncedLine[];
}

export function parseLrc(lrc: string): SyncedLine[] {
  const lines = lrc.split('\n');
  const result: SyncedLine[] = [];
  const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  
  for (const line of lines) {
    const match = regex.exec(line);
    if (match) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      let msStr = match[3];
      let ms = parseInt(msStr, 10);
      if (msStr.length === 2) ms *= 10;
      
      const timeMs = min * 60000 + sec * 1000 + ms;
      const text = match[4].trim();
      if (text) {
          result.push({ timeMs, text });
      }
    }
  }
  return result;
}

export async function fetchLyrics(title: string, artist: string): Promise<LyricsData | null> {
  try {
    // Clean up title to improve search match (remove "feat.", "Radio", etc.)
    const cleanTitle = title.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').replace(/Radio/g, '').trim();
    
    const headers = { 'User-Agent': 'YouTubeTV/1.0.0' };

    // 1. Try Exact Match
    try {
      const getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(artist)}`;
      const getResp = await fetch(getUrl, { headers });
      if (getResp.ok) {
        const data = await getResp.json();
        if (data && data.syncedLyrics) return { type: 'synced', lines: parseLrc(data.syncedLyrics) };
        if (data && data.plainLyrics) return { type: 'plain', raw: data.plainLyrics };
      }
    } catch(e) {}

    // 2. Fallback to Search
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(artist + ' ' + cleanTitle)}`;
    const response = await fetch(searchUrl, { headers });

    if (!response.ok) return null;

    const data = await response.json();
    
    if (data && data.length > 0) {
      const validMatch = data.find((item: any) => {
        if (!item.syncedLyrics && !item.plainLyrics) return false;
        const itemTrack = (item.trackName || '').toLowerCase();
        const itemArtist = (item.artistName || '').toLowerCase();
        const qTrack = cleanTitle.toLowerCase();
        const qArtist = artist.toLowerCase();
        return itemTrack.includes(qTrack) || qTrack.includes(itemTrack) || itemArtist.includes(qArtist) || qArtist.includes(itemArtist);
      });

      if (validMatch) {
         if (validMatch.syncedLyrics) {
           return { type: 'synced', lines: parseLrc(validMatch.syncedLyrics) };
         } else if (validMatch.plainLyrics) {
           return { type: 'plain', raw: validMatch.plainLyrics };
         }
      }
    }
    
    // 3. Final Fallback: Lyrics.ovh
    try {
      const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(cleanTitle)}`;
      const ovhResp = await fetch(ovhUrl);
      if (ovhResp.ok) {
        const ovhData = await ovhResp.json();
        if (ovhData && ovhData.lyrics) {
          return { type: 'plain', raw: ovhData.lyrics };
        }
      }
    } catch (e) {}

    return null;
  } catch (error) {
    console.warn('[lyrics] Failed to fetch lyrics:', error);
    return null;
  }
}
