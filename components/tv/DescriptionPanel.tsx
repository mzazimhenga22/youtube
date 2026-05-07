import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { FocusablePressable } from './FocusablePressable';
import { X } from 'lucide-react-native';

interface DescriptionPanelProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  views: string;
  date: string;
  channelName: string;
  channelAvatar: string;
}

export function DescriptionPanel({
  isVisible,
  onClose,
  title,
  description,
  views,
  date,
  channelName,
  channelAvatar
}: DescriptionPanelProps) {
  if (!isVisible) return null;

  return (
    <View className="absolute top-0 right-0 bottom-0 w-[450px] bg-[#0F0F0F] border-l border-white/10 z-50">
      <View className="p-8 h-full">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-10">
          <Text className="text-white text-3xl font-black">Description</Text>
          <FocusablePressable 
            onPress={onClose}
            className="p-3 rounded-full bg-white/10"
            focusedClassName="bg-white/20"
          >
            <X size={28} color="white" />
          </FocusablePressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-white text-2xl font-bold mb-4 leading-tight">{title}</Text>
          
          <View className="flex-row items-center mb-8">
            <Text className="text-zinc-400 font-bold mr-4">{views} views</Text>
            <Text className="text-zinc-400 font-bold">{date}</Text>
          </View>

          {/* Channel Info */}
          <View className="flex-row items-center mb-10 p-4 bg-white/5 rounded-2xl border border-white/5">
            <View className="w-14 h-14 rounded-full overflow-hidden bg-zinc-800 mr-4">
              <Image source={{ uri: channelAvatar }} className="w-full h-full" />
            </View>
            <View>
              <Text className="text-white text-xl font-bold">{channelName}</Text>
              <Text className="text-zinc-400 font-medium">1.2M subscribers</Text>
            </View>
          </View>

          <Text className="text-zinc-300 text-lg leading-relaxed">
            {description}
          </Text>

          {/* AI Info - 2025 YouTube TV Feature */}
          <View className="mt-12 p-6 bg-zinc-900 rounded-3xl border border-white/5">
            <Text className="text-white font-black text-sm uppercase tracking-widest mb-3 opacity-60">About this video</Text>
            <Text className="text-zinc-400 text-base leading-snug">
              This content was created using AI tools to enhance visual fidelity and sound design. Learn more about YouTube's AI disclosure policies.
            </Text>
          </View>

          <View className="h-20" />
        </ScrollView>
      </View>
    </View>
  );
}
