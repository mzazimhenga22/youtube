import React, { useState, useEffect } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export function AmbientMode() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View className="flex-1 bg-black">
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1920' }}
        className="flex-1"
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
          className="absolute inset-0"
        />

        <View className="absolute bottom-20 left-20">
          <Text className="text-white text-9xl font-black tracking-tighter opacity-90">{timeString}</Text>
          <Text className="text-white/60 text-2xl font-bold mt-4 uppercase tracking-[0.4em]">
            Norway • Senja Island
          </Text>
        </View>

        <View className="absolute bottom-20 right-20 items-end">
          <Text className="text-white/40 font-bold uppercase tracking-widest text-sm mb-4">Press any button to resume</Text>
          <View className="flex-row" style={{ gap: 8 }}>
            <View className="w-2 h-2 rounded-full bg-white/60" />
            <View className="w-2 h-2 rounded-full bg-white/20" />
            <View className="w-2 h-2 rounded-full bg-white/20" />
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}
