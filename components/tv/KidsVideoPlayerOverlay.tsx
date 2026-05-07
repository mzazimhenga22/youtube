import React from 'react';
import { View, Text, Image, FlatList } from 'react-native';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X
} from 'lucide-react-native';
import { FocusablePressable } from './FocusablePressable';
import { LinearGradient } from 'expo-linear-gradient';

interface KidsVideoPlayerOverlayProps {
  title: string;
  isPlaying: boolean;
  progress: number;
  onClose: () => void;
}

const kidsUpNext = [
  { id: 'k1', title: 'Baby Shark Dance', thumbnail: 'https://images.unsplash.com/photo-1560130954-383789d6e40d?w=400', duration: '2:16', color: '#FF5C5C' },
  { id: 'k2', title: 'CoComelon Fun', thumbnail: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400', duration: '4:15', color: '#3B82F6' },
  { id: 'k3', title: 'Peppa Pig Playtime', thumbnail: 'https://images.unsplash.com/photo-1533518463841-d62e1fc91373?w=400', duration: '5:45', color: '#10B981' },
];

export function KidsVideoPlayerOverlay({
  title,
  isPlaying,
  progress,
  onClose
}: KidsVideoPlayerOverlayProps) {
  return (
    <View className="absolute inset-0 bg-black/20">
      {/* Top Bar: Close Button */}
      <View className="p-10 flex-row justify-end">
        <FocusablePressable 
          onPress={onClose}
          className="bg-white/90 p-6 rounded-full shadow-2xl"
          focusedClassName="bg-white scale-125 border-4 border-[#FFD700]"
        >
          <X size={48} color="#2D3436" strokeWidth={4} />
        </FocusablePressable>
      </View>

      {/* Center: Play/Pause Big Button */}
      <View className="flex-1 items-center justify-center">
        <FocusablePressable 
          className="bg-white p-12 rounded-full shadow-2xl border-8 border-transparent"
          focusedClassName="border-[#FFD700] scale-125"
          activeScale={1.2}
        >
          {isPlaying ? (
            <Pause size={80} color="#2D3436" fill="#2D3436" />
          ) : (
            <Play size={80} color="#2D3436" fill="#2D3436" className="ml-3" />
          )}
        </FocusablePressable>
      </View>

      {/* Bottom Section: Scrubber and Shelf */}
      <View className="pb-12">
        {/* Playful Scrubber */}
        <View className="px-20 mb-12">
          <View className="h-4 w-full bg-white/30 rounded-full overflow-hidden">
            <View 
              className="h-full bg-[#FF5C5C] rounded-full" 
              style={{ width: `${progress * 100}%` }} 
            />
          </View>
          <Text className="text-white text-3xl font-black mt-6 text-center shadow-lg">{title}</Text>
        </View>

        {/* Kids Shelf */}
        <View>
          <FlatList
            horizontal
            data={kidsUpNext}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 60 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="mr-8">
                <FocusablePressable
                  className="w-80 bg-white rounded-[32px] p-2 overflow-hidden border-8 border-transparent"
                  focusedClassName="border-[#FFD700] scale-105 shadow-2xl shadow-blue-500/40"
                  activeScale={1.05}
                >
                  <View>
                    <View className="aspect-video relative rounded-[24px] overflow-hidden">
                      <Image source={{ uri: item.thumbnail }} className="w-full h-full" />
                      <View className="absolute bottom-3 right-3 bg-black/70 px-3 py-1 rounded-full">
                        <Text className="text-white text-sm font-black">{item.duration}</Text>
                      </View>
                    </View>
                    <View className="py-4 px-3 items-center">
                      <Text className="text-[#2D3436] font-black text-xl text-center" numberOfLines={1}>{item.title}</Text>
                    </View>
                  </View>
                </FocusablePressable>
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
}
