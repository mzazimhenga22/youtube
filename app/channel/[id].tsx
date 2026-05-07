import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { youtubeService, Video } from '@/lib/youtube';
import { HorizontalRail } from '@/components/tv/HorizontalRail';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Search, Settings, MoreVertical, CheckCircle2 } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ChannelScreen() {
  const { id, name, avatar } = useLocalSearchParams();
  const router = useRouter();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');

  useEffect(() => {
    async function fetchChannelContent() {
      try {
        const data = await youtubeService.getHomeVideos(); // Simulate channel content
        setVideos(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchChannelContent();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-[#0f0f0f] items-center justify-center">
        <ActivityIndicator size="large" color="#FF0000" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#0f0f0f]">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Dynamic Channel Banner */}
        <View className="h-80 w-full overflow-hidden relative">
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600' }} 
            className="w-full h-full"
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(15,15,15,0.95)']}
            className="absolute inset-0"
          />
        </View>

        {/* Channel Identity Header */}
        <View className="px-16 -mt-20 flex-row items-end mb-16">
          <View className="w-40 h-40 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl">
            <Image source={{ uri: (avatar as string) || `https://i.pravatar.cc/150?u=${name}` }} className="w-full h-full" />
          </View>
          
          <View className="ml-10 mb-2 flex-1">
            <View className="flex-row items-center mb-2">
              <Text className="text-white text-6xl font-black mr-4 tracking-tighter">{name || 'Creator'}</Text>
              <CheckCircle2 size={32} color="#3EA6FF" fill="#3EA6FF" />
            </View>
            <Text className="text-zinc-500 text-2xl font-bold">@{(name as string)?.toLowerCase().replace(/\s/g, '')} • 12.4M Subscribers • 1.2K Videos</Text>
            
            <View className="flex-row mt-8 space-x-6">
              <FocusablePressable className="bg-white px-10 py-4 rounded-full" focusedClassName="scale-110">
                <Text className="text-black font-black text-xl">Subscribe</Text>
              </FocusablePressable>
              <FocusablePressable className="bg-white/10 px-6 py-4 rounded-full" focusedClassName="bg-white scale-110">
                {({ isFocused }) => <Bell size={28} color={isFocused ? "black" : "white"} />}
              </FocusablePressable>
              <FocusablePressable className="bg-white/10 px-6 py-4 rounded-full" focusedClassName="bg-white scale-110">
                {({ isFocused }) => <Search size={28} color={isFocused ? "black" : "white"} />}
              </FocusablePressable>
            </View>
          </View>
        </View>

        {/* Channel Navigation Tabs */}
        <View className="px-16 mb-12 flex-row border-b border-white/5 pb-4">
          {['Home', 'Videos', 'Shorts', 'Live', 'Playlists'].map((tab) => (
            <FocusablePressable 
              key={tab}
              onFocus={() => setActiveTab(tab)}
              className="mr-12"
            >
              <Text className={`text-2xl font-black ${activeTab === tab ? 'text-white underline underline-offset-8' : 'text-zinc-500'}`}>
                {tab}
              </Text>
            </FocusablePressable>
          ))}
        </View>

        {/* Dynamic Content Rails */}
        <HorizontalRail title="Latest uploads" videos={videos.slice(0, 8)} />
        <HorizontalRail title="Popular videos" videos={videos.slice().reverse().slice(0, 8)} />
        <HorizontalRail title="Playlists" videos={[]} />

      </ScrollView>

      {/* Global Back Button */}
      <View className="absolute top-10 left-10 z-50">
        <FocusablePressable 
          onPress={() => router.back()}
          className="w-16 h-16 bg-black/40 rounded-full items-center justify-center backdrop-blur-md"
          focusedClassName="bg-white scale-110"
        >
          {({ isFocused }) => <Text className={`text-4xl ${isFocused ? 'text-black' : 'text-white'}`}>←</Text>}
        </FocusablePressable>
      </View>
    </View>
  );
}
