import React, { memo } from 'react';
import { View, Text, Image } from 'react-native';
import { FocusablePressable } from './FocusablePressable';
import { Play } from 'lucide-react-native';

interface ShortsCardProps {
  title: string;
  views: string;
  thumbnail: string;
}

export const ShortsCard = memo(function ShortsCard({ 
  title, 
  views, 
  thumbnail 
}: ShortsCardProps) {
  return (
    <FocusablePressable 
      className="w-56 mr-6 rounded-2xl overflow-hidden"
      focusedClassName="shadow-2xl shadow-red-600/20"
      activeScale={1.1}
    >
      {({ isFocused }) => (
        <View>
          <View className={`relative aspect-[9/16] bg-zinc-800 rounded-2xl overflow-hidden border-4 transition-all duration-300 ${isFocused ? 'border-white' : 'border-transparent'}`}>
            <Image 
              source={{ uri: thumbnail }} 
              className="w-full h-full"
              resizeMode="cover"
            />
            
            {/* Play Overlay on Focus */}
            {isFocused && (
              <View className="absolute inset-0 items-center justify-center bg-black/20">
                <View className="bg-white/20 p-4 rounded-full">
                  <Play size={32} color="white" fill="white" />
                </View>
              </View>
            )}

            {/* Shorts Icon Tag */}
            <View className="absolute top-4 left-4 bg-red-600 p-1.5 rounded-lg">
               <View className="w-4 h-4 items-center justify-center">
                  <Play size={12} color="white" fill="white" />
               </View>
            </View>

            <View className="absolute bottom-4 left-4 right-4">
              <Text className="text-white font-black text-lg leading-tight shadow-lg" numberOfLines={2}>
                {title}
              </Text>
              <Text className="text-white/80 text-sm font-bold mt-1 shadow-lg">
                {views} views
              </Text>
            </View>
          </View>
        </View>
      )}
    </FocusablePressable>
  );
});
