import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Sparkles, Mic, Search } from 'lucide-react-native';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { LinearGradient } from 'expo-linear-gradient';

export default function AskScreen() {
  return (
    <View className="flex-1 bg-[#030303]">
      <LinearGradient
        colors={['rgba(168,85,247,0.15)', 'transparent']}
        className="absolute inset-0"
      />
      
      <View className="flex-1 items-center justify-center px-20">
        <View className="flex-row items-center mb-8">
          <Sparkles size={48} color="#A855F7" strokeWidth={2.5} />
          <Text className="text-white text-5xl font-black ml-4 tracking-tighter">Ask YouTube AI</Text>
        </View>

        <Text className="text-zinc-400 text-xl mb-12 text-center max-w-2xl leading-relaxed">
          Ask anything about what's live, scores, or find exactly what you want to watch.
        </Text>

        <View className="w-full max-w-3xl">
          <FocusablePressable 
            className="bg-white/10 h-20 rounded-2xl flex-row items-center px-8 border border-white/5 mb-8"
            focusedClassName="bg-white/20 border-white/20"
            activeScale={1.02}
          >
            <Search size={32} color="#71717A" />
            <Text className="text-zinc-500 text-2xl ml-6 font-medium">Try "What's the score of the Lakers game?"</Text>
          </FocusablePressable>

          <View className="flex-row justify-center" style={{ gap: 24 }}>
            <FocusablePressable 
              className="bg-purple-600 p-6 rounded-full shadow-2xl shadow-purple-600/40"
              focusedClassName="bg-purple-700 scale-110"
            >
              <Mic size={32} color="white" />
            </FocusablePressable>
            
            <View className="flex-row" style={{ gap: 16 }}>
              <SuggestionChip text="Live Sports" />
              <SuggestionChip text="Recent Comedies" />
              <SuggestionChip text="Cooking Shows" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

function SuggestionChip({ text }: { text: string }) {
  return (
    <FocusablePressable 
      className="bg-white/5 px-6 py-4 rounded-xl border border-white/5"
      focusedClassName="bg-white"
    >
      {({ isFocused }) => (
        <Text className={isFocused ? "text-black font-bold" : "text-zinc-400 font-bold"}>{text}</Text>
      )}
    </FocusablePressable>
  );
}
