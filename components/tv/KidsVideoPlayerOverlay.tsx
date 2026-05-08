import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  X
} from 'lucide-react-native';
import { FocusablePressable } from './FocusablePressable';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from '@/lib/youtube';

interface KidsVideoPlayerOverlayProps {
  title: string;
  isPlaying: boolean;
  progress: number;
  onClose: () => void;
  onTogglePlay?: () => void;
  upNext?: Video[];
  onSelectVideo?: (video: Video) => void;
}

export function KidsVideoPlayerOverlay({
  title,
  isPlaying,
  progress,
  onClose,
  onTogglePlay,
  upNext = [],
  onSelectVideo
}: KidsVideoPlayerOverlayProps) {
  return (
    <View className="absolute inset-0 bg-black/40">
      {/* Top Bar: Close Button */}
      <View className="p-10 flex-row justify-end">
        <FocusablePressable 
          onPress={onClose}
          nativeID="kids-close"
          className="bg-white/90 p-6 rounded-full shadow-2xl"
          focusedClassName="bg-white scale-125 border-4 border-[#FFD700]"
          nextFocusDown="kids-rail"
        >
          <X size={48} color="#2D3436" strokeWidth={4} />
        </FocusablePressable>
      </View>

      {/* Center: Clear Area for Video */}
      <View className="flex-1" />

      {/* Bottom Section: Integrated Controls */}
      <View className="absolute bottom-0 left-0 right-0 pb-10">
        
        {/* Playful Shelf - Pushed down above controls */}
        <View className="mb-8">
          <FlatList
            horizontal
            data={upNext}
            keyExtractor={(item) => item.id}
            removeClippedSubviews={false}
            contentContainerStyle={{ paddingHorizontal: 60 }}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View className="mr-8">
                <FocusablePressable
                  onPress={() => onSelectVideo?.(item)}
                  nativeID={index === 0 ? "kids-rail" : undefined}
                  className="w-64 bg-[#2D3436] rounded-[40px] p-2.5 overflow-hidden border-[6px] border-transparent shadow-2xl"
                  focusedClassName="border-[#FFD700] scale-110 shadow-[#FFD700]/30"
                  activeScale={1.1}
                  nextFocusUp="kids-close"
                  nextFocusDown="kids-play"
                  style={{
                    // Custom focus shadow for Kids mode
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: 30,
                  }}
                >
                  <View>
                    <View className="aspect-video relative rounded-[32px] overflow-hidden bg-black/20">
                      <Image 
                        source={{ uri: item.thumbnail }} 
                        style={{ width: '100%', height: '100%' }}
                        contentFit="cover"
                        transition={300}
                      />
                      <View className="absolute bottom-3 right-3 bg-[#FF4B4B] px-3 py-1 rounded-full border-2 border-white">
                        <Text className="text-white text-[12px] font-black">{item.duration}</Text>
                      </View>
                    </View>
                    <View className="p-3">
                      <Text className="text-white text-base font-black tracking-tight" numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                  </View>
                </FocusablePressable>
              </View>
            )}
          />
        </View>

        {/* Control Bar: Play/Pause + Scrubber */}
        <View className="px-20 flex-row items-center">
          {/* Play/Pause Button - Integrated into bottom bar */}
          <FocusablePressable 
            onPress={onTogglePlay}
            nativeID="kids-play"
            hasTVPreferredFocus
            className="bg-[#FF4B4B] p-8 rounded-full shadow-2xl border-4 border-white mr-10"
            focusedClassName="border-[#FFD700] scale-110"
            activeScale={1.1}
            nextFocusUp="kids-rail"
          >
            {isPlaying ? (
              <Pause size={48} color="white" fill="white" />
            ) : (
              <Play size={48} color="white" fill="white" className="ml-2" />
            )}
          </FocusablePressable>

          {/* Scrubber & Title Row */}
          <View className="flex-1">
            <View className="h-4 w-full bg-white/30 rounded-full overflow-hidden border-2 border-white/20">
              <View 
                className="h-full bg-[#4BFF7B] rounded-full" 
                style={{ width: `${progress * 100}%` }} 
              />
            </View>
            <View className="flex-row justify-between items-center mt-3">
              <Text className="text-white text-2xl font-black shadow-lg uppercase tracking-widest flex-1 mr-4" numberOfLines={1}>
                {title}
              </Text>
              <View className="bg-black/40 px-4 py-2 rounded-full border border-white/10">
                 <Text className="text-white/80 font-black text-lg">KIDS MODE</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

