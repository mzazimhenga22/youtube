import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, FlatList, ScrollView, useWindowDimensions, StyleSheet, Pressable } from 'react-native';
import {
  Play, Pause, ThumbsUp, ThumbsDown, MessageSquare, ClosedCaption,
  Settings, Activity, Zap, ChevronRight, MonitorPlay, Gauge,
  MessageCircle, VolumeX, Flag, SkipForward, SkipBack, Radio, Music,
} from 'lucide-react-native';
import { FocusablePressable } from './FocusablePressable';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from '@/lib/youtube';
import { useRouter } from 'expo-router';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming, interpolate, FadeIn,
} from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';

const CONTROLS_TIMEOUT = 5000; // 5 seconds like YouTube TV
const SEEK_STEP = 10; // 10 second seek

interface VideoPlayerOverlayProps {
  title: string;
  channelName: string;
  channelAvatar: string;
  isPlaying: boolean;
  progress: number;
  currentTime: string;
  duration: string;
  isLive?: boolean;
  views?: string;
  publishedAt?: string;
  videoId?: string;
  viewerCount?: string;
  chapters?: any[];
  currentChapter?: any;
  playbackSpeed?: number;
  totalDurationSeconds?: number;
  commentsCount?: string;
  recommendationRows: { title: string; data: Video[] }[];
  onTogglePlay?: () => void;
  onToggleComments?: () => void;
  onToggleLyrics?: () => void;
  onSeek?: (delta: number) => void;
  onNext?: () => void;
  onSetSpeed?: (speed: number) => void;
}

type OverlayZone = 'hidden' | 'controls' | 'cards';

export function VideoPlayerOverlay({
  title,
  channelName,
  channelAvatar,
  isPlaying,
  progress,
  currentTime,
  duration,
  isLive,
  views,
  publishedAt,
  videoId,
  viewerCount,
  chapters,
  currentChapter,
  playbackSpeed = 1,
  totalDurationSeconds = 1,
  commentsCount,
  recommendationRows,
  onTogglePlay,
  onToggleComments,
  onToggleLyrics,
  onSeek,
  onNext,
  onSetSpeed,
}: VideoPlayerOverlayProps) {
  const router = useRouter();
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [zone, setZone] = useState<OverlayZone>('controls');
  const [seekIndicator, setSeekIndicator] = useState<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seekIndicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clampedProgress = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));

  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(320, screenWidth < 768 ? screenWidth * 0.74 : screenWidth * 0.18);
  const thumbnailHeight = cardWidth * 9 / 16;
  const railHeight = thumbnailHeight + 78;

  // Refs for stable access in timers (avoids stale closures)
  const zoneRef = useRef<OverlayZone>(zone);
  const isPlayingRef = useRef(isPlaying);
  const showStatsRef = useRef(showStats);
  const showSettingsRef = useRef(showSettings);
  useEffect(() => { zoneRef.current = zone; }, [zone]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { showStatsRef.current = showStats; }, [showStats]);
  useEffect(() => { showSettingsRef.current = showSettings; }, [showSettings]);

  // Animated values
  const controlsOpacity = useSharedValue(1);
  const miniBarOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(100);

  // --- Auto-hide logic (uses refs to avoid stale closures) ---
  const handleAnyInteraction = useCallback(() => {
    if (zoneRef.current === 'hidden') {
      setZone('controls');
    } else {
      setZone('controls');
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        if (isPlayingRef.current && !showStatsRef.current && !showSettingsRef.current) {
          setZone('hidden');
        }
      }, CONTROLS_TIMEOUT);
    }
  }, []);

  useEffect(() => {
    if (showSettings) {
      handleAnyInteraction();
    }
  }, [showSettings, handleAnyInteraction]);

  // Animate zone transitions
  useEffect(() => {
    if (zone === 'controls') {
      controlsOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.ease) });
      miniBarOpacity.value = withTiming(0, { duration: 200 });
      cardsTranslateY.value = withTiming(100, { duration: 200 });
      handleAnyInteraction();
    } else if (zone === 'hidden') {
      controlsOpacity.value = withTiming(0, { duration: 350, easing: Easing.in(Easing.ease) });
      miniBarOpacity.value = withTiming(1, { duration: 400 });
      cardsTranslateY.value = withTiming(100, { duration: 200 });
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else if (zone === 'cards') {
      controlsOpacity.value = withTiming(0.4, { duration: 250 });
      miniBarOpacity.value = withTiming(0, { duration: 200 });
      cardsTranslateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.ease) });
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  }, [zone]);

  // When playback pauses, always show controls
  useEffect(() => {
    if (!isPlaying) {
      setZone('controls');
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else if (zoneRef.current === 'controls') {
      handleAnyInteraction();
    }
  }, [isPlaying, handleAnyInteraction]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (seekIndicatorTimer.current) clearTimeout(seekIndicatorTimer.current);
    };
  }, []);

  const showSeekIndicator = useCallback((text: string) => {
    setSeekIndicator(text);
    if (seekIndicatorTimer.current) clearTimeout(seekIndicatorTimer.current);
    seekIndicatorTimer.current = setTimeout(() => setSeekIndicator(null), 800);
  }, []);

  // --- Animated styles ---
  const controlsAnimStyle = useAnimatedStyle(() => ({
    opacity: controlsOpacity.value,
  }));

  const miniBarAnimStyle = useAnimatedStyle(() => ({
    opacity: miniBarOpacity.value,
  }));

  const cardsAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardsTranslateY.value }],
    opacity: interpolate(cardsTranslateY.value, [100, 0], [0, 1]),
  }));

  return (
    <View className="absolute inset-0" pointerEvents="box-none">
      {/* Tap-to-wake — non-focusable so it doesn't steal D-pad focus */}
      <Pressable
        onPress={handleAnyInteraction}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 5 }}
        pointerEvents={zone === 'hidden' ? 'auto' : 'box-none'}
      >
        <View style={{ flex: 1 }} />
      </Pressable>

      {/* Seek Indicator — centered on screen */}
      {seekIndicator && (
        <View
          className="absolute z-[200] items-center justify-center"
          style={{ top: '40%', left: 0, right: 0 }}
          pointerEvents="none"
        >
          <View className="bg-black/75 px-10 py-5 rounded-2xl">
            <Text className="text-white text-4xl font-black text-center">{seekIndicator}</Text>
          </View>
        </View>
      )}

      {/* Mini Progress Bar — visible when controls are hidden */}
      <Animated.View
        style={miniBarAnimStyle}
        className="absolute bottom-0 left-0 right-0 z-30 px-0"
        pointerEvents="none"
      >
        <View className="w-full bg-white/15" style={{ height: 3 }}>
          <View className="h-full bg-red-600" style={{ width: `${clampedProgress * 100}%` }} />
        </View>
      </Animated.View>

      {/* Stats for Nerds */}
      {showStats && (
        <View className="absolute inset-0 z-[100] items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl" style={{ width: Math.min(400, screenWidth * 0.85), padding: 28 }}>
            <Text className="text-white text-xl font-black mb-5">Stats for Nerds</Text>
            <StatRow label="Video ID" value={videoId || 'unknown'} />
            <StatRow label="Resolution" value="1920x1080 @ 60fps" />
            <StatRow label="Codec" value="av01.0.08M.08 (399)" />
            <StatRow label="Connection" value="48.5 Mbps" />
            <StatRow label="Buffer" value="18.2s" />
            <FocusablePressable
              onPress={() => setShowStats(false)}
              className="mt-5 bg-white/10 py-3 rounded-full items-center"
              focusedClassName="bg-white"
            >
              {({ isFocused }) => (
                <Text className={`font-bold text-base ${isFocused ? 'text-black' : 'text-white'}`}>Close</Text>
              )}
            </FocusablePressable>
          </View>
        </View>
      )}

      {/* Settings Menu */}
      {showSettings && (
        <View className="absolute inset-0 z-[100] items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <View className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl" style={{ width: Math.min(420, screenWidth * 0.88), padding: 28 }}>
            <Text className="text-white text-2xl font-black mb-6 tracking-tight">Settings</Text>
            
            <SettingsRow icon={MonitorPlay} label="Quality" value="Auto (1080p)" />
            
            <View className="mb-4">
              <View className="flex-row items-center mb-3" style={{ gap: 10 }}>
                <Gauge size={22} color="white" opacity={0.7} />
                <Text className="text-white text-base font-black">Playback Speed</Text>
              </View>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <FocusablePressable
                    key={speed}
                    onPress={() => onSetSpeed?.(speed)}
                    onFocus={handleAnyInteraction}
                    className={`px-4 py-2 rounded-xl border ${playbackSpeed === speed ? 'bg-red-600 border-red-600' : 'bg-white/5 border-white/10'}`}
                    focusedClassName="bg-white"
                  >
                    {({ isFocused }) => (
                      <Text className={`font-bold ${isFocused ? 'text-black' : 'text-white'}`}>{speed === 1 ? 'Normal' : `${speed}x`}</Text>
                    )}
                  </FocusablePressable>
                ))}
              </View>
            </View>

            <SettingsRow icon={MessageCircle} label="Captions" value="English" />
            <SettingsRow icon={VolumeX} label="Stable volume" value="On" />
            <SettingsRow icon={Flag} label="Report" value="" />

            <FocusablePressable
              onPress={() => setShowSettings(false)}
              className="mt-6 bg-white/10 py-3 rounded-full items-center"
              focusedClassName="bg-white"
            >
              {({ isFocused }) => (
                <Text className={`text-base font-bold ${isFocused ? 'text-black' : 'text-white'}`}>Close</Text>
              )}
            </FocusablePressable>
          </View>
        </View>
      )}

      {/* ═══════════ CONTROLS LAYER ═══════════ */}
      <Animated.View
        style={controlsAnimStyle}
        className="absolute inset-0 z-40 justify-end"
        pointerEvents={zone === 'controls' ? 'auto' : 'none'}
      >
        {/* Bottom gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.92)']}
          className="absolute bottom-0 left-0 right-0 h-[55%]"
          pointerEvents="none"
        />

        <View className="px-8 md:px-16 pb-8 md:pb-12">
          {/* Title & Channel */}
          <View className="mb-4 md:mb-6">
            <View className="flex-row items-center mb-2">
              {isLive && (
                <View className="flex-row items-center bg-red-600 px-3 py-1 rounded-md mr-3 shadow-lg shadow-red-600/40">
                  <Radio size={14} color="white" />
                  <Text className="text-white text-sm font-black ml-1">LIVE</Text>
                  {viewerCount && (
                    <Text className="text-white/80 text-[10px] font-black ml-2 border-l border-white/20 pl-2">{viewerCount}</Text>
                  )}
                </View>
              )}
              <Text className="text-white text-2xl md:text-4xl font-black tracking-tighter flex-1" numberOfLines={1}>{title}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden mr-3 border-2 border-white/20">
                <Image source={{ uri: channelAvatar }} className="w-full h-full" />
              </View>
              <Text className="text-white/50 text-lg md:text-xl font-bold">{channelName}</Text>
              {(views || publishedAt) && (
                <View className="flex-row items-center ml-4" style={{ gap: 6 }}>
                  {views ? <Text className="text-white/30 text-sm font-bold">{views}</Text> : null}
                  {views && publishedAt ? <Text className="text-white/20 text-sm">•</Text> : null}
                  {publishedAt ? <Text className="text-white/30 text-sm font-bold">{publishedAt}</Text> : null}
                </View>
              )}
            </View>
          </View>

          {/* Current Chapter Title */}
          {currentChapter && (
            <Animated.View entering={FadeIn.duration(400)} className="mb-2">
              <Text className="text-red-500 text-base md:text-lg font-black uppercase tracking-widest">{currentChapter.title}</Text>
            </Animated.View>
          )}

          {/* Progress Bar */}
          <View className="mb-2 md:mb-4">
            <FocusablePressable
              onFocus={handleAnyInteraction}
              className="py-3"
              focusedClassName=""
              activeScale={1}
            >
              <View className="w-full bg-white/20 rounded-full relative overflow-visible" style={{ height: 6 }}>
                {/* Background segments if chapters exist */}
                {chapters && chapters.length > 0 ? (
                  <View style={StyleSheet.absoluteFill} className="flex-row">
                    {chapters.map((chapter, i) => {
                      const nextTime = chapters[i+1]?.time || 999999; // End of video
                      const duration = nextTime - chapter.time;
                      // This is a rough estimation since we don't have total seconds here yet
                      // We'll rely on the main red bar for actual progress
                      return null;
                    })}
                  </View>
                ) : null}

                <View className="h-full bg-red-600 rounded-full" style={{ width: `${clampedProgress * 100}%` }} />
                
                {/* Chapter Notches */}
                {chapters?.map((chapter: any, i: number) => (
                    <View 
                        key={i}
                        className="absolute h-full w-[3px] bg-black/40"
                        style={{ left: `${(chapter.time / Math.max(1, totalDurationSeconds)) * 100}%` }}
                    />
                ))}

                <View
                  className="absolute top-1/2 w-6 h-6 bg-white rounded-full border-[4px] border-red-600 shadow-xl"
                  style={{ left: `${clampedProgress * 100}%`, marginLeft: -12, marginTop: -12 }}
                />
              </View>
            </FocusablePressable>
            <View className="flex-row justify-between px-1">
              <Text className="text-white/40 font-black text-base md:text-lg">{currentTime}</Text>
              <Text className="text-white/40 font-black text-base md:text-lg">{duration}</Text>
            </View>
          </View>

          {/* Controls Row — all focusable for D-pad */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Left actions */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <IconButton icon={ThumbsUp} onFocus={handleAnyInteraction} />
              <IconButton icon={ThumbsDown} onFocus={handleAnyInteraction} />
              <IconButton 
                icon={MessageSquare} 
                onPress={onToggleComments} 
                onFocus={handleAnyInteraction}
                badge={commentsCount}
              />
              <IconButton icon={Music} onPress={onToggleLyrics} onFocus={handleAnyInteraction} />
              <IconButton icon={Activity} onPress={() => { setShowStats(!showStats); handleAnyInteraction(); }} active={showStats} onFocus={handleAnyInteraction} />
            </View>

            {/* Center play/pause */}
            <View className="flex-row items-center" style={{ gap: 16 }}>
              {/* Rewind 10s */}
              <FocusablePressable
                onPress={() => { onSeek?.(-SEEK_STEP); showSeekIndicator(`−${SEEK_STEP}s`); handleAnyInteraction(); }}
                onFocus={handleAnyInteraction}
                className="w-14 h-14 md:w-16 md:h-16 bg-white/10 rounded-full items-center justify-center"
                focusedClassName="bg-white scale-110"
                activeScale={0.9}
              >
                {({ isFocused }) => (
                  <View className="items-center justify-center">
                    <SkipBack size={24} color={isFocused ? 'black' : 'rgba(255,255,255,0.7)'} strokeWidth={3} />
                    <Text className={`${isFocused ? 'text-black/60' : 'text-white/60'} text-[9px] font-black mt-[-2px]`}>10</Text>
                  </View>
                )}
              </FocusablePressable>

              {/* Play/Pause */}
              <FocusablePressable
                onPress={() => { onTogglePlay?.(); handleAnyInteraction(); }}
                onFocus={handleAnyInteraction}
                className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full items-center justify-center shadow-2xl shadow-white/20"
                focusedClassName="scale-110 bg-zinc-100"
                activeScale={0.9}
              >
                {isPlaying ? <Pause size={32} color="black" fill="black" /> : <Play size={32} color="black" fill="black" style={{ marginLeft: 3 }} />}
              </FocusablePressable>

              {/* Forward 10s */}
              <FocusablePressable
                onPress={() => { onSeek?.(SEEK_STEP); showSeekIndicator(`+${SEEK_STEP}s`); handleAnyInteraction(); }}
                onFocus={handleAnyInteraction}
                className="w-14 h-14 md:w-16 md:h-16 bg-white/10 rounded-full items-center justify-center"
                focusedClassName="bg-white scale-110"
                activeScale={0.9}
              >
                {({ isFocused }) => (
                  <View className="items-center justify-center">
                    <SkipForward size={24} color={isFocused ? 'black' : 'rgba(255,255,255,0.7)'} strokeWidth={3} />
                    <Text className={`${isFocused ? 'text-black/60' : 'text-white/60'} text-[9px] font-black mt-[-2px]`}>10</Text>
                  </View>
                )}
              </FocusablePressable>

              {/* Next Video */}
              <FocusablePressable
                onPress={() => { onNext?.(); handleAnyInteraction(); }}
                onFocus={handleAnyInteraction}
                className="w-14 h-14 md:w-16 md:h-16 bg-white/10 rounded-full items-center justify-center"
                focusedClassName="bg-white scale-110"
                activeScale={0.9}
              >
                {({ isFocused }) => (
                  <SkipForward size={24} color={isFocused ? 'black' : 'rgba(255,255,255,0.7)'} fill={isFocused ? 'black' : 'none'} strokeWidth={3} />
                )}
              </FocusablePressable>
            </View>

            {/* Right actions */}
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <IconButton icon={ClosedCaption} onFocus={handleAnyInteraction} />
              <IconButton icon={Zap} onFocus={handleAnyInteraction} />
              <IconButton icon={Settings} onPress={() => { setShowSettings(!showSettings); handleAnyInteraction(); }} active={showSettings} onFocus={handleAnyInteraction} />
            </View>
          </View>

          {/* Down arrow — navigate to cards zone */}
          <FocusablePressable
            onPress={() => setZone('cards')}
            onFocus={() => { setZone('cards'); }}
            style={{ alignItems: 'center', marginTop: 6, paddingVertical: 4 }}
            focusedClassName="opacity-100"
            activeScale={1}
          >
            <ChevronRight size={20} color="white" style={{ transform: [{ rotate: '90deg' }], opacity: 0.5 }} />
          </FocusablePressable>
        </View>
      </Animated.View>

      {/* ═══════════ CARDS LAYER ═══════════ */}
      <Animated.View
        style={cardsAnimStyle}
        className="absolute bottom-0 left-0 right-0 z-50"
        pointerEvents={zone === 'cards' ? 'auto' : 'none'}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)', '#000']}
          className="absolute top-0 left-0 right-0 h-32"
          pointerEvents="none"
        />
        <ScrollView
          contentContainerStyle={{ paddingTop: 32, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
          style={{ maxHeight: screenWidth < 768 ? 320 : 420 }}
        >
          {/* Back-to-controls button */}
          <FocusablePressable
            onPress={() => setZone('controls')}
            onFocus={() => { setZone('controls'); }}
            style={{ alignItems: 'center', paddingVertical: 8 }}
            focusedClassName="opacity-100"
            activeScale={1}
          >
            <ChevronRight size={20} color="white" style={{ transform: [{ rotate: '-90deg' }], opacity: 0.4 }} />
          </FocusablePressable>
          {recommendationRows?.map((row, index) => (
            <View key={index} className="mb-8">
              <View className="px-6 md:px-16 mb-3">
                <Text className="text-white text-xl md:text-2xl font-black tracking-tight">{row.title}</Text>
              </View>
              {row.data && row.data.length > 0 ? (
                <FlatList
                  horizontal
                  data={row.data}
                  keyExtractor={(item, idx) => `${item.id}-${idx}`}
                  style={{ height: railHeight }}
                  contentContainerStyle={{ paddingHorizontal: screenWidth < 768 ? 24 : 64, paddingBottom: 8 }}
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <RecommendationCard
                      video={item}
                      width={cardWidth}
                      thumbnailHeight={thumbnailHeight}
                      onPress={() => router.push({
                        pathname: '/modal',
                        params: item as any
                      })}
                      onFocus={() => { if (zone !== 'cards') setZone('cards'); }}
                    />
                  )}
                />
              ) : (
                <FlatList
                  horizontal
                  data={[0, 1, 2, 3, 4]}
                  keyExtractor={(item) => `loading-${item}`}
                  style={{ height: railHeight }}
                  contentContainerStyle={{ paddingHorizontal: screenWidth < 768 ? 24 : 64, paddingBottom: 8 }}
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  renderItem={() => <LoadingRecommendationCard width={cardWidth} thumbnailHeight={thumbnailHeight} />}
                />
              )}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function IconButton({ icon: Icon, onPress, active, onFocus, badge }: any) {
  return (
    <FocusablePressable 
      onPress={onPress}
      onFocus={onFocus}
      className={`p-3 md:p-4 rounded-full relative ${active ? 'bg-red-600' : 'bg-white/10'}`}
      focusedClassName="bg-white"
    >
      {({ isFocused }) => (
        <View>
          <Icon size={28} color={isFocused ? "black" : "white"} strokeWidth={2.5} />
          {badge && (
            <View className="absolute -top-2 -right-2 bg-red-600 px-1.5 py-0.5 rounded-full border-2 border-zinc-950">
              <Text className="text-white text-[10px] font-black">{badge}</Text>
            </View>
          )}
        </View>
      )}
    </FocusablePressable>
  );
}

function LoadingRecommendationCard({ width, thumbnailHeight }: { width: number; thumbnailHeight: number }) {
  return (
    <View className="mr-5" style={{ width }}>
      <View className="bg-white/10 rounded-lg border border-white/10 overflow-hidden" style={{ height: thumbnailHeight }}>
        <View className="absolute inset-0 bg-zinc-800/80" />
      </View>
      <View className="pt-3">
        <View className="h-4 bg-white/15 rounded-full w-[92%] mb-2" />
        <View className="h-4 bg-white/10 rounded-full w-[64%]" />
      </View>
    </View>
  );
}

function RecommendationCard({ video, width, thumbnailHeight, onPress, onFocus }: { video: Video; width: number; thumbnailHeight: number; onPress: () => void; onFocus?: () => void }) {
  return (
    <FocusablePressable
      onPress={onPress}
      onFocus={onFocus}
      className="mr-5 rounded-xl overflow-hidden border-[3px] border-transparent"
      focusedClassName="border-white scale-105"
      activeScale={0.98}
      style={{ width }}
    >
      {({ isFocused }) => (
        <View>
          <View className="bg-zinc-900 rounded-lg overflow-hidden" style={{ height: thumbnailHeight }}>
            <Image source={{ uri: video.thumbnail }} className="w-full h-full" resizeMode="cover" />
            <View className="absolute bottom-2 right-2 bg-black/85 px-2 py-1 rounded">
              <Text className="text-white text-xs font-black">{video.duration}</Text>
            </View>
          </View>
          <View className="pt-3">
            <Text className={`text-base font-black leading-tight ${isFocused ? 'text-white' : 'text-zinc-200'}`} numberOfLines={2}>
              {video.title}
            </Text>
            <Text className="text-zinc-500 text-sm font-semibold mt-1" numberOfLines={1}>
              {video.channel}
            </Text>
          </View>
        </View>
      )}
    </FocusablePressable>
  );
}

function StatRow({ label, value }: { label: string, value: string }) {
  return (
    <View className="flex-row justify-between mb-4">
      <Text className="text-zinc-500 font-bold">{label}</Text>
      <Text className="text-white font-black">{value}</Text>
    </View>
  );
}



function SettingsRow({ icon: Icon, label, value }: any) {
  return (
    <FocusablePressable 
      className="flex-row items-center justify-between py-3 px-4 mb-1 rounded-xl"
      focusedClassName="bg-white/15 scale-[1.01]"
    >
      <View className="flex-row items-center" style={{ gap: 10 }}>
        <Icon size={22} color="white" opacity={0.7} />
        <Text className="text-white text-base font-medium">{label}</Text>
      </View>
      <View className="flex-row items-center" style={{ gap: 6 }}>
        {value ? <Text className="text-white/50 text-sm font-bold">{value}</Text> : null}
        <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
      </View>
    </FocusablePressable>
  );
}
