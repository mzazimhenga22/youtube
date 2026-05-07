import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Search, Mic, TrendingUp, Clock } from 'lucide-react-native';
import { FocusablePressable } from './FocusablePressable';
import { TvKeyboard } from './TVKeyboard';

const recentSearches = ["Interstellar soundtrack", "Lofi hip hop", "Latest tech news", "Cooking recipes"];
const trendingSearches = ["SpaceX launch", "World Cup highlights", "New movie trailers", "ASMR study"];

export function SearchOverlay() {
  const [query, setQuery] = useState('');

  const handleKeyPress = (key: string) => setQuery(prev => prev + key);
  const handleDelete = () => setQuery(prev => prev.slice(0, -1));
  const handleClear = () => setQuery('');
  const handleEnter = () => console.log('Searching for:', query);

  return (
    <View className="flex-1 bg-[#0F0F0F] flex-row">
      {/* Left: Search Controls & Keyboard */}
      <View className="flex-1 p-20 pt-10">
        <View className="flex-row items-center mb-12">
          <View className="flex-1 bg-white/10 rounded-2xl flex-row items-center px-6 h-20 border border-white/5">
            <Search size={32} color="white" className="mr-6 opacity-60" />
            <Text className={`text-4xl font-bold ${query ? 'text-white' : 'text-white/40'}`}>
              {query || 'Search'}
            </Text>
          </View>
          <FocusablePressable 
            className="ml-6 bg-white/10 p-6 rounded-2xl"
            focusedClassName="bg-white"
          >
            {({ isFocused }) => (
              <Mic size={32} color={isFocused ? "black" : "white"} />
            )}
          </FocusablePressable>
        </View>

        <TvKeyboard 
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onClear={handleClear}
          onEnter={handleEnter}
        />
      </View>

      {/* Right: Suggestions */}
      <View className="w-[450px] bg-black/20 p-20 pt-10 border-l border-white/5">
        <View className="mb-16">
          <View className="flex-row items-center mb-8 opacity-60">
            <Clock size={20} color="white" className="mr-3" />
            <Text className="text-white text-xl font-black uppercase tracking-widest">Recent</Text>
          </View>
          {recentSearches.map((item, index) => (
            <FocusablePressable 
              key={index}
              className="py-4 px-6 rounded-2xl mb-2"
              focusedClassName="bg-white/10"
            >
              <Text className="text-zinc-300 text-xl font-bold">{item}</Text>
            </FocusablePressable>
          ))}
        </View>

        <View>
          <View className="flex-row items-center mb-8 opacity-60">
            <TrendingUp size={20} color="white" className="mr-3" />
            <Text className="text-white text-xl font-black uppercase tracking-widest">Trending</Text>
          </View>
          {trendingSearches.map((item, index) => (
            <FocusablePressable 
              key={index}
              className="py-4 px-6 rounded-2xl mb-2"
              focusedClassName="bg-white/10"
            >
              <Text className="text-zinc-300 text-xl font-bold">{item}</Text>
            </FocusablePressable>
          ))}
        </View>
      </View>
    </View>
  );
}
