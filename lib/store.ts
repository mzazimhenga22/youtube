import { create } from 'zustand';
import type { ImageSourcePropType } from 'react-native';

export interface Profile {
  id: string;
  name: string;
  avatar?: string | ImageSourcePropType;
  handle?: string;
  mode: 'kids' | 'regular';
}

interface AppState {
  currentProfile: Profile | null;
  ambientThumbnail: string | null;
  ambientColor: string;
  isAmbientMode: boolean;
  watchHistory: any[];
  likedVideos: any[];
  watchLater: any[];
  globalVideo: any | null;
  globalStreamUrl: string | null;
  globalProgress: number;
  isGlobalPlaying: boolean;
  isGlobalLoading: boolean;
  
  setProfile: (profile: Profile | null) => void;
  setAmbientState: (thumbnail: string | null, color?: string) => void;
  setGlobalPlaying: (playing: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  setGlobalStreamUrl: (url: string | null) => void;
  setGlobalPlayback: (video: any | null, url: string | null) => void;
  setGlobalProgress: (progress: number) => void;
  logout: () => void;
  addToHistory: (video: any) => void;
  toggleLiked: (video: any) => void;
  toggleWatchLater: (video: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentProfile: null,
  ambientThumbnail: null,
  ambientColor: '#FFFFFF',
  isAmbientMode: false,
  watchHistory: [],
  likedVideos: [],
  watchLater: [],
  globalVideo: null,
  globalStreamUrl: null,
  globalProgress: 0,
  isGlobalPlaying: false,
  isGlobalLoading: false,

  setProfile: (profile) => set({ currentProfile: profile }),
  setAmbientState: (thumbnail, color = '#FFFFFF') => set({ 
    ambientThumbnail: thumbnail, 
    ambientColor: color,
    isAmbientMode: !!thumbnail 
  }),
  setGlobalPlaying: (playing) => set({ isGlobalPlaying: playing }),
  setGlobalLoading: (loading) => set({ isGlobalLoading: loading }),
  setGlobalStreamUrl: (url) => set({ globalStreamUrl: url }),
  setGlobalPlayback: (video, url) => set({
    globalVideo: video,
    globalStreamUrl: url,
    globalProgress: 0,
    isGlobalPlaying: !!url,
  }),
  setGlobalProgress: (progress) => set({ globalProgress: Math.max(0, Math.min(1, progress)) }),
  logout: () => set({ currentProfile: null }),
  addToHistory: (video) => set((state) => ({ 
    watchHistory: [video, ...state.watchHistory.filter(v => v.id !== video.id)].slice(0, 50) 
  })),
  toggleLiked: (video) => set((state) => {
    const isLiked = state.likedVideos.some(v => v.id === video.id);
    return {
      likedVideos: isLiked 
        ? state.likedVideos.filter(v => v.id !== video.id)
        : [video, ...state.likedVideos]
    };
  }),
  toggleWatchLater: (video) => set((state) => {
    const isSaved = state.watchLater.some(v => v.id === video.id);
    return {
      watchLater: isSaved 
        ? state.watchLater.filter(v => v.id !== video.id)
        : [video, ...state.watchLater]
    };
  }),
}));
