import React, { useState } from 'react';
import { View, Text, FlatList, ScrollView, useWindowDimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { 
  Play, 
  Pause, 
  ThumbsUp, 
  ThumbsDown, 
  MoreVertical,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Radio,
  Gauge
} from 'lucide-react-native';
import { FocusablePressable } from './FocusablePressable';
import { Video } from '@/lib/youtube';
import { LyricsData } from '@/lib/lyrics';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

interface MusicPlayerOverlayProps {
  title: string;
  artist: string;
  albumArt: string;
  isPlaying: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  isLive?: boolean;
  viewerCount?: string;
  chapters?: any[];
  currentChapter?: any;
  totalDurationSeconds?: number;
  recommendations: Video[];
  lyrics?: LyricsData | null;
  activeLyricIndex?: number;
  onTogglePlay?: () => void;
  onSeek?: (delta: number) => void;
  onNext?: () => void;
  onSetSpeed?: (speed: number) => void;
  playbackSpeed?: number;
}

export function MusicPlayerOverlay({
  title,
  artist,
  albumArt,
  isPlaying,
  progress,
  currentTime,
  duration,
  isLive,
  viewerCount,
  chapters,
  currentChapter,
  totalDurationSeconds = 1,
  recommendations,
  lyrics,
  activeLyricIndex = -1,
  onTogglePlay,
  onSeek,
  onNext,
  onSetSpeed,
  playbackSpeed = 1
}: MusicPlayerOverlayProps) {
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState<'lyrics' | 'upnext'>('lyrics');
  
  const clampedProgress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const isSmallScreen = screenWidth < 1200;

  const lyricLines = lyrics?.type === 'synced' ? lyrics.lines : (lyrics?.raw ? lyrics.raw.split('\n').map(l => ({ text: l })) : []);

  return (
    <View className="absolute inset-0 flex-row px-12 py-12 md:px-20 md:py-20 bg-black/40">
      {/* Background Aura */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Image 
          source={{ uri: albumArt }} 
          style={StyleSheet.absoluteFill} 
          contentFit="cover"
          blurRadius={50}
        />
        <View className="absolute inset-0 bg-black/60" />
      </View>
      
      {/* Left Pane: Now Playing (Album Art & Controls) */}
      <View className="flex-1 justify-center z-20">
        <View className="flex-row items-center" style={{ gap: isSmallScreen ? 40 : 80 }}>
          {/* Massive Album Art with Glow */}
          <View 
            className="bg-zinc-900 rounded-[40px] overflow-hidden border border-white/10 shadow-2xl" 
            style={{ 
              width: isSmallScreen ? screenHeight * 0.4 : screenHeight * 0.55, 
              aspectRatio: 1,
              shadowColor: '#fff',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.2,
              shadowRadius: 40,
            }}
          >
            <Image source={{ uri: albumArt }} className="w-full h-full" contentFit="cover" />
          </View>

          {/* Metadata & Controls Container */}
          <View className="flex-1">
            <View className="mb-10">
              <View className="flex-row items-center mb-4" style={{ gap: 12 }}>
                {isLive && (
                  <View className="flex-row items-center bg-red-600 px-3 py-1 rounded-md">
                    <Radio size={14} color="white" />
                    <Text className="text-white text-xs font-black ml-1 uppercase">Live</Text>
                  </View>
                )}
                {currentChapter && (
                  <Text className="text-red-500 text-lg font-black uppercase tracking-widest">{currentChapter.title}</Text>
                )}
              </View>
              <Text className="text-white text-5xl md:text-7xl font-black mb-3 tracking-tighter leading-tight" numberOfLines={2}>{title}</Text>
              <Text className="text-white/60 text-2xl md:text-3xl font-bold">{artist}</Text>
            </View>

            {/* Progress Bar Container */}
            <View className="mb-12">
              <FocusablePressable 
                className="py-4"
                activeScale={1.02}
                onPress={() => onSeek?.(10)}
              >
                <View className="h-2 w-full bg-white/10 rounded-full relative overflow-visible">
                  <View className="h-full bg-white rounded-full" style={{ width: `${clampedProgress * 100}%` }} />
                  {/* Chapter Notches */}
                  {chapters?.map((chapter: any, i: number) => (
                      <View 
                          key={i}
                          className="absolute h-full w-[2px] bg-black/40"
                          style={{ left: `${(chapter.time / Math.max(1, totalDurationSeconds)) * 100}%` }}
                      />
                  ))}
                  <View className="absolute top-1/2 w-6 h-6 bg-white rounded-full shadow-lg" style={{ left: `${clampedProgress * 100}%`, marginLeft: -12, marginTop: -12 }} />
                </View>
              </FocusablePressable>
              <View className="flex-row justify-between mt-2">
                <Text className="text-white/40 font-black text-lg">{currentTime}</Text>
                <Text className="text-white/40 font-black text-lg">{duration}</Text>
              </View>
            </View>

            {/* Control Row */}
            <View className="flex-row items-center justify-between" style={{ paddingRight: 40 }}>
              <View className="flex-row items-center" style={{ gap: 20 }}>
                <IconButton icon={ThumbsUp} />
                <IconButton icon={ThumbsDown} />
                <IconButton icon={Radio} active={isLive} />
              </View>

              <View className="flex-row items-center" style={{ gap: 24 }}>
                <IconButton icon={Shuffle} small />
                <IconButton icon={SkipBack} onPress={() => onSeek?.(-10)} />
                
                <FocusablePressable 
                  onPress={onTogglePlay}
                  className="w-24 h-24 bg-white rounded-full items-center justify-center shadow-2xl"
                  focusedClassName="scale-110 bg-zinc-100"
                  activeScale={0.9}
                >
                  {isPlaying ? <Pause size={44} color="black" fill="black" /> : <Play size={44} color="black" fill="black" className="ml-1" />}
                </FocusablePressable>

                <IconButton icon={SkipForward} onPress={onNext} />
                <IconButton icon={Repeat} small />
              </View>

              <View className="flex-row items-center" style={{ gap: 20 }}>
                <IconButton icon={Gauge} onPress={() => onSetSpeed?.(playbackSpeed === 1 ? 1.5 : (playbackSpeed === 1.5 ? 2 : 1))} active={playbackSpeed !== 1} />
                <IconButton icon={MoreVertical} />
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Right Pane: Lyrics / Up Next (Always visible on TV-sized screens) */}
      {!isSmallScreen && (
        <View className="w-[500px] ml-20 py-10 z-20">
          <View className="flex-row items-center mb-10" style={{ gap: 32 }}>
            <TabButton 
              label="Lyrics" 
              active={activeTab === 'lyrics'} 
              onPress={() => setActiveTab('lyrics')} 
            />
            <TabButton 
              label="Up Next" 
              active={activeTab === 'upnext'} 
              onPress={() => setActiveTab('upnext')} 
            />
          </View>

          <View className="flex-1 bg-white/5 rounded-[40px] border border-white/10 overflow-hidden backdrop-blur-3xl">
            {activeTab === 'lyrics' ? (
              <ScrollView 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ padding: 40 }}
              >
                {lyricLines && lyricLines.length > 0 ? lyricLines.map((line, index) => {
                  const isActive = index === activeLyricIndex;
                  const isPast = index < activeLyricIndex;
                  return (
                    <FocusablePressable
                      key={index}
                      className="mb-8 rounded-2xl p-2"
                      focusedClassName="bg-white/10"
                      activeScale={1.02}
                      onPress={() => {
                        if ('timeMs' in line) {
                            const seekTarget = line.timeMs / 1000;
                            onSeek?.(seekTarget - progress * totalDurationSeconds);
                        }
                      }}
                    >
                      {({ isFocused }) => (
                        <Text 
                          className={`text-4xl font-black leading-tight transition-all duration-700 tracking-tighter ${
                            isActive ? 'text-white' : 
                            isPast ? 'text-white/30' : 'text-white/10'
                          } ${isFocused ? 'scale-105' : ''}`}
                          style={{ 
                            opacity: isActive || isFocused ? 1 : (isPast ? 0.4 : 0.2)
                          }}
                        >
                          {line.text}
                        </Text>
                      )}
                    </FocusablePressable>
                  );
                }) : (
                  <View className="flex-1 items-center justify-center py-20">
                    <Text className="text-white/20 text-3xl font-black">No lyrics found</Text>
                  </View>
                )}
              </ScrollView>
            ) : (
              <FlatList
                data={recommendations}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 30 }}
                renderItem={({ item }) => (
                  <FocusablePressable
                    className="flex-row items-center mb-6 p-4 rounded-3xl bg-white/5 border border-white/5"
                    focusedClassName="bg-white scale-[1.02]"
                    onPress={() => router.push({ pathname: '/modal', params: item as any })}
                  >
                    {({ isFocused }) => (
                      <>
                        <Image source={{ uri: item.thumbnail }} className="w-24 h-24 rounded-2xl mr-5 bg-zinc-900" contentFit="cover" />
                        <View className="flex-1 justify-center">
                          <Text className={`text-xl font-black mb-1 ${isFocused ? 'text-black' : 'text-white'}`} numberOfLines={1}>{item.title}</Text>
                          <Text className={`text-lg font-bold ${isFocused ? 'text-zinc-600' : 'text-white/40'}`}>{item.channel}</Text>
                        </View>
                      </>
                    )}
                  </FocusablePressable>
                )}
              />
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function IconButton({ icon: Icon, onPress, active, small }: any) {
  return (
    <FocusablePressable 
      onPress={onPress}
      className={`rounded-full items-center justify-center ${active ? 'bg-white' : 'bg-white/10'}`}
      style={{ width: small ? 56 : 64, height: small ? 56 : 64 }}
      focusedClassName="bg-white scale-110"
      activeScale={0.9}
    >
      {({ isFocused }) => (
        <Icon 
          size={small ? 24 : 32} 
          color={active || isFocused ? "black" : "white"} 
          strokeWidth={3} 
        />
      )}
    </FocusablePressable>
  );
}

function TabButton({ label, active, onPress }: { label: string, active: boolean, onPress: () => void }) {
  return (
    <FocusablePressable onPress={onPress} className="pb-2">
      {({ isFocused }) => (
        <View className="items-center">
          <Text className={`text-3xl font-black ${active ? 'text-white' : 'text-white/40'} ${isFocused ? 'text-white' : ''}`}>
            {label}
          </Text>
          {active && <View className="h-1.5 w-8 bg-white rounded-full mt-2" />}
        </View>
      )}
    </FocusablePressable>
  );
}
