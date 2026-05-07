import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Image } from 'react-native';
import { KidsSidebar } from './KidsSidebar';
import { KidsVideoCard } from './KidsVideoCard';
import { MagicKidsLoader } from './MagicKidsLoader';
import { youtubeService, Video } from '@/lib/youtube';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const KIDS_CATEGORIES = [
  { label: 'Shows', query: 'kids cartoons full episodes', color: '#FF5C5C' },
  { label: 'Explore', query: 'kids science experiments', color: '#3B82F6' },
  { label: 'Music', query: 'nursery rhymes songs', color: '#A855F7' },
  { label: 'Learning', query: 'abc learning for toddlers', color: '#10B981' },
];

const MOCK_KIDS_VIDEOS: Video[] = [
  {
    id: "zGRPON4FcBk",
    title: "Dodo Saw the Broken Jungle – Ep 18",
    channel: "Dodo & Friends",
    views: "1.2M",
    thumbnail: "https://i.ytimg.com/vi/zGRPON4FcBk/hqdefault.jpg",
    duration: "12:45"
  },
  {
    id: "GQLvRuN6Vb0",
    title: "The GREAT Ant Flu | Antiks 🐜",
    channel: "Antiks Kids",
    views: "850K",
    thumbnail: "https://i.ytimg.com/vi/GQLvRuN6Vb0/hqdefault.jpg",
    duration: "10:20"
  },
  {
    id: "Bg9qw4GbGfk",
    title: "PJ Masks Full Episodes | PJ Seeker",
    channel: "PJ Masks Official",
    views: "5.4M",
    thumbnail: "https://i.ytimg.com/vi/Bg9qw4GbGfk/hqdefault.jpg",
    duration: "1:02:15"
  }
];

export default function KidsHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, Video[]>>({});

  useEffect(() => {
    async function fetchKidsData() {
      try {
        const results: Record<string, Video[]> = {};
        for (const cat of KIDS_CATEGORIES) {
          const videos = await youtubeService.getVideosByCategory(cat.query);
          results[cat.label] = videos.length > 0 ? videos : MOCK_KIDS_VIDEOS;
        }
        setData(results);
      } catch (e) {
        console.error('[KidsHome] Fetch error:', e);
        setData(KIDS_CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.label]: MOCK_KIDS_VIDEOS }), {}));
      } finally {
        setLoading(false);
      }
    }
    fetchKidsData();
  }, []);

  const renderRail = useCallback(({ item: cat }: { item: typeof KIDS_CATEGORIES[0] }) => {
    const videos = data[cat.label];
    if (!videos) return null;

    return (
      <Animated.View entering={FadeInRight.duration(800)} className="mb-16">
        <View className="flex-row items-center mb-6 px-12">
          <View 
            className="w-4 h-12 rounded-full mr-4" 
            style={{ backgroundColor: cat.color }} 
          />
          <Text className="text-[#2D3436] text-5xl font-black tracking-tight">
            {cat.label}
          </Text>
        </View>
        
        <FlatList
          horizontal
          data={videos}
          keyExtractor={(v) => v.id}
          renderItem={({ item }) => (
            <KidsVideoCard 
              title={item.title}
              thumbnail={item.thumbnail}
              duration={item.duration}
              color={cat.color}
            />
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 48 }}
        />
      </Animated.View>
    );
  }, [data]);

  if (loading) {
    return <MagicKidsLoader />;
  }

  return (
    <View style={styles.container}>
      {/* Playful Background Elements */}
      <View style={[styles.cloud, { top: '10%', right: '5%' }]}>
        <View className="w-64 h-32 bg-white/40 rounded-full" />
      </View>
      <View style={[styles.cloud, { bottom: '20%', left: '15%' }]}>
        <View className="w-80 h-40 bg-white/40 rounded-full" />
      </View>

      <KidsSidebar />

      <View className="flex-1">
        <FlatList
          data={KIDS_CATEGORIES}
          keyExtractor={(item) => item.label}
          renderItem={renderRail}
          ListHeaderComponent={() => (
            <View className="pt-20 px-12 mb-12">
              <Text className="text-[#2D3436] text-8xl font-black tracking-tighter leading-none">
                What do you{'\n'}
                <Text style={{ color: '#FF5C5C' }}>want to watch?</Text>
              </Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      </View>

      {/* Edge Fades for TV Scrolling */}
      <LinearGradient
        colors={['#FFFBE6', 'transparent']}
        style={styles.topFade}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', '#FFFBE6']}
        style={styles.bottomFade}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBE6', // Warm, kid-friendly cream
    flexDirection: 'row',
  },
  cloud: {
    position: 'absolute',
    opacity: 0.5,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 128, // Offset by sidebar width
    right: 0,
    height: 100,
    zIndex: 10,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 128,
    right: 0,
    height: 100,
    zIndex: 10,
  }
});
