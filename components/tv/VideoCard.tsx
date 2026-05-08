import React, { memo, useState, useRef } from 'react';
import { View, Text, DimensionValue, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { FocusablePressable } from './FocusablePressable';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useVideoPlayer, VideoView } from 'expo-video';
import { youtubeService } from '@/lib/youtube';
import { LinearGradient } from 'expo-linear-gradient';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const getHQThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

interface VideoCardProps {
  id: string;
  title: string;
  channel: string;
  views: string;
  thumbnail: string;
  duration: string;
  progress?: number;
  isLive?: boolean;
  aspectRatio?: number;
  onPress?: () => void;
  onFocus?: () => void;
  width?: DimensionValue;
  hasTVPreferredFocus?: boolean;
}

const VideoPreview = memo(({ url, aspectRatio }: { url: string, aspectRatio: number }) => {
  const player = useVideoPlayer(url, (player) => {
    player.muted = true;
    player.loop = true;
    player.play();
  });

  return (
    <VideoView 
      player={player} 
      style={StyleSheet.absoluteFill}
      contentFit={aspectRatio < 1 ? "cover" : "contain"}
      nativeControls={false}
    />
  );
});

export const VideoCard = memo(function VideoCard({ 
  id,
  title, 
  channel, 
  views, 
  thumbnail, 
  duration, 
  progress,
  isLive,
  aspectRatio = 16/9,
  onPress,
  onFocus,
  width,
  hasTVPreferredFocus
}: VideoCardProps) {
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const focusTimer = useRef<NodeJS.Timeout | null>(null);
  const isFocusedRef = useRef(false);

  const isPoster = aspectRatio < 1;

  const handleFocus = (focused: boolean) => {
    isFocusedRef.current = focused;
    
    if (focused) {
      focusTimer.current = setTimeout(async () => {
        try {
          const stream = await youtubeService.getStream(id);
          if (stream && isFocusedRef.current) {
            setPreviewUrl(stream.url);
            setIsPreviewing(true);
          }
        } catch (e) {
          console.error('[VideoCard] Preview fetch failed:', e);
        }
      }, 1500); 
    } else {
      if (focusTimer.current) clearTimeout(focusTimer.current);
      setIsPreviewing(false);
      setPreviewUrl(null);
    }
  };

  return (
    <FocusablePressable 
      onPress={onPress}
      onFocus={() => {
        handleFocus(true);
        onFocus?.();
      }}
      onBlur={() => handleFocus(false)}
      style={[
        { marginRight: 24, marginBottom: 32 },
        !width && { width: isPoster ? 260 : 440 },
        width ? { width } : {}
      ]}
      activeScale={1.06}
      hasTVPreferredFocus={hasTVPreferredFocus}
    >
      {({ isFocused }) => (
        <View style={{ width: '100%' }}>
          {/* Main Container with Focus Ring and Glow */}
          <View 
            style={{ 
              backgroundColor: '#1a1a1a', 
              borderRadius: 24, 
              overflow: 'hidden', 
              borderWidth: 4,
              borderColor: isFocused ? (isPoster ? '#FF4B4B' : '#FFFFFF') : 'transparent',
              aspectRatio,
              width: '100%',
              // Focus Glow (Shadow)
              shadowColor: isFocused ? '#FFFFFF' : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: isFocused ? 0.35 : 0,
              shadowRadius: 28,
              elevation: isFocused ? 20 : 0,
            }}
          >
            {/* Main Thumbnail */}
            <Image 
              source={{ uri: thumbnail || getHQThumbnail(id) }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
              onError={(e) => {
                console.warn(`[VideoCard] Image failed to load for video ${id}`);
              }}
            />

            {/* Subtle Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            {/* Video Preview */}
            {isFocused && isPreviewing && previewUrl && (
              <VideoPreview url={previewUrl} aspectRatio={aspectRatio} />
            )}

            {/* Poster Info Overlay (Only for Posters) */}
            {isPoster && !isFocused && (
                <View className="absolute inset-0 p-4 justify-end">
                    <View className="bg-red-600/90 self-start px-3 py-1 rounded-lg mb-2 shadow-lg">
                        <Text className="text-white text-[12px] font-black uppercase tracking-wider">Movie</Text>
                    </View>
                </View>
            )}

            {/* Time Badge (Bottom-Right) */}
            {!isLive && !isPoster && (
              <View 
                className="absolute bottom-3 right-3 bg-black/85 px-2.5 py-1.5 rounded-xl border border-white/10"
                style={{ shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 4 }}
              >
                <Text className="text-white text-[15px] font-black tracking-tight">{duration}</Text>
              </View>
            )}

            {/* Live Badge */}
            {isLive && (
              <View className="absolute top-4 left-4 bg-red-600 px-4 py-1.5 rounded-xl shadow-2xl shadow-red-600/60 border border-white/20">
                <View className="flex-row items-center">
                  <View className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
                  <Text className="text-white text-[14px] font-black uppercase tracking-widest">Live</Text>
                </View>
              </View>
            )}

            {/* Progress Bar */}
            {progress !== undefined && (
              <View className="absolute bottom-0 left-0 right-0 h-2 bg-white/20">
                <View className="h-full bg-red-600" style={{ width: `${progress * 100}%` }} />
              </View>
            )}
          </View>
          
          <View className={cn("mt-4 px-1", isPoster && "items-center")}>
            <Text 
              className={cn(
                "font-black tracking-tight",
                isPoster ? "text-xl text-center leading-[1.1]" : "text-2xl leading-[1.2] mb-1",
                isFocused ? "text-white" : "text-zinc-300"
              )}
              numberOfLines={isPoster ? 1 : 2}
            >
              {title}
            </Text>
            
            <View className={cn("flex-row items-center", isPoster && "mt-1")}>
              <Text className={cn("font-bold", isPoster ? "text-zinc-500 text-base" : "text-zinc-500 text-xl")}>
                {isPoster ? views.split(' ')[0] + ' views' : channel}
              </Text>
              {!isPoster && (
                <View className="flex-row items-center">
                  <View className="ml-2 bg-zinc-700 rounded-full w-4 h-4 items-center justify-center mr-2">
                    <Text className="text-zinc-400 text-[8px] font-black">✓</Text>
                  </View>
                  <Text style={{ color: '#52525b', fontSize: 14 }}>•</Text>
                  <Text style={{ color: '#a1a1aa', fontSize: 14, marginLeft: 8 }}>{views} views</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      )}
    </FocusablePressable>
  );
});
