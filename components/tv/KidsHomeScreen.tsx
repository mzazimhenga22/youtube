import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Dimensions 
} from 'react-native';
import { 
  Home, 
  Tv, 
  Star, 
  GraduationCap, 
  Gamepad, 
  Music,
  Compass,
  LogOut
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { FocusablePressable } from './FocusablePressable';
import { MagicKidsLoader } from './MagicKidsLoader';
import { KidsVideoCard } from './KidsVideoCard';
import { useAppStore } from '@/lib/store';
import Animated, { 
  FadeIn, 
  FadeInRight, 
  FadeInDown
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { youtubeService, Video } from '@/lib/youtube';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SIDEBAR_ITEMS = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'shows', icon: Tv, label: 'Shows' },
  { id: 'explore', icon: Compass, label: 'Explore' },
  { id: 'mystuff', icon: Star, label: 'My Stuff' },
];

const BOTTOM_BAR_ITEMS = [
  { id: 'learning', icon: GraduationCap, label: 'Learn', color: '#4CC9F0' },
  { id: 'play', icon: Gamepad, label: 'Play', color: '#F72585' },
  { id: 'watch', icon: Tv, label: 'Watch', color: '#7209B7' },
  { id: 'music', icon: Music, label: 'Listen', color: '#F3722C' },
];

export default function KidsHomeScreen() {
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('home');
  const [sections, setSections] = useState<{title: string, data: Video[]}[]>([]);
  const { currentProfile, watchHistory, setProfile } = useAppStore();
  const router = useRouter();

  const loadContent = useCallback(async (category: string) => {
    setLoading(true);
    try {
      if (category === 'home') {
        const [shows, learning, music, explore] = await Promise.all([
          youtubeService.getKidsCategory('shows'),
          youtubeService.getKidsCategory('learning'),
          youtubeService.getKidsCategory('music'),
          youtubeService.getKidsCategory('explore')
        ]);

        setSections([
          { title: 'Popular Shows', data: shows.slice(0, 10) },
          { title: 'Time to Learn!', data: learning.slice(0, 10) },
          { title: 'Sing Along', data: music.slice(0, 10) },
          { title: 'Explore the World', data: explore.slice(0, 10) }
        ]);
      } else if (category === 'mystuff') {
        setSections([{ title: 'My Stuff', data: watchHistory.slice(0, 20) }]);
      } else {
        const data = await youtubeService.getKidsCategory(category);
        setSections([{ title: category.charAt(0).toUpperCase() + category.slice(1), data }]);
      }
    } catch (e) {
      console.error('Failed to load kids content:', e);
    } finally {
      setLoading(false);
    }
  }, [watchHistory]);

  useEffect(() => {
    loadContent(activeCategory);
  }, [activeCategory, loadContent]);

  const playVideo = useCallback((video: Video) => {
    router.push({
      pathname: '/kids-player',
      params: {
        id: video.id,
        title: video.title,
        thumbnail: video.thumbnail,
      },
    });
  }, [router]);

  const handleVideoPress = useCallback((video: Video) => {
    playVideo(video);
  }, [playVideo]);


  if (loading && sections.length === 0) {
    return <MagicKidsLoader />;
  }

  return (
    <View style={styles.container}>
      <Image 
        source={require('@/assets/kidscreenbg.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={500}
      />
      {/* Main Content Area */}
      <View className="flex-1">
          
          {/* Floating Sidebar Pod */}
          <View className="absolute left-12 top-0 bottom-0 justify-center z-40">
            <Animated.View 
              entering={FadeIn.delay(300)}
              className="items-center"
            >
              <View className="space-y-12">
                {SIDEBAR_ITEMS.map((item, index) => (
                  <FocusablePressable
                    key={item.id}
                    nativeID={`sidebar-${item.id}`}
                    onPress={() => setActiveCategory(item.id)}
                    className={`w-24 h-24 items-center justify-center rounded-full transition-all duration-300 ${activeCategory === item.id ? 'bg-[#9061FF]' : 'bg-black/20'}`}
                    focusedClassName="bg-white scale-125 shadow-2xl"
                    nextFocusRight={100}
                  >
                    {({ isFocused }) => (
                      <item.icon 
                        size={48} 
                        color={isFocused ? "#9061FF" : "white"} 
                        strokeWidth={3} 
                      />
                    )}
                  </FocusablePressable>
                ))}
              </View>

              <View className="mt-12 pt-12">
                <FocusablePressable
                  nativeID="99"
                  onPress={() => {
                    setProfile(null);
                    router.replace('/');
                  }}
                  className="w-20 h-20 items-center justify-center rounded-full bg-red-500/80"
                  focusedClassName="bg-red-500 scale-125 shadow-2xl"
                  nextFocusRight={100}
                >
                  <LogOut size={32} color="white" strokeWidth={3} />
                </FocusablePressable>
              </View>
            </Animated.View>
          </View>

          {/* Center/Right Content Scrollable */}
          <Animated.ScrollView 
            className="flex-1"
            contentContainerStyle={{ paddingVertical: 60, paddingRight: 60, paddingLeft: 192 }}
            showsVerticalScrollIndicator={false}
          >
            
            {/* Header / Title */}
            <View className="mb-12">
              <Animated.Text 
                entering={FadeInRight.delay(400)}
                className="text-white text-8xl font-black tracking-tighter"
                style={styles.textShadow}
              >
                {activeCategory === 'home' ? 'Kids Mode' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
              </Animated.Text>
              <Animated.Text 
                entering={FadeInRight.delay(500)}
                className="text-white/90 text-3xl font-bold mt-2"
              >
                {activeCategory === 'home' 
                  ? 'A world of fun, learning and adventure!' 
                  : `Discover amazing ${activeCategory} content!`}
              </Animated.Text>
            </View>

            {/* Sections Content */}
            {loading && sections.length === 0 ? (
                <View className="h-64 items-center justify-center">
                   <MagicKidsLoader />
                </View>
            ) : (
              <View>
                {sections.map((section, sIndex) => (
                  <View key={section.title} className="mb-16" nativeID={sIndex === 0 ? "100" : undefined}>
                    <Text className="text-white text-4xl font-black mb-6" style={styles.textShadow}>
                      {section.title}
                    </Text>
                    <FlatList
                      horizontal
                      data={section.data}
                      keyExtractor={(item) => `${section.title}-${item.id}`}
                      showsHorizontalScrollIndicator={false}
                      removeClippedSubviews={false}
                      contentContainerStyle={{ paddingRight: 60 }}
                      renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInRight.delay(index * 50)}>
                          <KidsVideoCard 
                            title={item.title}
                            thumbnail={item.thumbnail}
                            duration={item.duration}
                            onPress={() => handleVideoPress(item)}
                            nextFocusDown={sIndex === sections.length - 1 ? 200 : undefined}
                            nextFocusUp={sIndex === 0 ? 300 : undefined}
                          />
                        </Animated.View>
                      )}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* Bottom Navigation */}
            <View className="flex-row items-center justify-center space-x-12 mt-8 pb-12" nativeID="200">
              {BOTTOM_BAR_ITEMS.map((item, index) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(1000 + index * 100)}>
                  <FocusablePressable 
                    onPress={() => setActiveCategory(item.id)}
                    className="items-center"
                    focusedClassName="scale-125"
                    nextFocusUp={100} // Back to first Content rail
                  >
                    <View 
                      className="w-24 h-24 rounded-full items-center justify-center mb-3 shadow-lg"
                      style={{ 
                        backgroundColor: item.color,
                        borderWidth: activeCategory === item.id ? 4 : 0,
                        borderColor: 'white'
                      }}
                    >
                      <item.icon size={48} color="white" strokeWidth={2.5} />
                    </View>
                    <Text className="text-white text-xl font-black uppercase tracking-widest">{item.label}</Text>
                  </FocusablePressable>
                </Animated.View>
              ))}
            </View>

          </Animated.ScrollView>
        </View>

        {/* Profile Section - Top Right */}
        <View className="absolute top-12 right-12 z-30">
          <FocusablePressable 
            nativeID="300"
            onPress={() => router.push('/modal')}
            className="flex-row items-center bg-black/20 px-6 py-3 rounded-full border-2 border-white/20"
            focusedClassName="bg-white/30 border-white"
            nextFocusDown={100}
          >
            <View className="w-16 h-16 rounded-full bg-orange-400 items-center justify-center overflow-hidden border-2 border-white">
              <Image 
                source={require('@/assets/kids-mode.png')} 
                style={{ width: '100%', height: '100%' }}
                contentFit="contain" 
              />
            </View>
            <Text className="text-white text-2xl font-black ml-4">
              Hi, {currentProfile?.name || 'Explorer'}!
            </Text>
          </FocusablePressable>
        </View>

      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  textShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  }
});
