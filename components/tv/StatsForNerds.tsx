import React from 'react';
import { View, Text } from 'react-native';

interface StatsForNerdsProps {
  isVisible: boolean;
}

export function StatsForNerds({ isVisible }: StatsForNerdsProps) {
  if (!isVisible) return null;

  const stats = [
    { label: 'Video ID / CPN', value: 'dQw4w9WgXcQ / 7R9-X2M-5A3' },
    { label: 'Viewport / Frames', value: '1920x1080 / 0 dropped' },
    { label: 'Current / Optimal Res', value: '1920x1080@60 / 1920x1080@60' },
    { label: 'Codecs', value: 'vp09.00.51.08.01.01.01.01.00 (248) / opus (251)' },
    { label: 'Color', value: 'bt.709 / bt.709' },
    { label: 'Connection Speed', value: '84231 Kbps' },
    { label: 'Network Activity', value: '0 KB' },
    { label: 'Buffer Health', value: '24.52 s' },
    { label: 'Mystery Text', value: 's:4 t:142.15 b:0.000-166.671' },
  ];

  return (
    <View className="absolute top-10 right-10 bg-black/80 p-6 rounded-3xl border border-white/10 w-96 z-[100]">
      <Text className="text-white font-black text-sm uppercase tracking-widest mb-4 opacity-60">Stats for Nerds</Text>
      {stats.map((stat, index) => (
        <View key={index} className="flex-row justify-between mb-2">
          <Text className="text-zinc-500 font-bold text-xs">{stat.label}</Text>
          <Text className="text-white font-mono text-xs ml-4" numberOfLines={1}>{stat.value}</Text>
        </View>
      ))}
    </View>
  );
}
