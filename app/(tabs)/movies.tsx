import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { View, Text, ActivityIndicator, Image, StyleSheet, useWindowDimensions, FlatList } from 'react-native';
import { youtubeService, Video } from '@/lib/youtube';
import { useAppStore } from '@/lib/store';
import { HorizontalRail } from '@/components/tv/HorizontalRail';
import { LinearGradient } from 'expo-linear-gradient';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Play, Plus } from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay,
  FadeInUp,
  FadeIn
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { Easing } from 'react-native-reanimated';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { useScreenGC } from '@/lib/useScreenGC';

const MOVIE_CATEGORIES = [
  "Action Blockbusters",
  "Comedy Movies",
  "Sci-Fi & Fantasy",
  "Horror & Thriller",
  "Documentaries",
  "Family Movies",
  "Classic Cinema"
];

// ── Borderless Theater Background (No Blur as requested) ──
const TheaterBackground = memo(({ thumbnail }: { thumbnail: string | null }) => {
  const bgOpacity = useSharedValue(0);

  useEffect(() => {
    if (thumbnail) {
      bgOpacity.value = 0;
      bgOpacity.value = withTiming(0.6, { duration: 1500, easing: Easing.out(Easing.ease) });
    } else {
      bgOpacity.value = withTiming(0.1, { duration: 800 });
    }
  }, [thumbnail]);

  const bgAnimStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Base "Dark Room" Layer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050505' }]} />
      
      {/* 
          CLEAR Hero Background (No Blur)
          Fades in/out when focus changes 
      */}
      {thumbnail && (
        <Animated.View style={[StyleSheet.absoluteFill, bgAnimStyle]}>
          <Image
            source={{ uri: thumbnail }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
          <LinearGradient colors={['transparent', 'rgba(5,5,5,0.6)', '#050505']} style={StyleSheet.absoluteFill} />
        </Animated.View>
      )}



      {/* 
          THE UNIFIED BLEND GRADIENT 
          A massive fade that blends the clear image into the black background 
      */}
      <LinearGradient
        colors={['rgba(5,5,5,0.2)', 'rgba(5,5,5,0.7)', '#050505']}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Deep Theater Red Accent (Bottom) */}
      <LinearGradient
        colors={['transparent', 'rgba(120,0,0,0.1)', 'rgba(60,0,0,0.2)']}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 300 }}
      />
    </View>
  );
});

export default function MoviesScreen() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isCompact = screenWidth < 768;
  
  const [loading, setLoading] = useState(true);
  const [movieRails, setMovieRails] = useState<Record<string, Video[]>>({});
  const [focusedThumbnail, setFocusedThumbnail] = useState<string | null>(null);
  const focusTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const [gcCycle, setGcCycle] = useState(0);

  // ── Screen Garbage Collector ──
  useScreenGC('Movies', {
    delayMs: 30_000,
    onCleanup: useCallback(() => {
      setMovieRails({});
      setFocusedThumbnail(null);
      setLoading(true);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      console.log('[Movies] 🧹 GC: Released movie data & thumbnails');
    }, []),
    onReactivate: useCallback(() => {
      setGcCycle(c => c + 1);
      console.log('[Movies] ♻️ GC: Re-fetching data');
    }, []),
  });
  
  const entryOpacity = useSharedValue(0);
  const curtainScale = useSharedValue(1.1);

  useEffect(() => {
    entryOpacity.value = withDelay(500, withTiming(1, { duration: 2000, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }));
    curtainScale.value = withDelay(500, withTiming(1, { duration: 2500, easing: Easing.out(Easing.quad) }));

    let cancelled = false;
    async function fetchData() {
      try {
        const initialResults = await Promise.all([
          youtubeService.search('New Movies 2024'),
          youtubeService.search('Popular Action Movies 4K'),
        ]);

        if (cancelled) return;

        const initialData: Record<string, Video[]> = {
          "Featured Blockbusters": initialResults[0],
          "Action & Adventure": initialResults[1],
        };
        
        setMovieRails(initialData);
        setLoading(false);

        if (initialResults[0].length > 0) setFocusedThumbnail(initialResults[0][0].thumbnail);

        for (const category of MOVIE_CATEGORIES) {
          if (cancelled) return;
          if (!initialData[category]) {
            const results = await youtubeService.search(`${category} movies full length`);
            if (cancelled) return;
            setMovieRails(prev => ({ ...prev, [category]: results }));
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { 
      cancelled = true; 
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    };
  }, [gcCycle]);

  const { setAmbientState } = useAppStore();

  const handleFocusVideo = useCallback((thumbnail: string | null) => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => {
      setFocusedThumbnail(thumbnail);
      setAmbientState(thumbnail, '#FF4444');
    }, 400);
  }, [setAmbientState]);

  const heroMovie = useMemo(() => {
    const firstRail = Object.values(movieRails)[0];
    return firstRail && firstRail.length > 0 ? firstRail[0] : null;
  }, [movieRails]);

  const renderHeader = useCallback(() => (
    <Animated.View style={{ opacity: entryOpacity, transform: [{ scale: curtainScale }] }}>
      {/* 
          Cinematic Hero Header 
          Floating text over the borderless clear background 
      */}
      <View style={{ height: 640, width: '100%', paddingHorizontal: isCompact ? 16 : 40, justifyContent: 'center' }}>
          <Animated.View entering={FadeInUp.delay(1200).duration(1000)}>
            <Text className="text-red-600 text-3xl font-black mb-4 tracking-widest uppercase italic">
               Premiere Night
            </Text>
            <Text 
              className="text-white font-black tracking-tighter mb-4" 
              style={{ fontSize: isCompact ? 32 : 82, lineHeight: isCompact ? 38 : 90 }}
              numberOfLines={2}
            >
               {heroMovie?.title || "Loading Cinema Experience..."}
            </Text>
            <Text className="text-zinc-400 text-2xl font-bold mb-12 max-w-4xl leading-tight">
               Exclusive Digital Release • HDR 10+ • Dolby Atmos Surround
            </Text>

            <View className="flex-row" style={{ gap: 20 }}>
              <FocusablePressable 
                className="bg-white px-12 py-6 rounded-[32px] flex-row items-center shadow-2xl shadow-white/10"
                focusedClassName="bg-red-600 scale-110 shadow-red-600/50"
                onPress={() => heroMovie && router.push({ pathname: '/modal', params: heroMovie as any })}
              >
                {({ isFocused }) => (
                  <>
                    <Play size={32} color={isFocused ? 'white' : 'black'} fill={isFocused ? 'white' : 'black'} />
                    <Text className={`font-black text-2xl ml-4 ${isFocused ? 'text-white' : 'text-black'}`}>Watch Now</Text>
                  </>
                )}
              </FocusablePressable>
              
              <FocusablePressable 
                className="bg-white/10 px-12 py-6 rounded-[32px] flex-row items-center backdrop-blur-md"
                focusedClassName="bg-white/20 scale-110"
              >
                <Plus size={32} color="white" />
                <Text className="text-white font-black text-2xl ml-4">My List</Text>
              </FocusablePressable>
            </View>
          </Animated.View>
      </View>
    </Animated.View>
  ), [heroMovie, isCompact]);

  const renderRail = useCallback(({ item: [title, videos], index }: { item: [string, Video[]], index: number }) => {
    return (
      <Animated.View entering={FadeInUp.delay(1500 + index * 100).duration(800)}>
        <HorizontalRail 
          title={title}
          videos={videos}
          aspectRatio={2/3}
          cardWidth={300}
          onFocusVideo={handleFocusVideo}
        />
      </Animated.View>
    );
  }, [handleFocusVideo]);

  if (loading && Object.keys(movieRails).length === 0) {
    return <SingularityLoader />;
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <TheaterBackground thumbnail={focusedThumbnail} />
      
      <FlatList
        data={Object.entries(movieRails)}
        keyExtractor={(item) => item[0]}
        renderItem={renderRail}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={2}
        windowSize={3}
      />
    </View>
  );
}
