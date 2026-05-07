import React, { useState, useCallback, memo } from 'react';
import { View, Text, FlatList, StyleSheet, useWindowDimensions, Image } from 'react-native';
import { HorizontalRail } from '@/components/tv/HorizontalRail';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { History, Clock, ThumbsUp, Folder, PlayCircle, ListMusic, Heart, Download, CreditCard, Clapperboard, MonitorPlay } from 'lucide-react-native';
import { useAppStore } from '@/lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

const SHELVES = [
  { id: 'history', icon: History, label: 'History', color: '#FF4B4B', gradient: ['#FF4B4B', '#9B1B1B'] },
  { id: 'downloads', icon: Download, label: 'Downloads', color: '#4B7BFF', gradient: ['#4B7BFF', '#1B3B9B'] },
  { id: 'watch-later', icon: Clock, label: 'Watch Later', color: '#FFB84B', gradient: ['#FFB84B', '#9B6B1B'] },
  { id: 'purchases', icon: CreditCard, label: 'Purchases', color: '#4BFF7B', gradient: ['#4BFF7B', '#1B9B3B'] },
  { id: 'liked', icon: Heart, label: 'Liked Videos', color: '#FF4BFF', gradient: ['#FF4BFF', '#9B1B9B'] },
  { id: 'playlists', icon: ListMusic, label: 'Playlists', color: '#00D1FF', gradient: ['#00D1FF', '#006B9B'] },
];

const AmbientBackground = memo(({ color }: { color: string }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
     <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050505' }]} />
     <LinearGradient 
        colors={[`${color}15`, 'rgba(5,5,5,0.4)', '#050505']} 
        style={StyleSheet.absoluteFill} 
     />
  </View>
));

export default function LibraryScreen() {
  const { watchHistory, likedVideos, watchLater } = useAppStore();
  const { width: screenWidth } = useWindowDimensions();
  const isCompact = screenWidth < 768;
  const [activeColor, setActiveColor] = useState('#FF4B4B');

  const renderHeader = useCallback(() => (
    <View className="px-16 pt-24 mb-16">
      <Animated.View entering={FadeIn.duration(1000)}>
        <View className="flex-row items-center mb-10" style={{ gap: 16 }}>
           <Clapperboard size={48} color="white" />
           <Text className="text-white text-7xl font-black tracking-tighter">Your Library</Text>
        </View>
        
        {/* High-Fidelity Shelves */}
        <View className="flex-row flex-wrap" style={{ gap: 24 }}>
          {SHELVES.map((shelf) => (
            <LibraryShelf 
               key={shelf.id} 
               {...shelf} 
               count={shelf.id === 'history' ? watchHistory.length : shelf.id === 'watch-later' ? watchLater.length : shelf.id === 'liked' ? likedVideos.length : 0}
               onFocus={() => setActiveColor(shelf.color)}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  ), [watchHistory, watchLater, likedVideos]);

  return (
    <View className="flex-1 bg-[#050505]">
      <AmbientBackground color={activeColor} />
      
      <FlatList
        data={['Recently Played', 'Movies & TV', 'Saved to Library']}
        keyExtractor={(item) => item}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View className="mb-14">
            <HorizontalRail 
              title={item}
              videos={item === 'Recently Played' ? watchHistory : []}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
  );
}

const LibraryShelf = memo(({ icon: Icon, label, color, gradient, count, onFocus }: any) => {
  return (
    <View style={{ width: '31.5%' }}>
      <FocusablePressable 
        onFocus={onFocus}
        className="h-44 rounded-[40px] overflow-hidden"
        focusedClassName="scale-105 shadow-2xl"
        activeScale={0.98}
      >
        {({ isFocused }) => (
          <View className="flex-1 p-8 flex-row items-center bg-[#111]">
            {isFocused && (
              <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            )}
            
            <View className={`w-20 h-20 rounded-3xl items-center justify-center ${isFocused ? 'bg-white/20' : 'bg-white/5'}`}>
              <Icon size={36} color={isFocused ? "white" : color} strokeWidth={2.5} />
            </View>
            
            <View className="ml-8 flex-1">
              <Text className={`text-3xl font-black tracking-tight ${isFocused ? 'text-white' : 'text-zinc-200'}`}>{label}</Text>
              <Text className={`text-xl font-bold mt-1 ${isFocused ? 'text-white/70' : 'text-zinc-500'}`}>
                {count > 0 ? `${count} items` : 'No content yet'}
              </Text>
            </View>

            {/* Micro-detail: Sparkle or Glow */}
            {isFocused && (
               <View className="absolute top-4 right-8 bg-white/20 px-3 py-1 rounded-full">
                  <Text className="text-white text-xs font-black">OPEN</Text>
               </View>
            )}
          </View>
        )}
      </FocusablePressable>
    </View>
  );
});
