import React, { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { FocusablePressable } from './FocusablePressable';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface KidsVideoCardProps {
  title: string;
  thumbnail: string;
  duration: string;
  color?: string;
}

export const KidsVideoCard = memo(function KidsVideoCard({ 
  title, 
  thumbnail, 
  duration,
  color = "#3B82F6" // Default blue
}: KidsVideoCardProps) {
  return (
    <FocusablePressable 
      className="w-80 mr-8 rounded-[32px] overflow-hidden"
      focusedClassName="shadow-2xl shadow-blue-500/40"
      activeScale={1.1}
    >
      {({ isFocused }) => (
        <View className={cn(
          "bg-white rounded-[32px] p-2 transition-all duration-300",
          isFocused ? "bg-white" : "bg-white/90"
        )}>
          <View className={cn(
            "relative aspect-video rounded-[24px] overflow-hidden border-8 transition-all duration-300",
            isFocused ? "border-[#FFD700]" : "border-transparent" // Yellow "golden" focus border
          )}>
            <Image 
              source={{ uri: thumbnail }} 
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
            <View className="absolute bottom-3 right-3 bg-black/70 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-black">{duration}</Text>
            </View>
          </View>
          
          <View className="py-4 px-3 items-center">
            <Text 
              className={cn(
                "text-[#2D3436] font-black text-xl text-center leading-tight",
                isFocused ? "opacity-100" : "opacity-80"
              )} 
              numberOfLines={2}
            >
              {title}
            </Text>
          </View>

          {/* Playful bottom bar */}
          <View 
            className="h-2 w-1/2 self-center rounded-full mb-2" 
            style={{ backgroundColor: color }} 
          />
        </View>
      )}
    </FocusablePressable>
  );
});
