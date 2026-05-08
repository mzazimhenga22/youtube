import { router } from 'expo-router';
import { Video, youtubeService } from './youtube';
import { useAppStore } from './store';

export const parseDuration = (duration: string): number => {
  if (!duration || duration.toUpperCase().includes('LIVE')) return 9999; // Treat live as long
  
  const parts = duration.split(':').map(Number);
  if (parts.length === 3) { // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) { // MM:SS
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 1) { // SS
    return parts[0];
  }
  return 0;
};

export const playVideo = async (video: Video, extraParams: Record<string, any> = {}, replace = false) => {
  const { currentProfile, setGlobalLoading, setGlobalPlayback } = useAppStore.getState();
  
  const navigate = replace ? router.replace : router.push;
  
  setGlobalLoading(true);
  try {
    const stream = await youtubeService.getStream(video.id);
    
    if (stream) {
      setGlobalPlayback(video, stream.url);
    }
    
    if (currentProfile?.mode === 'kids') {
      navigate({
        pathname: '/kids-player',
        params: { 
          id: video.id, 
          title: video.title, 
          thumbnail: video.thumbnail,
          url: stream?.url,
          ...extraParams
        }
      });
      return;
    }

    const seconds = parseDuration(video.duration);
    const isLive = video.duration?.toUpperCase().includes('LIVE');
    
    // Logic: < 2 minutes (120s) and NOT LIVE -> Shorts Player
    if (seconds < 120 && !isLive) {
      navigate({
        pathname: '/shorts-player',
        params: { 
          id: video.id,
          title: video.title,
          thumbnail: video.thumbnail,
          channel: video.channel,
          url: stream?.url, // Pass the URL if we already fetched it
          mimeType: stream?.mimeType,
          ...extraParams
        }
      });
    } else {
      // Standard Player (Modal)
      navigate({
        pathname: "/modal",
        params: { 
          id: video.id,
          title: video.title,
          channel: video.channel,
          views: video.views,
          thumbnail: video.thumbnail,
          duration: video.duration,
          ...extraParams
        }
      });
    }
  } catch (e) {
    console.error('[Navigation] Failed to play video:', e);
  } finally {
    setGlobalLoading(false);
  }
};
