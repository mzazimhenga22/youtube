import React from 'react';
import { View } from 'react-native';
import { Tv, Play, Music, Pencil, Settings } from 'lucide-react-native';
import { FocusablePressable } from './FocusablePressable';
import { useAppStore } from '@/lib/store';

export function KidsSidebar() {
  const { setProfile } = useAppStore();

  const navItems = [
    { icon: Tv, color: '#FF5C5C', label: 'Shows' },
    { icon: Play, color: '#3B82F6', label: 'Explore' },
    { icon: Music, color: '#A855F7', label: 'Music' },
    { icon: Pencil, color: '#10B981', label: 'Learning' },
  ];

  return (
    <View className="w-32 h-full bg-[#FFFFFF] items-center py-12 border-r-8 border-[#F3F4F6]">
      <View className="flex-1 space-y-10">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <FocusablePressable
              key={index}
              className="w-20 h-20 rounded-full items-center justify-center mb-10 border-4 border-transparent"
              focusedClassName="bg-[#F3F4F6] border-[#FFD700] scale-125"
              activeScale={1.1}
            >
              <Icon size={40} color={item.color} strokeWidth={3} />
            </FocusablePressable>
          );
        })}
      </View>

      <FocusablePressable
        onPress={() => setProfile(null)}
        className="w-16 h-16 rounded-full bg-zinc-100 items-center justify-center"
        focusedClassName="bg-zinc-200 border-2 border-zinc-400"
      >
        <Settings size={28} color="#71717A" />
      </FocusablePressable>
    </View>
  );
}
