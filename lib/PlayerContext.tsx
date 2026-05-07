import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useVideoPlayer, VideoPlayer } from 'expo-video';
import { useAppStore } from './store';

interface PlayerContextType {
  player: VideoPlayer;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { globalStreamUrl, isGlobalPlaying, setGlobalPlaying } = useAppStore();
  
  // Create the SINGLE global player instance
  const player = useVideoPlayer(globalStreamUrl || '', (p) => {
    p.loop = false;
    p.volume = 1.0;
  });

  // Keep playback status in sync with store
  useEffect(() => {
    if (isGlobalPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isGlobalPlaying, player]);

  // Sync back player status to store (optional but good for consistency)
  useEffect(() => {
    const sub = player.addListener('playingChange', ({ isPlaying }) => {
      setGlobalPlaying(isPlaying);
    });
    return () => sub.remove();
  }, [player, setGlobalPlaying]);

  return (
    <PlayerContext.Provider value={{ player }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function useGlobalPlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('useGlobalPlayer must be used within a PlayerProvider');
  }
  return context;
}
