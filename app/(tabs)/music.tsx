import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { View, Text, FlatList, useWindowDimensions, StyleSheet, Image } from 'react-native';
import { youtubeService, Video } from '@/lib/youtube';
import { useAppStore } from '@/lib/store';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Play, Disc3, TrendingUp, Sparkles, Radio, Shuffle } from 'lucide-react-native';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { VideoView } from 'expo-video';
import { useGlobalPlayer } from '@/lib/PlayerContext';
import { playVideo } from '@/lib/navigation';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming, Easing,
  FadeIn,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useScreenGC } from '@/lib/useScreenGC';

const MUSIC_CATEGORIES = [
  { label: 'My Mix', icon: Shuffle, color: '#FF0055' },
  { label: 'For You', icon: Sparkles, color: '#7700FF' },
  { label: 'Trending', icon: TrendingUp, color: '#00FF99' },
  { label: 'New Releases', icon: Disc3, color: '#00AAFF' },
  { label: 'Live', icon: Radio, color: '#FF9900' },
];

const PREVIEW_DELAY = 1500;

// ── Background Particle/Wave Effect for "Music World" Feel ──
const MusicVisualizerBg = memo(() => {
  const wave1 = useSharedValue(0.4);
  const wave2 = useSharedValue(0.6);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      wave1.value = withRepeat(withSequence(withTiming(0.8, { duration: 3000 }), withTiming(0.4, { duration: 3000 })), -1, true);
      wave2.value = withRepeat(withSequence(withTiming(0.3, { duration: 4000 }), withTiming(0.7, { duration: 4000 })), -1, true);
    } else {
      wave1.value = withTiming(0.4, { duration: 500 });
      wave2.value = withTiming(0.6, { duration: 500 });
    }
  }, [isFocused]);

  const style1 = useAnimatedStyle(() => ({ opacity: wave1.value, transform: [{ scale: 1 + wave1.value * 0.1 }] }));
  const style2 = useAnimatedStyle(() => ({ opacity: wave2.value, transform: [{ scale: 1.2 - wave2.value * 0.1 }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
       <Animated.View style={[StyleSheet.absoluteFill, style1]}>
          <LinearGradient colors={['rgba(120,0,255,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
       </Animated.View>
       <Animated.View style={[StyleSheet.absoluteFill, style2]}>
          <LinearGradient colors={['transparent', 'rgba(255,0,100,0.08)']} style={StyleSheet.absoluteFill} />
       </Animated.View>
    </View>
  );
});

// ── Memoized Components for TV Performance ──

const CategoryChip = memo(({ item }: { item: typeof MUSIC_CATEGORIES[0] }) => {
  const Icon = item.icon;
  return (
    <FocusablePressable
      className="flex-row items-center bg-white/5 rounded-3xl mr-4"
      focusedClassName="bg-white scale-110 shadow-2xl shadow-white/20"
      style={{ paddingHorizontal: 24, paddingVertical: 14, gap: 10 }}
    >
      {({ isFocused }) => (
        <>
          <Icon size={22} color={isFocused ? 'black' : item.color} />
          <Text className="font-black text-xl" style={{ color: isFocused ? 'black' : 'white' }}>
            {item.label}
          </Text>
        </>
      )}
    </FocusablePressable>
  );
}, (prev, next) => prev.item.label === next.item.label);

const MemoizedCategoryRail = memo(({ isCompact }: { isCompact: boolean }) => (
  <View style={{ marginBottom: 40, position: 'relative' }}>
    <FlatList
      horizontal
      data={MUSIC_CATEGORIES}
      keyExtractor={(item) => item.label}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 24 }}
      initialNumToRender={5}
      windowSize={5}
      removeClippedSubviews={false} // Prevent TV focus loss
      renderItem={({ item }) => <CategoryChip item={item} />}
    />
    <LinearGradient
      colors={['#050505', 'transparent']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, zIndex: 10, pointerEvents: 'none' }}
    />
    <LinearGradient
      colors={['transparent', '#050505']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 10, pointerEvents: 'none' }}
    />
  </View>
));

const MemoizedMusicHero = memo(({ focusedVideo, isCompact }: { focusedVideo: Video | null, isCompact: boolean }) => {
  if (!focusedVideo) {
    return <View style={{ height: 560 }} />;
  }

  return (
    <View style={{ height: 560, paddingHorizontal: isCompact ? 16 : 32, paddingTop: 40, justifyContent: 'center' }}>
      <Animated.View entering={FadeIn.duration(1000)}>
        <Text className="text-red-600 font-black tracking-widest text-2xl mb-4 uppercase">
          Music World
        </Text>
        <Text
          className="text-white font-black tracking-tighter mb-4"
          style={{ fontSize: isCompact ? 32 : 64, lineHeight: isCompact ? 38 : 72 }}
          numberOfLines={2}
        >
          {focusedVideo.title}
        </Text>
        <View className="flex-row items-center mb-10" style={{ gap: 12 }}>
            <View className="bg-white/10 px-4 py-2 rounded-full border border-white/10">
              <Text className="text-zinc-400 font-bold text-lg">{focusedVideo.channel}</Text>
            </View>
            <Text className="text-zinc-500 font-bold text-lg">{focusedVideo.views} listeners</Text>
        </View>

        <View className="flex-row" style={{ gap: 16 }}>
            <FocusablePressable
              className="bg-white px-10 py-5 rounded-2xl flex-row items-center"
              focusedClassName="bg-red-600 scale-110 shadow-2xl shadow-red-600/30"
                onPress={() => {
                  playVideo(focusedVideo, { type: 'music' });
                }}
            >
              {({ isFocused }) => (
                  <>
                    <Play size={28} color={isFocused ? 'white' : 'black'} fill={isFocused ? 'white' : 'black'} />
                    <Text className={`font-black text-2xl ml-3 ${isFocused ? 'text-white' : 'text-black'}`}>Listen Now</Text>
                  </>
              )}
            </FocusablePressable>
            <FocusablePressable
              className="bg-white/10 px-10 py-5 rounded-2xl flex-row items-center"
              focusedClassName="bg-white/20 scale-110"
            >
              <Shuffle size={28} color="white" />
              <Text className="text-white font-black text-2xl ml-3">Mix</Text>
            </FocusablePressable>
        </View>
      </Animated.View>
    </View>
  );
}, (prev, next) => prev.focusedVideo?.id === next.focusedVideo?.id && prev.isCompact === next.isCompact);

const MusicCard = memo(({ video, isSquare, size, onFocus, onPress }: any) => {
  const aspectRatio = isSquare ? 1 : 16/9;

  return (
    <FocusablePressable
      onFocus={onFocus}
      onPress={onPress}
      className="rounded-[32px] overflow-hidden"
      focusedClassName="scale-110 shadow-2xl"
      activeScale={0.95}
      style={{ width: size }}
    >
      {({ isFocused }) => (
        <View>
          <View style={{ width: size, aspectRatio, borderRadius: 32, overflow: 'hidden', backgroundColor: '#111' }}>
            <Image
              source={{ uri: video.thumbnail || `https://img.youtube.com/vi/${video.id}/hqdefault.jpg` }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={StyleSheet.absoluteFill} />

            {isFocused && (
              <LinearGradient
                colors={['rgba(255, 0, 0, 0.3)', 'transparent']}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.5,
                }}
              />
            )}

            {isSquare && (
                <View className="absolute inset-0 items-center justify-center">
                    <View className={`rounded-full items-center justify-center ${isFocused ? 'bg-white' : 'bg-white/20'}`} style={{ width: 60, height: 60 }}>
                        <Play size={24} color={isFocused ? 'black' : 'white'} fill={isFocused ? 'black' : 'white'} style={{ marginLeft: 4 }} />
                    </View>
                </View>
            )}

            {!isSquare && isFocused && (
                 <View className="absolute bottom-4 right-4 bg-red-600 px-3 py-1 rounded-lg shadow-lg shadow-red-600/50">
                    <Text className="text-white font-black text-xs">MUSIC VIDEO</Text>
                 </View>
            )}
          </View>

          <View className="mt-4 px-2">
            <Text className={`font-black text-xl tracking-tight ${isFocused ? 'text-white' : 'text-zinc-300'}`} numberOfLines={1}>
              {video.title}
            </Text>
            <Text className="text-zinc-500 font-bold text-lg mt-0.5" numberOfLines={1}>
              {video.channel}
            </Text>
          </View>
        </View>
      )}
    </FocusablePressable>
  );
}, (prev, next) => (
  prev.video?.id === next.video?.id &&
  prev.video?.thumbnail === next.video?.thumbnail &&
  prev.video?.title === next.video?.title &&
  prev.video?.channel === next.video?.channel &&
  prev.isSquare === next.isSquare &&
  prev.size === next.size
));

const MemoizedMusicRail = memo(({ title, videos, isCompact, onFocusCard }: { title: string, videos: Video[], isCompact: boolean, onFocusCard: (v: Video) => void }) => {
  const isSquare = title === "Your Favorites" || title === "Relaxing Vibes";
  const cardSize = isSquare ? (isCompact ? 220 : 300) : (isCompact ? 320 : 420);

  if (!videos || videos.length === 0) return null;

  return (
    <View className="mb-14">
      <View style={{ paddingHorizontal: isCompact ? 16 : 48, marginBottom: 16 }}>
        <Text className="text-white text-3xl font-black tracking-tight">{title}</Text>
      </View>
      <FlatList
        horizontal
        data={videos}
        keyExtractor={(v, i) => `${v.id}-${i}`}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 48, gap: 20 }}
        initialNumToRender={4}
        windowSize={5}
        maxToRenderPerBatch={4}
        removeClippedSubviews={false} // Prevent TV focus loss on horizontal rails
        renderItem={({ item }) => (
          <MusicCard
            video={item}
            isSquare={isSquare}
            size={cardSize}
            onFocus={() => onFocusCard(item)}
            onPress={() => {
              // On phones/tablets, there is no "focus" concept, so tapping a card should start the preview.
              // The hero "Listen Now" button is the explicit navigation to the full player.
              if (isCompact) {
                onFocusCard(item);
                return;
              }

              playVideo(item, { type: 'music' });
            }}
          />
        )}
      />
    </View>
  );
}, (prev, next) => prev.title === next.title && prev.videos === next.videos && prev.isCompact === next.isCompact);


// ── Main Screen ──

export default function MusicScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 768;

  const [musicData, setMusicData] = useState<Record<string, Video[]>>({});
  const [loading, setLoading] = useState(true);
  const [focusedVideo, setFocusedVideo] = useState<Video | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocusedIdRef = useRef<string | null>(null);
  const previewingIdRef = useRef<string | null>(null);
  const isFocusedRef = useRef(false);
  const [gcCycle, setGcCycle] = useState(0);

  const globalStreamUrl = useAppStore((state) => state.globalStreamUrl);
  const setGlobalPlayback = useAppStore((state) => state.setGlobalPlayback);
  const setAmbientState = useAppStore((state) => state.setAmbientState);

  const bgOpacity = useSharedValue(0);
  const videoOpacity = useSharedValue(0);

  // ── Screen Garbage Collector ──
  useScreenGC('Music', {
    delayMs: 25_000,
    onCleanup: useCallback(() => {
      setMusicData({});
      setFocusedVideo(null);
      setIsPreviewPlaying(false);
      setLoading(true);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      console.log('[Music] 🧹 GC: Released music data & preview');
    }, []),
    onReactivate: useCallback(() => {
      setGcCycle(c => c + 1);
      console.log('[Music] ♻️ GC: Re-fetching data');
    }, []),
  });

  const isFocused = useIsFocused();
  const { player } = useGlobalPlayer();

  useEffect(() => {
    isFocusedRef.current = isFocused;
  }, [isFocused]);

  // Update player settings for preview if focused
  useEffect(() => {
    if (isFocused && isPreviewPlaying) {
      player.volume = 0.2;
      player.loop = true;
    } else if (!isFocused) {
      // Restore full volume when leaving music tab if something is still playing
      player.volume = 1.0;
      player.loop = false;
    }
  }, [isFocused, isPreviewPlaying, player]);

  // Stop preview when leaving
  useEffect(() => {
    if (!isFocused) {
      setIsPreviewPlaying(false);
      previewingIdRef.current = null;
      videoOpacity.value = withTiming(0, { duration: 200 });
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    }
  }, [isFocused]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [home, trending, relax, workout] = await Promise.all([
          youtubeService.getVideosByCategory('Official Music Videos'),
          youtubeService.getVideosByCategory('Trending music'),
          youtubeService.getVideosByCategory('Lofi hip hop relax'),
          youtubeService.getVideosByCategory('High energy workout music'),
        ]);

        if (cancelled) return;

        const data: Record<string, Video[]> = {
          "Your Favorites": home,
          "Trending Now": trending,
          "Relaxing Vibes": relax,
          "Energy Boost": workout,
        };

        setMusicData(data);
        if (home.length > 0) setFocusedVideo(home[0]);
        setLoading(false);
      } catch (error) {
        console.error('[MusicScreen] Fetch error:', error);
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => {
      cancelled = true;
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, [gcCycle]);

  const handleCardFocus = useCallback((video: Video) => {
    if (!video?.id) return;

    const isNewFocus = lastFocusedIdRef.current !== video.id;
    lastFocusedIdRef.current = video.id;

    if (isNewFocus) {
      setFocusedVideo((current) => current?.id === video.id ? current : video);
      setAmbientState(video.thumbnail, '#FF0055');
      bgOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });
      videoOpacity.value = withTiming(0, { duration: 180 });
      setIsPreviewPlaying(false);
      previewingIdRef.current = null;
    } else if (previewingIdRef.current === video.id) {
      return;
    }

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);

    const requestedVideoId = video.id;
    previewTimerRef.current = setTimeout(async () => {
      if (!isFocusedRef.current || lastFocusedIdRef.current !== requestedVideoId) return;

      try {
        const { globalVideo, globalStreamUrl: currentStreamUrl } = useAppStore.getState();
        if (globalVideo?.id === requestedVideoId && currentStreamUrl) {
          previewingIdRef.current = requestedVideoId;
          setIsPreviewPlaying(true);
          videoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) });
          return;
        }

        const stream = await youtubeService.getStream(video.id);
        if (stream && lastFocusedIdRef.current === video.id && isFocusedRef.current) {
          setGlobalPlayback(video, stream.url);
          previewingIdRef.current = video.id;
          setIsPreviewPlaying(true);
          videoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) });
        }
      } catch {}
    }, PREVIEW_DELAY);
  }, [setAmbientState, setGlobalPlayback, bgOpacity, videoOpacity]);

  const bgAnimStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const videoAnimStyle = useAnimatedStyle(() => ({ opacity: videoOpacity.value }));

  const renderHeader = useCallback(() => (
    <View>
      <MemoizedMusicHero focusedVideo={focusedVideo} isCompact={isCompact} />
      <MemoizedCategoryRail isCompact={isCompact} />
    </View>
  ), [focusedVideo, isCompact]);

  const renderRail = useCallback(({ item: [title, videos] }: { item: [string, Video[]], index: number }) => {
    return (
      <MemoizedMusicRail
        title={title}
        videos={videos}
        isCompact={isCompact}
        onFocusCard={handleCardFocus}
      />
    );
  }, [handleCardFocus, isCompact]);

  // Pre-calculate data array for FlatList to avoid inline object extraction
  const flatListData = useMemo(() => Object.entries(musicData), [musicData]);

  if (loading && Object.keys(musicData).length === 0) {
    return <SingularityLoader />;
  }

  return (
    <View className="flex-1 bg-[#050505]">
      {/* ── AMBIENT LAYERS ── */}
      <MusicVisualizerBg />

      {focusedVideo && (
        <Animated.View style={[StyleSheet.absoluteFill, bgAnimStyle]}>
          <Image
            source={{ uri: focusedVideo.thumbnail || `https://img.youtube.com/vi/${focusedVideo.id}/maxresdefault.jpg` }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <LinearGradient colors={['transparent', 'rgba(5,5,5,0.6)', '#050505']} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}

      {isFocused && isPreviewPlaying && globalStreamUrl && (
        <Animated.View style={[StyleSheet.absoluteFill, videoAnimStyle]}>
          <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
          <LinearGradient colors={['rgba(5,5,5,0.3)', 'rgba(5,5,5,0.7)', '#050505']} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}

      {/* ── CONTENT ── */}
      <FlatList
        data={flatListData}
        keyExtractor={(item) => item[0]}
        renderItem={renderRail}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={2}
        windowSize={3} // Reduced for TV
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={150} // Added for TV
        removeClippedSubviews={false}
      />
    </View>
  );
}
