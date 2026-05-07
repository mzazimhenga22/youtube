import React, { useEffect, useState, useCallback, memo, useRef } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, StyleSheet, useWindowDimensions } from 'react-native';
import { youtubeService, Video } from '@/lib/youtube';
import { HorizontalRail } from '@/components/tv/HorizontalRail';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { useAppStore } from '@/lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  Easing,
  FadeIn,
  FadeInUp
} from 'react-native-reanimated';
import { Bell, Users, Plus, Check, Play } from 'lucide-react-native';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { useScreenGC } from '@/lib/useScreenGC';

const CHANNELS = [
  { name: 'MrBeast', id: 'mrbeast', avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_nO_96S5V58U-t36T0R-T1x798v1=s176-c-k-c0x00ffffff-no-rj', subCount: '250M', isLive: true },
  { name: 'MKBHD', id: 'mkbhd', avatar: 'https://yt3.googleusercontent.com/lkH3_nbB9667Y6G96fW3D8100.png', subCount: '18M', isLive: false },
  { name: 'Veritasium', id: 'veritasium', avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_n_96S5V58U-t36T0R-T1x798v1=s176-c-k-c0x00ffffff-no-rj', subCount: '15M', isLive: true },
  { name: 'Fireship', id: 'fireship', avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_nO_96S5V58U-t36T0R-T1x798v1=s176-c-k-c0x00ffffff-no-rj', subCount: '3M', isLive: false },
  { name: 'Lofi Girl', id: 'lofigirl', avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_nO_96S5V58U-t36T0R-T1x798v1=s176-c-k-c0x00ffffff-no-rj', subCount: '14M', isLive: true },
  { name: 'Mark Rober', id: 'markrober', avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_nO_96S5V58U-t36T0R-T1x798v1=s176-c-k-c0x00ffffff-no-rj', subCount: '30M', isLive: false },
  { name: 'Linus Tech Tips', id: 'ltt', avatar: 'https://yt3.googleusercontent.com/ytc/AIdro_nO_96S5V58U-t36T0R-T1x798v1=s176-c-k-c0x00ffffff-no-rj', subCount: '15M', isLive: false },
];

const AmbientBackground = memo(({ thumbnail }: { thumbnail: string | null }) => {
  const bgOpacity = useSharedValue(0);
  useEffect(() => {
    if (thumbnail) {
      bgOpacity.value = 0;
      bgOpacity.value = withTiming(0.4, { duration: 1000 });
    }
  }, [thumbnail]);
  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
       <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050505' }]} />
       {thumbnail && (
         <Animated.View style={[StyleSheet.absoluteFill, bgStyle]}>
            <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} blurRadius={80} />
            <LinearGradient colors={['transparent', 'rgba(5,5,5,0.6)', '#050505']} style={StyleSheet.absoluteFill} />
         </Animated.View>
       )}
    </View>
  );
});

export default function SubscriptionsScreen() {
  const { setAmbientState } = useAppStore();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 768;

  const [subRails, setSubRails] = useState<Record<string, Video[]>>({});
  const [loading, setLoading] = useState(true);
  const [focusedChannel, setFocusedChannel] = useState(CHANNELS[0]);
  const [focusedThumbnail, setFocusedThumbnail] = useState<string | null>(null);
  
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gcCycle, setGcCycle] = useState(0);

  // ── Screen Garbage Collector ──
  useScreenGC('Subscriptions', {
    delayMs: 30_000,
    onCleanup: useCallback(() => {
      setSubRails({});
      setFocusedThumbnail(null);
      setLoading(true);
      console.log('[Subs] 🧹 GC: Released subscription data');
    }, []),
    onReactivate: useCallback(() => {
      setGcCycle(c => c + 1);
      console.log('[Subs] ♻️ GC: Re-fetching data');
    }, []),
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        const [today, week] = await Promise.all([
          youtubeService.getTrending(),
          youtubeService.search('new videos from my subscriptions')
        ]);
        if (cancelled) return;
        setSubRails({
          "New Today": today.slice(0, 8),
          "This Week": week.slice(0, 12),
          "Recently Uploaded": [...today].reverse().slice(0, 8),
        });
        if (today.length > 0) setFocusedThumbnail(today[0].thumbnail);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [gcCycle]);

  const handleFocusChannel = useCallback((channel: typeof CHANNELS[0]) => {
    setFocusedChannel(channel);
    setAmbientState(channel.avatar, '#FFFFFF');
  }, [setAmbientState]);

  const handleFocusVideo = useCallback((thumbnail: string) => {
    setFocusedThumbnail(thumbnail);
    setAmbientState(thumbnail, '#FF0000');
  }, [setAmbientState]);

  const renderHeader = useCallback(() => (
    <View>
      {/* ── CINEMATIC CHANNEL BANNER ── */}
      <View style={{ height: 600, paddingHorizontal: isCompact ? 20 : 48, paddingTop: 60, justifyContent: 'center' }}>
         <Animated.View entering={FadeIn.duration(1000)} key={focusedChannel.id}>
            <View className="flex-row items-center mb-8" style={{ gap: 24 }}>
               <View className="w-40 h-40 rounded-full overflow-hidden shadow-2xl shadow-black/50">
                  <Image source={{ uri: `https://i.pravatar.cc/300?u=${focusedChannel.name}` }} className="w-full h-full" />
               </View>
               <View>
                  <View className="flex-row items-center mb-2" style={{ gap: 12 }}>
                     <Text className="text-white text-6xl font-black tracking-tighter">{focusedChannel.name}</Text>
                     <View className="bg-white/10 px-3 py-1 rounded-full">
                        <Text className="text-zinc-400 font-bold text-sm">Official Artist</Text>
                     </View>
                  </View>
                  <Text className="text-zinc-400 text-2xl font-bold">{focusedChannel.subCount} Subscribers • 1.2K Videos</Text>
               </View>
            </View>

            <View className="flex-row mb-12" style={{ gap: 16 }}>
               <FocusablePressable className="bg-white px-10 py-5 rounded-2xl flex-row items-center" focusedClassName="bg-red-600 scale-110">
                  {({ isFocused }) => (
                     <>
                        <Check size={28} color={isFocused ? 'white' : 'black'} strokeWidth={3} />
                        <Text className={`font-black text-2xl ml-3 ${isFocused ? 'text-white' : 'text-black'}`}>Subscribed</Text>
                     </>
                  )}
               </FocusablePressable>
               <FocusablePressable className="bg-white/10 px-8 py-5 rounded-2xl flex-row items-center" focusedClassName="bg-white/20 scale-110">
                  <Bell size={28} color="white" />
               </FocusablePressable>
               <FocusablePressable className="bg-white/10 px-10 py-5 rounded-2xl flex-row items-center" focusedClassName="bg-white/20 scale-110">
                  <Play size={28} color="white" fill="white" />
                  <Text className="text-white font-black text-2xl ml-3">Latest Video</Text>
               </FocusablePressable>
            </View>
         </Animated.View>
      </View>

      {/* ── CHANNEL NAV BAR ── */}
      <View style={{ marginBottom: 60, position: 'relative' }}>
        <FlatList
          horizontal
          data={CHANNELS}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 48, paddingVertical: 20 }}
          renderItem={({ item }) => (
            <FocusablePressable
              onFocus={() => handleFocusChannel(item)}
              className="items-center mr-8"
              focusedClassName="scale-110"
            >
              {({ isFocused }) => (
                <View className="items-center">
                  <View className="relative">
                    <View className={`w-24 h-24 rounded-full overflow-hidden ${isFocused ? 'shadow-2xl shadow-white/40' : ''}`}>
                      <Image source={{ uri: `https://i.pravatar.cc/150?u=${item.name}` }} className="w-full h-full" />
                    </View>
                    {item.isLive && (
                       <View className="absolute -bottom-1 self-center bg-red-600 px-2 py-0.5 rounded-md border-2 border-[#050505]">
                          <Text className="text-white text-[10px] font-black uppercase">Live</Text>
                       </View>
                    )}
                  </View>
                  <Text className={`mt-4 text-lg font-black tracking-tight ${isFocused ? 'text-white' : 'text-zinc-500'}`}>
                    {item.name}
                  </Text>
                  {isFocused && (
                     <View className="absolute -top-4 w-1 h-1 bg-white rounded-full" />
                  )}
                </View>
              )}
            </FocusablePressable>
          )}
        />
        {/* Horizontal Edge Fades */}
        <LinearGradient
          colors={['#050505', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, zIndex: 10, pointerEvents: 'none' }}
        />
        <LinearGradient
          colors={['transparent', '#050505']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, zIndex: 10, pointerEvents: 'none' }}
        />
      </View>
    </View>
  ), [focusedChannel, isCompact, handleFocusChannel]);

  const renderRail = useCallback(({ item: [title, videos] }: { item: [string, Video[]] }) => {
    return (
      <View className="mb-14">
        <HorizontalRail 
          title={title}
          videos={videos}
          onFocusVideo={handleFocusVideo}
        />
      </View>
    );
  }, [handleFocusVideo]);

  if (loading) {
    return <SingularityLoader />;
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <AmbientBackground thumbnail={focusedThumbnail} />
      
      <FlatList
        data={Object.entries(subRails)}
        keyExtractor={(item) => item[0]}
        renderItem={renderRail}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}
