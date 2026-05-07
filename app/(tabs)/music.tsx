import React, { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, useWindowDimensions, StyleSheet, Image } from 'react-native';
import { youtubeService, Video } from '@/lib/youtube';
import { useAppStore } from '@/lib/store';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Play, Music2, Disc3, TrendingUp, Sparkles, Radio, Mic2, Shuffle } from 'lucide-react-native';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming, Easing,
  withDelay,
  FadeInUp,
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

export default function MusicScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isCompact = screenWidth < 768;

  const [musicData, setMusicData] = useState<Record<string, Video[]>>({});
  const [loading, setLoading] = useState(true);
  const [focusedVideo, setFocusedVideo] = useState<Video | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocusedIdRef = useRef<string | null>(null);
  const [gcCycle, setGcCycle] = useState(0);

  const { 
    globalVideo, 
    globalStreamUrl, 
    isGlobalPlaying,
    setGlobalPlayback, 
    setGlobalPlaying,
    setAmbientState
  } = useAppStore();

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

  // The player now lives in the Modal or is shared.
  // For the Music screen preview, we still use useVideoPlayer but with global sync.
  const player = useVideoPlayer(globalStreamUrl || '', (p) => {
    p.loop = true;
    p.volume = 0.2;
    if (globalStreamUrl) p.play();
  });

  // Keep global playing state in sync with local preview
  useEffect(() => {
    if (isFocused && isPreviewPlaying) {
      setGlobalPlaying(true);
    }
  }, [isFocused, isPreviewPlaying]);

  // Stop preview when leaving
  useEffect(() => {
    if (!isFocused) {
      setIsPreviewPlaying(false);
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
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    
    previewTimerRef.current = setTimeout(async () => {
      setFocusedVideo(video);
      bgOpacity.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) });
      videoOpacity.value = withTiming(0, { duration: 300 });
      setIsPreviewPlaying(false);
      
      // Header Inheritance
      setAmbientState(video.thumbnail, '#FF0055');

      // Only fetch stream preview if screen is still focused
      if (!isFocused) return;
      try {
        const stream = await youtubeService.getStream(video.id);
        if (stream && lastFocusedIdRef.current === video.id && isFocused) {
          setGlobalPlayback(video, stream.url);
          setIsPreviewPlaying(true);
          videoOpacity.value = withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) });
        }
      } catch {}
    }, 800); // Longer throttle to reduce stream fetches

    lastFocusedIdRef.current = video.id;
  }, [setAmbientState, isFocused, setGlobalPlayback]);

  const bgAnimStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const videoAnimStyle = useAnimatedStyle(() => ({ opacity: videoOpacity.value }));

  const renderHeader = useCallback(() => (
    <View>
      {/* Dynamic Hero Section */}
      <View style={{ height: 560, paddingHorizontal: isCompact ? 16 : 32, paddingTop: 40, justifyContent: 'center' }}>
        {focusedVideo && (
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
                       // We don't kill the preview because we want the Modal to pick it up!
                       if (focusedVideo) {
                         router.push({ 
                           pathname: '/modal', 
                           params: { ...focusedVideo, type: 'music' } as any 
                         });
                       }
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
        )}
      </View>

      {/* Categories with Horizontal Edge Fade */}
      <View style={{ marginBottom: 40, position: 'relative' }}>
        <FlatList
          horizontal
          data={MUSIC_CATEGORIES}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 24 }}
          renderItem={({ item }) => (
            <FocusablePressable
              className="flex-row items-center bg-white/5 rounded-3xl mr-4"
              focusedClassName="bg-white scale-110 shadow-2xl shadow-white/20"
              style={{ paddingHorizontal: 24, paddingVertical: 14, gap: 10 }}
            >
              {({ isFocused }) => (
                <>
                  <item.icon size={22} color={isFocused ? 'black' : item.color} />
                  <Text className="font-black text-xl" style={{ color: isFocused ? 'black' : 'white' }}>
                    {item.label}
                  </Text>
                </>
              )}
            </FocusablePressable>
          )}
        />
        {/* Left Fade */}
        <LinearGradient
          colors={['#050505', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 60, zIndex: 10, pointerEvents: 'none' }}
        />
        {/* Right Fade */}
        <LinearGradient
          colors={['transparent', '#050505']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 60, zIndex: 10, pointerEvents: 'none' }}
        />
      </View>
    </View>
  ), [focusedVideo, isCompact]);

  const renderRail = useCallback(({ item: [title, videos] }: { item: [string, Video[]], index: number }) => {
    const isSquare = title === "Your Favorites" || title === "Relaxing Vibes";
    const cardSize = isSquare ? (isCompact ? 220 : 300) : (isCompact ? 320 : 420);
    
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
          renderItem={({ item }) => (
            <MusicCard 
              video={item} 
              isSquare={isSquare} 
              size={cardSize}
              onFocus={() => handleCardFocus(item)}
              onPress={() => {
                // Just push to modal, modal will see global playback and resume
                router.push({ 
                  pathname: '/modal', 
                  params: { ...item, type: 'music' } as any 
                });
              }}
            />
          )}
          initialNumToRender={4}
          windowSize={5}
          maxToRenderPerBatch={4}
          removeClippedSubviews={true}
        />
      </View>
    );
  }, [handleCardFocus, isCompact]);

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
        data={Object.entries(musicData)}
        keyExtractor={(item) => item[0]}
        renderItem={renderRail}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={2}
        windowSize={5}
        maxToRenderPerBatch={2}
        removeClippedSubviews={true}
      />
    </View>
  );
}

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
});
