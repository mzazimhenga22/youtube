import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FocusablePressable } from './FocusablePressable';
import { Delete, Space, CornerDownLeft, Search } from 'lucide-react-native';

const keys = [
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  ['H', 'I', 'J', 'K', 'L', 'M', 'N'],
  ['O', 'P', 'Q', 'R', 'S', 'T', 'U'],
  ['V', 'W', 'X', 'Y', 'Z', '1', '2'],
  ['3', '4', '5', '6', '7', '8', '9'],
  ['0', 'SPACE', 'BACKSPACE', 'SEARCH']
];

interface TvKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onClear: () => void;
  onEnter: () => void;
}

export function TvKeyboard({ onKeyPress, onDelete, onClear, onEnter }: TvKeyboardProps) {
  return (
    <View className="bg-white/5 p-8 rounded-[40px] border border-white/5 backdrop-blur-3xl">
      {keys.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row mb-4 justify-center">
          {row.map((key) => {
            const isSpecial = ['SPACE', 'BACKSPACE', 'SEARCH'].includes(key);
            
            return (
              <FocusablePressable
                key={key}
                onPress={() => {
                  if (key === 'BACKSPACE') onDelete();
                  else if (key === 'SEARCH') onEnter();
                  else if (key === 'SPACE') onKeyPress(' ');
                  else onKeyPress(key.toLowerCase());
                }}
                className={cn(
                  "h-16 rounded-2xl items-center justify-center mx-2 border-2 border-transparent",
                  isSpecial ? "px-8" : "w-16",
                  key === 'SEARCH' ? "bg-red-600" : "bg-white/5"
                )}
                focusedClassName="bg-white border-white scale-110 shadow-2xl shadow-white/20"
                activeScale={1.2}
              >
                {({ isFocused }) => (
                  <View className="items-center justify-center">
                    {key === 'BACKSPACE' ? (
                      <Delete size={28} color={isFocused ? "black" : "white"} />
                    ) : key === 'SPACE' ? (
                      <Space size={28} color={isFocused ? "black" : "white"} />
                    ) : key === 'SEARCH' ? (
                      <Search size={28} color={isFocused ? "black" : "white"} strokeWidth={3} />
                    ) : (
                      <Text className={cn(
                        "text-2xl font-black",
                        isFocused ? "text-black" : "text-white"
                      )}>
                        {key}
                      </Text>
                    )}
                  </View>
                )}
              </FocusablePressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
