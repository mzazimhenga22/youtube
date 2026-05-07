import React from 'react';
import { View, Text, ScrollView, Image, Dimensions } from 'react-native';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CHANNELS = [
  { name: 'CNN', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/CNN.svg', programs: ['CNN News Central', 'The Lead', 'The Situation Room'] },
  { name: 'ESPN', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/ESPN_wordmark.svg', programs: ['SportsCenter', 'NFL Live', 'NBA Today'] },
  { name: 'HBO', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/de/HBO_logo.svg', programs: ['House of the Dragon', 'The Last of Us', 'Succession'] },
  { name: 'National Geographic', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/6a/National_Geographic_logo.svg', programs: ['Life Below Zero', 'Drain the Oceans', 'Trafficked'] },
  { name: 'Disney', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Disney_Channel_logo.svg', programs: ['The Owl House', 'Bluey', 'Amphibia'] },
  { name: 'BBC News', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/62/BBC_News_2022.svg', programs: ['Global News', 'BBC World Report', 'Hardtalk'] },
];

const TIME_SLOTS = ['8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'];

export default function LiveGuideScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#0f0f0f]">
      {/* Header */}
      <View className="px-16 pt-20 mb-8 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-5xl font-black tracking-tighter">Live Guide</Text>
          <Text className="text-zinc-500 text-xl font-bold mt-2">Tuesday, May 5 • 8:15 PM</Text>
        </View>
        <FocusablePressable 
          onPress={() => router.back()}
          className="bg-white/10 px-8 py-3 rounded-full"
          focusedClassName="bg-white"
        >
          {({ isFocused }) => <Text className={`font-black text-lg ${isFocused ? 'text-black' : 'text-white'}`}>Back to Home</Text>}
        </FocusablePressable>
      </View>

      {/* Time Header Row */}
      <View className="flex-row px-16 border-b border-white/5 pb-4">
        <View className="w-64" /> {/* Channel column spacer */}
        {TIME_SLOTS.map((time) => (
          <View key={time} className="w-[400px] items-center">
            <Text className="text-zinc-500 font-bold text-lg">{time}</Text>
          </View>
        ))}
      </View>

      {/* Grid Content */}
      <ScrollView className="flex-1 px-16 pt-6" showsVerticalScrollIndicator={false}>
        {CHANNELS.map((channel, i) => (
          <View key={channel.name} className="flex-row items-center mb-4 h-24">
            {/* Channel Info */}
            <View className="w-64 flex-row items-center">
               <View className="w-16 h-16 bg-white/5 rounded-2xl items-center justify-center p-3 border border-white/10">
                  <Image source={{ uri: channel.logo }} className="w-full h-full" resizeMode="contain" style={{ tintColor: 'white' }} />
               </View>
               <Text className="text-white font-bold text-xl ml-4">{channel.name}</Text>
            </View>

            {/* Program Slots */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={false} className="flex-1 overflow-visible">
               <View className="flex-row space-x-4">
                  {channel.programs.map((prog, pi) => (
                    <FocusablePressable
                      key={`${channel.name}-${pi}`}
                      className="w-[384px] h-20 bg-white/5 rounded-2xl p-6 justify-center border-2 border-transparent"
                      focusedClassName="bg-white border-white scale-[1.02] shadow-2xl"
                    >
                      {({ isFocused }) => (
                        <>
                          <Text className={`text-xl font-black ${isFocused ? 'text-black' : 'text-white'}`} numberOfLines={1}>{prog}</Text>
                          <Text className={`text-sm font-bold mt-1 ${isFocused ? 'text-black/60' : 'text-zinc-500'}`}>8:00 - 9:00 PM</Text>
                          
                          {pi === 0 && (
                             <View className="absolute bottom-0 left-0 h-1 bg-red-600 w-[45%]" />
                          )}
                        </>
                      )}
                    </FocusablePressable>
                  ))}
               </View>
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {/* Interactive Footer */}
      <View className="px-16 py-8 border-t border-white/5 bg-black/40 backdrop-blur-md">
         <View className="flex-row space-x-6">
            <Text className="text-zinc-500 font-bold">Sort by: <Text className="text-white">Default</Text></Text>
            <Text className="text-zinc-500 font-bold">Filter: <Text className="text-white">All Channels</Text></Text>
         </View>
      </View>
    </View>
  );
}
