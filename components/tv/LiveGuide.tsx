import React, { useState, useEffect, useCallback, memo } from 'react';
import { View, Text, Image, FlatList, useWindowDimensions, ActivityIndicator, ImageBackground } from 'react-native';
import { FocusablePressable } from './FocusablePressable';
import { LinearGradient } from 'expo-linear-gradient';
import { youtubeService, Video } from '@/lib/youtube';
import { useRouter } from 'expo-router';
import { Radio, Users, Play, Signal } from 'lucide-react-native';

export function LiveGuide() {
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const [channels, setChannels] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedVideo, setFocusedVideo] = useState<Video | null>(null);

  const isCompact = screenWidth < 768;
  const cardWidth = isCompact ? screenWidth * 0.7 : Math.min(340, screenWidth * 0.2);
  const cardHeight = cardWidth * 9 / 16;

  useEffect(() => {
    async function loadLive() {
      try {
        const liveVids = await youtubeService.getLiveChannels();
        if (liveVids.length > 0) {
          setChannels(liveVids);
          setFocusedVideo(liveVids[0]);
        }
      } catch (e) {
        console.error('[LiveGuide] Error:', e);
      } finally {
        setLoading(false);
      }
    }
    loadLive();
  }, []);

  const navigateToStream = useCallback((video: Video) => {
    router.push({
      pathname: '/modal',
      params: {
        id: video.id,
        title: video.title,
        channel: video.channel,
        views: video.views,
        thumbnail: video.thumbnail,
        duration: video.duration,
        isLive: 'true',
      } as any,
    });
  }, [router]);

  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#FF0000" />
        <Text className="text-zinc-500 text-lg font-bold mt-4">Loading live streams...</Text>
      </View>
    );
  }

  const hero = focusedVideo || channels[0];

  return (
    <View className="flex-1 bg-black">
      {/* ═══════ HERO PREVIEW ═══════ */}
      {hero && (
        <FocusablePressable
          onPress={() => navigateToStream(hero)}
          className="relative overflow-hidden"
          focusedClassName="opacity-95"
          activeScale={1}
          style={{ height: isCompact ? 220 : 380 }}
        >
          <ImageBackground
            source={{ uri: hero.thumbnail }}
            className="w-full h-full"
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.95)', '#000']}
              className="absolute inset-0"
            />
            <View
              className="absolute bottom-0 left-0 right-0"
              style={{ paddingHorizontal: isCompact ? 16 : 40, paddingBottom: isCompact ? 16 : 36 }}
            >
              <View className="flex-row items-center mb-2" style={{ gap: 8 }}>
                <View className="flex-row items-center bg-red-600 rounded" style={{ paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Radio size={11} color="white" />
                  <Text className="text-white font-black ml-1" style={{ fontSize: 11 }}>LIVE</Text>
                </View>
                {hero.views && (
                  <View className="flex-row items-center" style={{ gap: 4 }}>
                    <Users size={13} color="rgba(255,255,255,0.5)" />
                    <Text className="text-white/50 font-bold" style={{ fontSize: 12 }}>{hero.views}</Text>
                  </View>
                )}
              </View>
              <Text
                className="text-white font-black tracking-tighter"
                numberOfLines={2}
                style={{ fontSize: isCompact ? 20 : 34, lineHeight: isCompact ? 26 : 42 }}
              >
                {hero.title}
              </Text>
              <Text className="text-white/50 font-bold mt-1" style={{ fontSize: isCompact ? 13 : 18 }}>
                {hero.channel}
              </Text>

              <View className="flex-row items-center mt-3" style={{ gap: 8 }}>
                <View className="flex-row items-center bg-white rounded-full" style={{ paddingHorizontal: isCompact ? 14 : 20, paddingVertical: isCompact ? 6 : 10, gap: 6 }}>
                  <Play size={isCompact ? 14 : 18} color="black" fill="black" />
                  <Text className="text-black font-black" style={{ fontSize: isCompact ? 13 : 16 }}>Watch Now</Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </FocusablePressable>
      )}

      {/* ═══════ LIVE CHANNELS RAIL ═══════ */}
      <View style={{ marginTop: 20 }}>
        <View style={{ paddingHorizontal: isCompact ? 16 : 40, marginBottom: 12 }}>
          <Text className="text-white font-black tracking-tight" style={{ fontSize: isCompact ? 18 : 22 }}>Live Now</Text>
          <Text className="text-white/30 font-bold mt-1" style={{ fontSize: isCompact ? 12 : 14 }}>{channels.length} streams available</Text>
        </View>

        <FlatList
          horizontal
          data={channels}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 40, gap: isCompact ? 10 : 14 }}
          renderItem={({ item }) => (
            <FocusablePressable
              onPress={() => navigateToStream(item)}
              onFocus={() => setFocusedVideo(item)}
              className="rounded-2xl overflow-hidden border-2 border-transparent"
              focusedClassName="border-white scale-[1.04]"
              activeScale={0.97}
              style={{ width: cardWidth }}
            >
              {({ isFocused }) => (
                <View>
                  <View className="relative overflow-hidden rounded-2xl" style={{ height: cardHeight }}>
                    <Image source={{ uri: item.thumbnail }} className="w-full h-full" resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} className="absolute inset-0" />
                    <View
                      className="absolute flex-row items-center bg-red-600 rounded"
                      style={{ top: 6, left: 6, paddingHorizontal: 5, paddingVertical: 2, gap: 3 }}
                    >
                      <Signal size={9} color="white" />
                      <Text className="text-white font-black" style={{ fontSize: 9 }}>LIVE</Text>
                    </View>
                    {item.views && (
                      <View
                        className="absolute flex-row items-center bg-black/60 rounded"
                        style={{ bottom: 6, right: 6, paddingHorizontal: 5, paddingVertical: 2, gap: 3 }}
                      >
                        <Users size={9} color="white" />
                        <Text className="text-white font-bold" style={{ fontSize: 9 }}>{item.views}</Text>
                      </View>
                    )}
                    {isFocused && (
                      <View className="absolute inset-0 items-center justify-center bg-black/20">
                        <View className="bg-white/90 rounded-full items-center justify-center" style={{ width: 36, height: 36 }}>
                          <Play size={18} color="black" fill="black" style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={{ paddingVertical: isCompact ? 6 : 8, paddingHorizontal: 2 }}>
                    <Text
                      className={`font-black tracking-tight ${isFocused ? 'text-white' : 'text-white/90'}`}
                      numberOfLines={2}
                      style={{ fontSize: isCompact ? 12 : 14, lineHeight: isCompact ? 16 : 18 }}
                    >
                      {item.title}
                    </Text>
                    <Text className="text-white/40 font-bold mt-1" numberOfLines={1} style={{ fontSize: isCompact ? 10 : 12 }}>
                      {item.channel}
                    </Text>
                  </View>
                </View>
              )}
            </FocusablePressable>
          )}
        />
      </View>

      {/* ═══════ MORE LIVE RAIL ═══════ */}
      {channels.length > 3 && (
        <View style={{ marginTop: 24 }}>
          <View style={{ paddingHorizontal: isCompact ? 16 : 40, marginBottom: 12 }}>
            <Text className="text-white font-black tracking-tight" style={{ fontSize: isCompact ? 18 : 22 }}>More to Watch</Text>
          </View>
          <FlatList
            horizontal
            data={[...channels].reverse()}
            keyExtractor={(item, idx) => `more-${item.id}-${idx}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: isCompact ? 16 : 40, gap: isCompact ? 10 : 14 }}
            renderItem={({ item }) => (
              <FocusablePressable
                onPress={() => navigateToStream(item)}
                onFocus={() => setFocusedVideo(item)}
                className="rounded-2xl overflow-hidden border-2 border-transparent"
                focusedClassName="border-white scale-[1.04]"
                activeScale={0.97}
                style={{ width: cardWidth }}
              >
                {({ isFocused }) => (
                  <View>
                    <View className="relative overflow-hidden rounded-2xl" style={{ height: cardHeight }}>
                      <Image source={{ uri: item.thumbnail }} className="w-full h-full" resizeMode="cover" />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} className="absolute inset-0" />
                      <View
                        className="absolute flex-row items-center bg-red-600 rounded"
                        style={{ top: 6, left: 6, paddingHorizontal: 5, paddingVertical: 2, gap: 3 }}
                      >
                        <Signal size={9} color="white" />
                        <Text className="text-white font-black" style={{ fontSize: 9 }}>LIVE</Text>
                      </View>
                      {isFocused && (
                        <View className="absolute inset-0 items-center justify-center bg-black/20">
                          <View className="bg-white/90 rounded-full items-center justify-center" style={{ width: 36, height: 36 }}>
                            <Play size={18} color="black" fill="black" style={{ marginLeft: 2 }} />
                          </View>
                        </View>
                      )}
                    </View>
                    <View style={{ paddingVertical: isCompact ? 6 : 8, paddingHorizontal: 2 }}>
                      <Text
                        className={`font-black tracking-tight ${isFocused ? 'text-white' : 'text-white/90'}`}
                        numberOfLines={2}
                        style={{ fontSize: isCompact ? 12 : 14, lineHeight: isCompact ? 16 : 18 }}
                      >
                        {item.title}
                      </Text>
                      <Text className="text-white/40 font-bold mt-1" numberOfLines={1} style={{ fontSize: isCompact ? 10 : 12 }}>
                        {item.channel}
                      </Text>
                    </View>
                  </View>
                )}
              </FocusablePressable>
            )}
          />
        </View>
      )}
    </View>
  );
}
