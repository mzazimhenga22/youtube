import { router } from 'expo-router';
import { Video } from './youtube';

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

export const playVideo = (video: Video) => {
  const seconds = parseDuration(video.duration);
  const isLive = video.duration?.toUpperCase().includes('LIVE');
  
  // Logic: < 2 minutes (120s) and NOT LIVE -> Shorts Player
  if (seconds < 120 && !isLive) {
    router.push({
      pathname: '/shorts-player',
      params: { 
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
        channel: video.channel
      }
    });
  } else {
    // Standard Player (Modal)
    router.push({
      pathname: "/modal",
      params: { 
        id: video.id,
        title: video.title,
        channel: video.channel,
        views: video.views,
        thumbnail: video.thumbnail,
        duration: video.duration
      }
    });
  }
};
