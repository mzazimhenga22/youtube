import React from 'react';
import { View, Text, Image } from 'react-native';
import { FocusablePressable } from './FocusablePressable';
import { Maximize2, Volume2 } from 'lucide-react-native';

interface MultiviewStream {
  id: string;
  title: string;
  thumbnail: string;
  isFocused?: boolean;
}

interface MultiviewGridProps {
  streams: MultiviewStream[];
}

export function MultiviewGrid({ streams }: MultiviewGridProps) {
  // Take up to 4 streams for the grid
  const displayStreams = streams.slice(0, 4);

  return (
    <View className="flex-1 bg-black p-4">
      <View className="flex-row flex-wrap flex-1">
        {displayStreams.map((stream, index) => (
          <View key={stream.id} className="w-1/2 h-1/2 p-2">
            <FocusablePressable
              className="w-full h-full rounded-2xl overflow-hidden border-4 border-transparent"
              focusedClassName="border-white shadow-2xl shadow-white/20"
              activeScale={1.02}
            >
              {({ isFocused }) => (
                <View className="w-full h-full relative">
                  <Image 
                    source={{ uri: stream.thumbnail }} 
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                  
                  {/* Overlay for Focused Stream */}
                  {isFocused && (
                    <View className="absolute inset-0 bg-black/40 p-6 justify-between">
                      <View className="flex-row justify-between items-start">
                        <View className="bg-red-600 px-3 py-1 rounded">
                          <Text className="text-white font-black text-xs uppercase">Live</Text>
                        </View>
                        <View className="flex-row space-x-3">
                          <View className="bg-white/20 p-2 rounded-full">
                            <Volume2 size={20} color="white" />
                          </View>
                          <View className="bg-white/20 p-2 rounded-full">
                            <Maximize2 size={20} color="white" />
                          </View>
                        </View>
                      </View>
                      
                      <View>
                        <Text className="text-white text-xl font-bold mb-1" numberOfLines={1}>
                          {stream.title}
                        </Text>
                        <Text className="text-white/60 font-medium">Channel Name</Text>
                      </View>
                    </View>
                  )}

                  {/* Audio Icon for non-focused but active audio (YouTube TV style) */}
                  {!isFocused && index === 0 && (
                    <View className="absolute bottom-4 right-4 bg-black/60 p-2 rounded-full">
                      <Volume2 size={16} color="white" />
                    </View>
                  )}
                </View>
              )}
            </FocusablePressable>
          </View>
        ))}
      </View>

      {/* Multiview Controls Footer */}
      <View className="h-20 flex-row items-center justify-center space-x-10">
        <Text className="text-white/40 font-bold uppercase tracking-[0.2em] text-xs">
          Use Arrow Keys to switch audio
        </Text>
        <FocusablePressable 
          className="bg-white/10 px-8 py-3 rounded-full"
          focusedClassName="bg-white/20"
        >
          <Text className="text-white font-bold">Change Layout</Text>
        </FocusablePressable>
      </View>
    </View>
  );
}
