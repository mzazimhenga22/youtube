import React from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { VideoCard } from './VideoCard';
import { FocusablePressable } from './FocusablePressable';
import { History, Clock, ThumbsUp, ListVideo, Download } from 'lucide-react-native';

const librarySections = [
  { id: 'history', title: 'History', icon: History },
  { id: 'watch-later', title: 'Watch Later', icon: Clock },
  { id: 'liked', title: 'Liked Videos', icon: ThumbsUp },
  { id: 'playlists', title: 'Playlists', icon: ListVideo },
  { id: 'downloads', title: 'Downloads', icon: Download },
];

export function LibraryGrid() {
  return (
    <ScrollView className="flex-1 bg-[#0F0F0F]" showsVerticalScrollIndicator={false}>
      {/* Top Section: User Profile & Quick Actions */}
      <View className="p-20 pb-10 flex-row items-center justify-between">
        <View>
          <Text className="text-white text-6xl font-black mb-4">Library</Text>
          <Text className="text-zinc-400 text-xl font-medium">Manage your history and saved content</Text>
        </View>
        <View className="flex-row space-x-6">
          <FocusablePressable className="bg-white/10 p-6 rounded-3xl" focusedClassName="bg-white">
            {({ isFocused }) => (
              <History size={32} color={isFocused ? "black" : "white"} />
            )}
          </FocusablePressable>
          <FocusablePressable className="bg-white/10 p-6 rounded-3xl" focusedClassName="bg-white">
            {({ isFocused }) => (
              <Settings size={32} color={isFocused ? "black" : "white"} />
            )}
          </FocusablePressable>
        </View>
      </View>

      {/* Main Grid Sections */}
      <View className="px-20 py-10 flex-row flex-wrap">
        {librarySections.map((section) => {
          const Icon = section.icon;
          return (
            <FocusablePressable 
              key={section.id}
              className="w-[300px] h-[200px] bg-white/5 mr-8 mb-8 rounded-3xl p-8 justify-between border border-white/5"
              focusedClassName="bg-white"
              activeScale={1.1}
            >
              {({ isFocused }) => (
                <>
                  <Icon size={48} color={isFocused ? "black" : "white"} strokeWidth={1.5} />
                  <View>
                    <Text className={isFocused ? "text-black text-2xl font-black" : "text-white text-2xl font-black"}>
                      {section.title}
                    </Text>
                    <Text className={isFocused ? "text-black/60 font-medium" : "text-zinc-500 font-medium"}>
                      124 items
                    </Text>
                  </View>
                </>
              )}
            </FocusablePressable>
          );
        })}
      </View>

      {/* Recently Played Row */}
      <View className="mt-10 mb-20">
        <Text className="px-20 text-white text-3xl font-black mb-8">Recently Played</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 80 }}
          data={[1,2,3,4,5]}
          renderItem={() => (
            <View className="mr-6">
              <VideoCard 
                id="dummy-1"
                title="Building a YouTube TV Clone in React Native"
                channel="DevChannel"
                views="1.2M"
                thumbnail="https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400"
                duration="12:34"
                progress={0.7}
              />
            </View>
          )}
        />
      </View>
    </ScrollView>
  );
}

// Dummy Settings icon for the import that was missing
import { Settings } from 'lucide-react-native';
