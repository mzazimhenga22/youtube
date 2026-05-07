import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { FocusablePressable } from './FocusablePressable';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const categories = ["All", "Live", "Sports", "Gaming", "Music", "Mixes", "News", "Comedy", "Programming", "Science", "Nature", "Cooking"];

export function CategoryChips() {
  return (
    <View className="mb-14">
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        renderItem={({ item, index }) => (
          <FocusablePressable
            className={cn(
              "px-10 py-5 rounded-2xl mr-6 border-2 transition-all duration-300",
              index === 0 ? "bg-white border-white shadow-xl shadow-white/20" : "bg-white/10 border-transparent"
            )}
            focusedClassName="bg-white border-white scale-110 shadow-2xl shadow-white/40"
            activeScale={1.15}
          >
            {({ isFocused }) => (
              <Text className={cn(
                "text-2xl font-black tracking-tight",
                (isFocused || (index === 0 && !isFocused)) ? "text-black" : "text-zinc-400"
              )}>
                {item}
              </Text>
            )}
          </FocusablePressable>
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 48 }}
      />
    </View>
  );
}
