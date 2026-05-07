import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { View, Text, ActivityIndicator, Image, StyleSheet, useWindowDimensions, FlatList } from 'react-native';
import { youtubeService, Video } from '@/lib/youtube';
import { useAppStore } from '@/lib/store';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Play, Flame, Zap, Clock, ThumbsUp, MessageCircle, Share2, Music } from 'lucide-react-native';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming, Easing,
  FadeIn, FadeInUp, FadeInDown
} from 'react-native-reanimated';
import { useScreenGC } from '@/lib/useScreenGC';

const SHORTS_CATEGORIES = [
  { label: 'Trending', icon: Flame, color: '#FF4400' },
  { label: 'Funny', icon: Zap, color: '#FFCC00' },
  { label: 'Gaming', icon: Zap, color: '#00FF99' },
  { label: 'Music', icon: Music, color: '#FF00FF' },
];

const PREVIEW_DELAY = 1200;

const ShortsAmbientBg = memo(({ thumbnail }: { thumbnail: string | null }) => {
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    if (thumbnail) {
      bgOpacity.value = 0;
      bgOpacity.value = withTiming(0.4, { duration: 800 });
    }
  }, [thumbnail]);

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
       <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050505' }]} />
       {thumbnail && (
         <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
            <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} blurRadius={70} />
            <LinearGradient colors={['rgba(5,5,5,0.4)', 'rgba(5,5,5,0.8)', '#050505']} style={StyleSheet.absoluteFill} />
         </Animated.View>
       )}
    </View>
  );
});

export default function ShortsScreen() {
  const { setAmbientState } = useAppStore();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 768;

  const [shortsData, setShortsData] = useState<Record<string, Video[]>>({});
  const [loading, setLoading] = useState(true);
  const [focusedShort, setFocusedShort] = useState<Video | null>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gcCycle, setGcCycle] = useState(0);

  // ── Screen Garbage Collector ──
  useScreenGC('Shorts', {
    delayMs: 25_000,
    onCleanup: useCallback(() => {
      setShortsData({});
      setFocusedShort(null);
      setLoading(true);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      console.log('[Shorts] 🧹 GC: Released shorts data');
    }, []),
    onReactivate: useCallback(() => {
      setGcCycle(c => c + 1);
      console.log('[Shorts] ♻️ GC: Re-fetching data');
    }, []),
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchShorts() {
      try {
        const data = await youtubeService.search("shorts viral 2024");
        if (cancelled) return;

        const sections: Record<string, Video[]> = {
          "Viral Shorts": data.slice(0, 10),
          "Suggested for You": data.slice(10, 20),
          "Trending Now": data.slice(5, 15),
        };

        setShortsData(sections);
        if (data.length > 0) setFocusedShort(data[0]);
      } catch (error) {
        console.error('Failed to fetch shorts:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchShorts();
    return () => { 
      cancelled = true;
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [gcCycle]);

  const handleFocusShort = useCallback((short: Video) => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => {
      setFocusedShort(short);
      setAmbientState(short.thumbnail, '#FF4400');
    }, 400);
  }, [setAmbientState]);

  const handlePressShort = async (video: Video) => {
    try {
      const stream = await youtubeService.getStream(video.id);
      if (stream) {
        router.push({
          pathname: "/shorts-player",
          params: {
            id: video.id,
            url: stream.url,
            title: video.title,
            channel: video.channel,
            views: video.views,
            thumbnail: video.thumbnail,
          }
        });
      }
    } catch {}
  };

  const renderHeader = useCallback(() => (
    <View>
      {/* ── VERTICAL HERO MOMENT ── */}
      <View style={{ height: 600, paddingHorizontal: isCompact ? 16 : 32, paddingTop: 40, flexDirection: 'row', alignItems: 'center' }}>
         {focusedShort && (
           <>
              {/* Featured Poster */}
              <Animated.View entering={FadeIn.duration(800)} style={{ width: 340, aspectRatio: 9/16, borderRadius: 40, overflow: 'hidden', elevation: 20 }}>
                 <Image source={{ uri: focusedShort.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                 <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
                 <View className="absolute inset-0 items-center justify-center">
                    <View className="bg-white/20 p-6 rounded-full backdrop-blur-md">
                       <Play size={48} color="white" fill="white" />
                    </View>
                 </View>
              </Animated.View>

              {/* Featured Info */}
              <View className="flex-1 ml-16">
                 <Animated.View entering={FadeIn.delay(200).duration(800)}>
                    <View className="flex-row items-center mb-6" style={{ gap: 12 }}>
                       <View className="bg-red-600 px-4 py-1.5 rounded-xl flex-row items-center">
                          <Zap size={16} color="white" />
                          <Text className="text-white font-black ml-2 text-xs tracking-widest">SHORTS</Text>
                       </View>
                       <Text className="text-zinc-400 font-bold text-xl">{focusedShort.views} loops</Text>
                    </View>

                    <Text className="text-white text-6xl font-black mb-6 tracking-tighter leading-none" numberOfLines={2}>
                       {focusedShort.title}
                    </Text>

                    <View className="flex-row items-center mb-10" style={{ gap: 24 }}>
                       <View className="flex-row items-center"><ThumbsUp size={20} color="#71717A" /><Text className="text-zinc-500 font-bold ml-2">Like</Text></View>
                       <View className="flex-row items-center"><MessageCircle size={20} color="#71717A" /><Text className="text-zinc-500 font-bold ml-2">Comment</Text></View>
                       <View className="flex-row items-center"><Share2 size={20} color="#71717A" /><Text className="text-zinc-500 font-bold ml-2">Share</Text></View>
                    </View>

                    <FocusablePressable 
                       onPress={() => handlePressShort(focusedShort)}
                       className="bg-white px-12 py-6 rounded-3xl self-start flex-row items-center shadow-2xl shadow-white/10"
                       focusedClassName="bg-red-600 scale-110 shadow-red-600/50"
                    >
                       {({ isFocused }) => (
                          <>
                             <Play size={28} color={isFocused ? 'white' : 'black'} fill={isFocused ? 'white' : 'black'} />
                             <Text className={`font-black text-2xl ml-4 ${isFocused ? 'text-white' : 'text-black'}`}>Watch Short</Text>
                          </>
                       )}
                    </FocusablePressable>
                 </Animated.View>
              </View>
           </>
         )}
      </View>

      {/* Category Navigation with Horizontal Edge Fade */}
      <View style={{ marginBottom: 40, position: 'relative' }}>
        <FlatList
          horizontal
          data={SHORTS_CATEGORIES}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 24 }}
          renderItem={({ item }) => (
            <FocusablePressable
              className="flex-row items-center bg-white/5 rounded-2xl mr-4"
              focusedClassName="bg-white scale-110 shadow-2xl shadow-white/20"
              style={{ paddingHorizontal: 24, paddingVertical: 14, gap: 10 }}
            >
              {({ isFocused }) => (
                <>
                  <item.icon size={20} color={isFocused ? 'black' : item.color} />
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
  ), [focusedShort, isCompact]);

  const renderRail = useCallback(({ item: [title, videos] }: { item: [string, Video[]] }) => {
    return (
      <View className="mb-14">
        <View style={{ paddingHorizontal: isCompact ? 16 : 48, marginBottom: 16 }}>
          <Text className="text-white text-3xl font-black tracking-tight">{title}</Text>
        </View>
        <FlatList
          horizontal
          data={videos}
          keyExtractor={(v, i) => `short-${v.id}-${i}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 48, gap: 24 }}
          renderItem={({ item }) => (
            <ShortCard 
              video={item} 
              onFocus={() => handleFocusShort(item)}
              onPress={() => handlePressShort(item)}
            />
          )}
        />
      </View>
    );
  }, [handleFocusShort]);

  if (loading) {
    return <SingularityLoader />;
  }

  return (
    <View className="flex-1">
      <ShortsAmbientBg thumbnail={focusedShort?.thumbnail || null} />
      
      <FlatList
        data={Object.entries(shortsData)}
        keyExtractor={(item) => item[0]}
        renderItem={renderRail}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const ShortCard = memo(({ video, onFocus, onPress }: any) => (
  <FocusablePressable
    onFocus={onFocus}
    onPress={onPress}
    className="rounded-[40px] overflow-hidden"
    focusedClassName="scale-110 shadow-2xl"
    activeScale={0.95}
    style={{ width: 280 }}
  >
    {({ isFocused }) => (
      <View>
        <View style={{ width: 280, aspectRatio: 9/16, borderRadius: 40, overflow: 'hidden', backgroundColor: '#111' }}>
          <Image source={{ uri: video.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
          
          <View className="absolute bottom-6 left-6 right-6">
             <Text className="text-white font-black text-lg leading-tight" numberOfLines={2}>
                {video.title}
             </Text>
             <Text className="text-white/60 font-bold text-sm mt-2">
                {video.views} loops
             </Text>
          </View>

          {isFocused && (
            <View className="absolute inset-0 items-center justify-center bg-black/10">
               <View className="bg-white/90 rounded-full items-center justify-center shadow-2xl" style={{ width: 56, height: 56 }}>
                  <Play size={24} color="black" fill="black" style={{ marginLeft: 4 }} />
               </View>
            </View>
          )}
        </View>
      </View>
    )}
  </FocusablePressable>
));
