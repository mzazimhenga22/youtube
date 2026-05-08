import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useVideoPlayer, VideoPlayer } from 'expo-video';
import { useAppStore } from './store';

interface PlayerContextType {
  player: VideoPlayer;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { globalStreamUrl, isGlobalPlaying, setGlobalPlaying } = useAppStore();
  const activeSourceRef = useRef<string | null>(null);
  const isReplacingRef = useRef(false);
  
  // Create the SINGLE global player instance
  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.volume = 1.0;
    p.timeUpdateEventInterval = 0.5;
  });

  // Handle source changes
  useEffect(() => {
    let cancelled = false;

    async function replaceSource() {
      if (activeSourceRef.current === globalStreamUrl) return;
      activeSourceRef.current = globalStreamUrl;
      isReplacingRef.current = true;

      if (!globalStreamUrl) {
        try { player.pause(); } catch {}
        try { await player.replaceAsync(null); } catch {}
        isReplacingRef.current = false;
        return;
      }

      await player.replaceAsync(globalStreamUrl);
      isReplacingRef.current = false;
      if (!cancelled && isGlobalPlaying) {
        player.play();
      }
    }

    replaceSource().catch((error) => {
      console.warn('[PlayerProvider] Failed to replace source:', error);
      isReplacingRef.current = false;
    });

    return () => {
      cancelled = true;
    };
  }, [globalStreamUrl, isGlobalPlaying, player]);

  // Keep playback status in sync with store
  useEffect(() => {
    if (isGlobalPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isGlobalPlaying, player]);

  // Sync back player status and progress to store
  useEffect(() => {
    const { setGlobalPlaying, setGlobalProgress } = useAppStore.getState();
    
    const statusSub = player.addListener('playingChange', ({ isPlaying }) => {
      if (isReplacingRef.current || !activeSourceRef.current) return;
      setGlobalPlaying(isPlaying);
    });

    const timeSub = player.addListener('timeUpdate', (event) => {
      if (player.duration > 0) {
        setGlobalProgress(event.currentTime / player.duration);
      }
    });

    return () => {
      statusSub.remove();
      timeSub.remove();
    };
  }, [player]);

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
