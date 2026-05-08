import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { View, Text, Image, FlatList, useWindowDimensions, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { playVideo } from '@/lib/navigation';
import { LinearGradient } from 'expo-linear-gradient';
import { youtubeService, Video } from '@/lib/youtube';
import { useAppStore } from '@/lib/store';
import { Signal, Tv, Radio, Calendar, Info, Play, MessageSquare, Heart, Share2, Search, Zap, Users, ChevronRight, Globe, Trophy, Gamepad2 } from 'lucide-react-native';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming, Easing,
  withDelay,
  FadeInUp,
  FadeIn,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

const LIVE_CATEGORIES = [
  { label: 'All', icon: Tv },
  { label: 'News', icon: Globe },
  { label: 'Sports', icon: Trophy },
  { label: 'Gaming', icon: Gamepad2 },
];

const PREVIEW_DELAY = 1500;

// ── Pulsing "On Air" Ambient Background ──
const LiveAmbientBg = memo(({ thumbnail, isPreviewPlaying, previewUrl, player }: any) => {
  const pulse = useSharedValue(0.2);
  const bgOpacity = useSharedValue(0);
  const videoOpacity = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(0.4, { duration: 2000 }), withTiming(0.2, { duration: 2000 })), -1, true);
  }, []);

  useEffect(() => {
    if (thumbnail) {
      bgOpacity.value = 0;
      bgOpacity.value = withTiming(0.4, { duration: 1000 });
    }
  }, [thumbnail]);

  useEffect(() => {
    if (isPreviewPlaying) {
      videoOpacity.value = withTiming(1, { duration: 1500 });
    } else {
      videoOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [isPreviewPlaying]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  const videoStyle = useAnimatedStyle(() => ({ opacity: videoOpacity.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
       {/* Base Dark Room */}
       <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050505' }]} />
       
       {/* Pulsing Red Glow */}
       <Animated.View style={[StyleSheet.absoluteFill, pulseStyle]}>
          <LinearGradient colors={['rgba(255,0,0,0.15)', 'transparent', 'rgba(255,0,0,0.05)']} style={StyleSheet.absoluteFill} />
       </Animated.View>

       {/* Clear Content Background (No Blur) */}
       {thumbnail && (
         <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
            <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <LinearGradient colors={['transparent', 'rgba(5,5,5,0.6)', '#050505']} style={StyleSheet.absoluteFill} />
         </Animated.View>
       )}

       {/* Live Video Preview Background */}
       {isPreviewPlaying && previewUrl && (
         <Animated.View style={[StyleSheet.absoluteFill, videoStyle]}>
            <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
            <LinearGradient colors={['rgba(5,5,5,0.3)', 'rgba(5,5,5,0.7)', '#050505']} style={StyleSheet.absoluteFill} />
         </Animated.View>
       )}
    </View>
  );
});

export default function LiveGuideScreen() {
  const router = useRouter();
  const { setAmbientState } = useAppStore();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isCompact = screenWidth < 768;

  const [channels, setChannels] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [focusedVideo, setFocusedVideo] = useState<Video | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFocusedIdRef = useRef<string | null>(null);
  const activePreviewSourceRef = useRef<string | null>(null);

  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.volume = 0;
  });

  useEffect(() => {
    let cancelled = false;

    async function replacePreviewSource() {
      if (activePreviewSourceRef.current === previewUrl) return;
      activePreviewSourceRef.current = previewUrl;

      if (!previewUrl) {
        player.pause();
        await player.replaceAsync(null);
        return;
      }

      await player.replaceAsync(previewUrl);
      if (!cancelled && isPreviewPlaying) {
        player.play();
      }
    }

    replacePreviewSource().catch((error) => {
      console.warn('[LiveGuide] Preview source failed:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [player, previewUrl, isPreviewPlaying]);

  useEffect(() => {
    if (!previewUrl) return;

    if (isPreviewPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [player, previewUrl, isPreviewPlaying]);

  useEffect(() => {
    let cancelled = false;
    async function loadLive() {
      try {
        const liveVids = await youtubeService.getLiveChannels();
        if (cancelled) return;
        setChannels(liveVids);
        if (liveVids.length > 0) setFocusedVideo(liveVids[0]);
      } catch (e) {
        console.error('[LiveGuide] Error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadLive();
    return () => { 
      cancelled = true; 
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  const handleFocusVideo = useCallback((video: Video) => {
    setFocusedVideo(video);
    setIsPreviewPlaying(false);
    
    // Header Inheritance
    setAmbientState(video.thumbnail, '#FF0000');

    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (lastFocusedIdRef.current === video.id) return;
    lastFocusedIdRef.current = video.id;

    previewTimerRef.current = setTimeout(async () => {
      try {
        const stream = await youtubeService.getStream(video.id);
        if (stream && lastFocusedIdRef.current === video.id) {
          setPreviewUrl(stream.url);
          setIsPreviewPlaying(true);
        }
      } catch {}
    }, PREVIEW_DELAY);
  }, []);

  const renderHeader = useCallback(() => (
    <View>
      {/* ── BORDERLESS LIVE HERO ── */}
      <View style={{ height: 600, paddingHorizontal: isCompact ? 20 : 48, paddingTop: 60, justifyContent: 'center' }}>
        {focusedVideo && (
           <Animated.View entering={FadeIn.duration(1000)}>
              <View className="flex-row items-center mb-6" style={{ gap: 12 }}>
                 <View className="flex-row items-center bg-red-600 px-5 py-2 rounded-xl shadow-2xl shadow-red-600/50">
                    <Radio size={18} color="white" />
                    <Text className="text-white font-black ml-2 text-base tracking-widest uppercase">Live Now</Text>
                 </View>
                 {focusedVideo.views && (
                    <View className="flex-row items-center bg-white/10 px-5 py-2 rounded-xl backdrop-blur-md">
                       <Users size={18} color="white" />
                       <Text className="text-white font-bold ml-2 text-base">{focusedVideo.views}</Text>
                    </View>
                 )}
              </View>

              <Text 
                className="text-white font-black tracking-tighter mb-4" 
                style={{ fontSize: isCompact ? 32 : 72, lineHeight: isCompact ? 38 : 78 }}
                numberOfLines={2}
              >
                 {focusedVideo.title}
              </Text>
              
              <View className="flex-row items-center mb-10" style={{ gap: 12 }}>
                 <View className="bg-white/10 px-5 py-2 rounded-xl">
                    <Text className="text-zinc-400 font-bold text-xl">{focusedVideo.channel}</Text>
                 </View>
              </View>

              <View className="flex-row" style={{ gap: 20 }}>
                 <FocusablePressable 
                    className="bg-white px-12 py-6 rounded-3xl flex-row items-center"
                    focusedClassName="bg-red-600 scale-110 shadow-2xl shadow-red-600/50"
                    onPress={() => focusedVideo && playVideo(focusedVideo)}
                 >
                    {({ isFocused }) => (
                       <>
                          <Play size={32} color={isFocused ? 'white' : 'black'} fill={isFocused ? 'white' : 'black'} />
                          <Text className={`font-black text-2xl ml-4 ${isFocused ? 'text-white' : 'text-black'}`}>Watch Live</Text>
                       </>
                    )}
                 </FocusablePressable>
                 <FocusablePressable 
                    className="bg-white/10 px-10 py-6 rounded-3xl flex-row items-center backdrop-blur-md"
                    focusedClassName="bg-white/20 scale-110"
                 >
                    <Signal size={32} color="white" />
                    <Text className="text-white font-black text-2xl ml-4">Full Guide</Text>
                 </FocusablePressable>
              </View>
           </Animated.View>
        )}
      </View>

      {/* Category Navigation with Horizontal Edge Fade */}
      <View style={{ marginBottom: 40, position: 'relative' }}>
        <FlatList
          horizontal
          data={LIVE_CATEGORIES}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 48 }}
          renderItem={({ item }) => (
            <FocusablePressable
              onPress={() => setActiveCategory(item.label)}
              className="flex-row items-center bg-white/5 rounded-2xl mr-4"
              focusedClassName="bg-white scale-110 shadow-xl shadow-white/20"
              style={{ paddingHorizontal: 24, paddingVertical: 14, gap: 10 }}
            >
              {({ isFocused }) => (
                <>
                  <item.icon size={22} color={isFocused ? 'black' : 'white'} />
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

  const renderRail = useCallback(({ item: [title, videos] }: { item: [string, Video[]] }) => {
    return (
      <View className="mb-14">
        <View style={{ paddingHorizontal: isCompact ? 16 : 48, marginBottom: 16 }}>
          <Text className="text-white text-3xl font-black tracking-tight">{title}</Text>
        </View>
        <FlatList
          horizontal
          data={videos}
          keyExtractor={(v, i) => `live-${v.id}-${i}`}
          showsHorizontalScrollIndicator={false}
          removeClippedSubviews={false}
          contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 48, gap: 24 }}
          renderItem={({ item }) => (
            <LiveVideoCard 
              video={item} 
              onFocus={() => handleFocusVideo(item)}
              onPress={() => playVideo(item)}
            />
          )}
        />
      </View>
    );
  }, [handleFocusVideo]);

  if (loading && !focusedVideo) {
    return <SingularityLoader />;
  }

  const sections: Record<string, Video[]> = {
    "Currently Live": channels,
    "Trending Streams": [...channels].reverse(),
    "Global News": channels.slice(0, 5),
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <LiveAmbientBg 
        thumbnail={focusedVideo?.thumbnail || null} 
        isPreviewPlaying={isPreviewPlaying}
        previewUrl={previewUrl}
        player={player}
      />
      
      <FlatList
        data={Object.entries(sections)}
        keyExtractor={(item) => item[0]}
        renderItem={renderRail}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const LiveVideoCard = memo(({ video, onFocus, onPress }: any) => (
  <FocusablePressable
    onFocus={onFocus}
    onPress={onPress}
    className="rounded-[40px] overflow-hidden"
    focusedClassName="scale-110 shadow-2xl"
    activeScale={0.95}
    style={{ width: 440 }}
  >
    {({ isFocused }) => (
      <View>
        <View style={{ width: 440, aspectRatio: 16/9, borderRadius: 40, overflow: 'hidden', backgroundColor: '#111' }}>
          <Image source={{ uri: video.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
          
          <View className="absolute top-6 left-6 flex-row items-center bg-red-600 px-4 py-1.5 rounded-xl">
             <Signal size={14} color="white" />
             <Text className="text-white font-black text-xs ml-2 tracking-widest uppercase">Live</Text>
          </View>

          {video.views && (
             <View className="absolute bottom-6 right-6 bg-black/60 px-4 py-1.5 rounded-xl flex-row items-center">
                <Users size={14} color="white" />
                <Text className="text-white font-bold text-sm ml-2">{video.views}</Text>
             </View>
          )}

          {isFocused && (
            <View className="absolute inset-0 items-center justify-center bg-black/10">
               <View className="bg-white/90 rounded-full items-center justify-center shadow-2xl" style={{ width: 64, height: 64 }}>
                  <Play size={28} color="black" fill="black" style={{ marginLeft: 4 }} />
               </View>
            </View>
          )}
        </View>

        <View className="mt-5 px-3">
          <Text className={`font-black text-2xl tracking-tight ${isFocused ? 'text-white' : 'text-zinc-300'}`} numberOfLines={1}>
            {video.title}
          </Text>
          <Text className="text-zinc-500 font-bold text-xl mt-1" numberOfLines={1}>
            {video.channel}
          </Text>
        </View>
      </View>
    )}
  </FocusablePressable>
));
