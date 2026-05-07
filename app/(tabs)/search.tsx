import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, Dimensions, StyleSheet } from 'react-native';
import { youtubeService, Video } from '@/lib/youtube';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { History, Delete, Globe, Search as SearchIcon, X, Mic, Play } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInRight, useAnimatedStyle, useSharedValue, withTiming, withSpring } from 'react-native-reanimated';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { useScreenGC } from '@/lib/useScreenGC';
import { VideoCard } from '@/components/tv/VideoCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const KEYBOARD_KEYS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9', '0'],
  ['&', '@', '.', '-', '_', '/'],
  ['SPACE', 'BACK', 'CLEAR']
];

const QUICK_CHIPS = ['Music', 'Gaming', 'News', 'Movies', 'Shorts', 'Live'];

import { playVideo } from '@/lib/navigation';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gcCycle, setGcCycle] = useState(0);

  // ── Screen Garbage Collector ──
  useScreenGC('Search', {
    delayMs: 30_000,
    onCleanup: useCallback(() => {
      setResults([]);
      setQuery('');
      setHasSearched(false);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      console.log('[Search] 🧹 GC: Released search results');
    }, []),
    onReactivate: useCallback(() => {
      setGcCycle(c => c + 1);
      console.log('[Search] ♻️ GC: Re-fetching initial data');
    }, []),
  });

  useEffect(() => {
    async function fetchInitial() {
      const data = await youtubeService.getHomeVideos();
      setResults(data);
    }
    fetchInitial();
  }, [gcCycle]);

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await youtubeService.search(searchTerm);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKeyPress = (key: string) => {
    let newQuery = query;
    if (key === 'BACK') newQuery = query.slice(0, -1);
    else if (key === 'SPACE') newQuery = query + ' ';
    else if (key === 'CLEAR') newQuery = '';
    else newQuery = query + key;

    setQuery(newQuery);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 800);
  };

  const renderVideoItem = useCallback(({ item }: { item: Video }) => (
    <View style={{ width: (SCREEN_WIDTH - 500 - 96 - 64) / 3, marginBottom: 20 }}>
      <VideoCard 
        {...item}
        onPress={() => playVideo(item)}
        width="100%"
      />
    </View>
  ), []);

  return (
    <View style={styles.container}>
      {/* ── THE AURA LAYER ── */}
      <View style={StyleSheet.absoluteFill}>
         <LinearGradient colors={['#050505', '#0f0f0f']} style={StyleSheet.absoluteFill} />
         {/* Top Left Aura */}
         <LinearGradient 
           colors={['rgba(255, 0, 0, 0.06)', 'transparent']}
           style={{
             position: 'absolute',
             top: 0,
             left: 0,
             width: 400,
             height: 400,
           }} 
         />
         {/* Bottom Right Aura */}
         <LinearGradient 
           colors={['transparent', 'rgba(255, 255, 255, 0.03)']}
           style={{
             position: 'absolute',
             bottom: 0,
             right: 0,
             width: 500,
             height: 500,
           }} 
         />
      </View>

      <View className="flex-1 flex-row">
        {/* ── LEFT SIDE: FLOATING AURA KEYBOARD ── */}
        <View className="w-[500px] px-14 pt-20">
           {/* Floating Query Bar */}
           <Animated.View 
             entering={FadeIn.duration(800)}
             style={{
               backgroundColor: 'rgba(255,255,255,0.03)',
               height: 72,
               borderRadius: 24,
               paddingHorizontal: 24,
               flexDirection: 'row',
               alignItems: 'center',
               marginBottom: 40,
               borderWidth: 1,
               borderColor: 'rgba(255,255,255,0.05)',
             }}
           >
              <SearchIcon size={24} color={query ? "white" : "#52525B"} strokeWidth={3} />
              <Text className={`ml-4 text-3xl font-black flex-1 tracking-tighter ${query ? 'text-white' : 'text-zinc-700'}`}>
                {query || 'Search...'}
              </Text>
              {query.length > 0 && (
                <FocusablePressable onPress={() => setQuery('')} className="p-2" focusedClassName="bg-white/10 rounded-full">
                  <X size={24} color="white" strokeWidth={3} />
                </FocusablePressable>
              )}
           </Animated.View>

           {/* Keyboard Grid - Slightly compressed for better fit */}
           <View style={{ marginBottom: 20 }}>
             {KEYBOARD_KEYS.map((row, rIdx) => (
               <View key={rIdx} className="flex-row justify-between mb-2.5">
                 {row.map((key) => {
                    const isControl = ['SPACE', 'BACK', 'CLEAR'].includes(key);
                    return (
                      <FocusablePressable
                        key={key}
                        onPress={() => handleKeyPress(key)}
                        className={isControl ? 'flex-1 mx-1' : 'w-[64px] mx-0.5'}
                        style={{ height: 52 }}
                        activeScale={1.2}
                      >
                        {({ isFocused }) => (
                          <View style={{
                            flex: 1,
                            backgroundColor: isFocused ? 'rgba(255,0,0,0.8)' : 'rgba(255,255,255,0.03)',
                            borderRadius: 12,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: isFocused ? 'rgba(255,255,255,0.2)' : 'transparent',
                          }}>
                            {isFocused && (
                              <LinearGradient
                                colors={['rgba(255,0,0,0.3)', 'transparent']}
                                style={{
                                  position: 'absolute',
                                  inset: -12,
                                  borderRadius: 20,
                                  zIndex: -1,
                                }} 
                              />
                            )}
                            {key === 'BACK' ? (
                              <Delete size={20} color={isFocused ? "white" : "#71717A"} strokeWidth={2.5} />
                            ) : (
                              <Text style={{ 
                                fontSize: isControl ? 12 : 20, 
                                fontWeight: '900', 
                                color: isFocused ? 'white' : '#71717A',
                                letterSpacing: isControl ? 1 : -0.5,
                              }}>{key}</Text>
                            )}
                          </View>
                        )}
                      </FocusablePressable>
                    );
                 })}
               </View>
             ))}
           </View>

           {/* Suggestions - Tucked neatly at bottom */}
           <View style={{ marginTop: 'auto', paddingBottom: 40 }}>
              <Text className="text-zinc-700 font-black mb-4 uppercase tracking-[0.2em] text-[10px]">Aura Suggestions</Text>
              <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                {QUICK_CHIPS.map(chip => (
                  <FocusablePressable 
                    key={chip} 
                    onPress={() => { setQuery(chip); performSearch(chip); }}
                    className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5"
                    focusedClassName="bg-white border-white scale-105"
                  >
                    {({ isFocused }) => (
                      <Text className={`font-black text-sm tracking-tight ${isFocused ? 'text-black' : 'text-zinc-500'}`}>{chip}</Text>
                    )}
                  </FocusablePressable>
                ))}
              </View>
           </View>
        </View>

        {/* ── RIGHT SIDE: DYNAMIC RESULTS GRID ── */}
        <View className="flex-1 pr-12">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <SingularityLoader transparent minimal />
            </View>
          ) : (
            <Animated.View entering={FadeInRight.duration(600)} className="flex-1 pt-20">
              <View className="flex-row items-center mb-10">
                <View className="h-[1px] flex-1 bg-white/5" />
                <Text className="text-zinc-600 font-black text-xs uppercase tracking-[0.3em] mx-6">
                  {hasSearched ? `Results for ${query}` : 'Trending Discoveries'}
                </Text>
                <View className="h-[1px] flex-1 bg-white/5" />
              </View>

              <FlatList
                data={results}
                keyExtractor={(item, index) => `${item.id}-${index}`}
                renderItem={renderVideoItem}
                numColumns={3}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={{ gap: 24 }}
                contentContainerStyle={{ paddingBottom: 150 }}
                initialNumToRender={6}
                windowSize={5}
                maxToRenderPerBatch={6}
                removeClippedSubviews={true}
              />
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  }
});
