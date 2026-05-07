import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput } from 'react-native';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Sparkles, Mic, Send, Lightbulb, Search, Film } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const suggestions = [
  { icon: Search, label: "What are some good sci-fi movies from the 90s?" },
  { icon: Film, label: "Summarize the latest season of 'House of the Dragon'" },
  { icon: Lightbulb, label: "Explain how black holes work in simple terms" },
];

export default function GeminiAskScreen() {
  const [query, setQuery] = useState('');

  return (
    <View className="flex-1 bg-[#030303] flex-row">
      <LinearGradient
        colors={['rgba(168,85,247,0.15)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      <View className="flex-1 p-20 pt-16">
        {/* Header */}
        <View className="flex-row items-center mb-16">
          <View className="bg-purple-600 p-4 rounded-3xl mr-6 shadow-2xl shadow-purple-600/40">
            <Sparkles size={48} color="white" fill="white" />
          </View>
          <View>
            <Text className="text-white text-6xl font-black tracking-tighter">Ask Gemini</Text>
            <Text className="text-purple-400 text-xl font-bold uppercase tracking-[0.3em] mt-2">AI-Powered Exploration</Text>
          </View>
        </View>

        {/* Input Area */}
        <View className="mb-16">
          <View className="bg-white/10 rounded-[40px] flex-row items-center px-10 h-32 border border-white/10 relative overflow-hidden">
             <LinearGradient
              colors={['rgba(168,85,247,0.05)', 'transparent']}
              className="absolute inset-0"
            />
            <Search size={40} color="white" className="mr-8 opacity-40" />
            <TextInput
              placeholder="Ask anything about YouTube content..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="flex-1 text-4xl font-bold text-white"
              value={query}
              onChangeText={setQuery}
            />
            <View className="flex-row" style={{ gap: 16 }}>
               <FocusablePressable className="bg-purple-600 p-6 rounded-3xl" focusedClassName="bg-white">
                {({ isFocused }) => (
                  <Mic size={36} color={isFocused ? "black" : "white"} />
                )}
              </FocusablePressable>
              <FocusablePressable className="bg-white/10 p-6 rounded-3xl" focusedClassName="bg-white">
                {({ isFocused }) => (
                  <Send size={36} color={isFocused ? "black" : "white"} />
                )}
              </FocusablePressable>
            </View>
          </View>
        </View>

        {/* Suggestions */}
        <View>
          <Text className="text-white/40 font-black text-sm uppercase tracking-widest mb-8">Try asking</Text>
          <View className="flex-row" style={{ gap: 24 }}>
            {suggestions.map((item, index) => {
              const Icon = item.icon;
              return (
                <FocusablePressable 
                  key={index}
                  className="bg-white/5 p-10 rounded-[40px] flex-1 border border-white/5"
                  focusedClassName="bg-white border-purple-500 shadow-2xl shadow-purple-500/20"
                  activeScale={1.1}
                >
                  {({ isFocused }) => (
                    <>
                      <View className={`p-4 rounded-2xl self-start mb-6 ${isFocused ? 'bg-purple-100' : 'bg-white/10'}`}>
                        <Icon size={32} color={isFocused ? "#9333ea" : "white"} />
                      </View>
                      <Text className={`text-2xl font-black leading-tight ${isFocused ? 'text-black' : 'text-white'}`}>
                        {item.label}
                      </Text>
                    </>
                  )}
                </FocusablePressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Right: History/Context Sidebar */}
      <View className="w-[400px] bg-black/40 border-l border-white/5 p-16">
        <Text className="text-white/60 font-black text-sm uppercase tracking-widest mb-10">Recent Chats</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {[1,2,3].map((i) => (
            <FocusablePressable 
              key={i}
              className="mb-4 p-6 rounded-2xl bg-white/5 border border-white/5"
              focusedClassName="bg-white/10 border-white/20"
            >
              <Text className="text-zinc-400 font-bold mb-2">2 hours ago</Text>
              <Text className="text-white text-lg font-medium" numberOfLines={1}>Help me find a workout video...</Text>
            </FocusablePressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
