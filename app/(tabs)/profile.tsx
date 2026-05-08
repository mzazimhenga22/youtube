import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Image, FlatList, Dimensions } from 'react-native';
import { useAppStore } from '@/lib/store';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { HorizontalRail } from '@/components/tv/HorizontalRail';
import { Settings, LogOut, User, Users, Bell, Shield, HelpCircle, History, Heart, Clock } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, interpolate, useSharedValue, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: 'switch', label: 'Switch Profile', icon: Users },
  { id: 'account', label: 'Add Account', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'help', label: 'Help', icon: HelpCircle },
];

export default function ProfileScreen() {
  const { currentProfile, watchHistory, likedVideos, watchLater, logout } = useAppStore();
  const [activeRail, setActiveRail] = useState<string | null>(null);

  const openProfilePicker = useCallback((openAuth = false) => {
    router.replace({
      pathname: '/',
      params: {
        skipSplash: '1',
        ...(openAuth ? { auth: '1' } : {}),
      },
    });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase SignOut Error', e);
    }
    logout();
    openProfilePicker();
  }, [logout, openProfilePicker]);

  const handleQuickAction = useCallback((id: string) => {
    if (id === 'switch') {
      openProfilePicker();
      return;
    }
    if (id === 'account') {
      openProfilePicker(true);
      return;
    }
    if (id === 'settings') {
      router.push('/(tabs)/settings' as any);
      return;
    }
    if (id === 'help') {
      router.push({ pathname: '/(tabs)/settings', params: { section: 'about' } } as any);
    }
  }, [openProfilePicker]);

  const renderHeader = useCallback(() => {
    if (!currentProfile) return null;

    return (
      <View className="px-16 pt-24 mb-16">
        <Animated.View entering={FadeIn.duration(1000)} className="flex-row items-center mb-16">
          {/* Avatar with dynamic glow */}
          <View className="relative">
             <View className="absolute -inset-4 bg-white/5 rounded-[48px] blur-3xl" />
             <View className="w-44 h-44 rounded-[40px] overflow-hidden border-4 border-white/10 shadow-2xl">
                <Image 
                  source={typeof currentProfile.avatar === 'string' ? { uri: currentProfile.avatar } : currentProfile.avatar} 
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
             </View>
          </View>
          
          <View className="ml-12 flex-1">
            <Text className="text-white text-7xl font-black tracking-tighter leading-none mb-2">
              {currentProfile.name}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-zinc-500 text-3xl font-bold">{currentProfile.handle}</Text>
              <View className="mx-4 w-2 h-2 bg-zinc-800 rounded-full" />
              <Text className="text-zinc-500 text-3xl font-bold uppercase tracking-widest">
                {currentProfile.mode} profile
              </Text>
            </View>
          </View>

          {/* Account Stats / Badges */}
          <View className="flex-row bg-white/5 rounded-3xl p-6 border border-white/5" style={{ gap: 40 }}>
             <View className="items-center">
                <Text className="text-white text-3xl font-black">{watchHistory.length}</Text>
                <Text className="text-zinc-600 text-sm font-black uppercase tracking-widest">Watched</Text>
             </View>
             <View className="items-center">
                <Text className="text-white text-3xl font-black">{likedVideos.length}</Text>
                <Text className="text-zinc-600 text-sm font-black uppercase tracking-widest">Liked</Text>
             </View>
          </View>
        </Animated.View>

        {/* Action Row */}
        <View className="flex-row items-center" style={{ gap: 20 }}>
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <FocusablePressable
                key={action.id}
                onPress={() => handleQuickAction(action.id)}
                className="bg-white/5 px-10 py-6 rounded-full flex-row items-center border-2 border-transparent"
                focusedClassName="bg-white border-white scale-105 shadow-2xl shadow-white/20"
              >
                {({ isFocused }) => (
                  <>
                    <Icon size={28} color={isFocused ? 'black' : 'white'} />
                    <Text className={`ml-4 text-2xl font-black ${isFocused ? 'text-black' : 'text-white'}`}>
                      {action.label}
                    </Text>
                  </>
                )}
              </FocusablePressable>
            );
          })}

          <FocusablePressable
            onPress={handleLogout}
            className="bg-red-500/10 px-10 py-6 rounded-full flex-row items-center border-2 border-transparent"
            focusedClassName="bg-red-500 border-red-400 scale-105"
          >
            {({ isFocused }) => (
              <>
                <LogOut size={28} color="white" />
                <Text className="ml-4 text-2xl font-black text-white">
                  Sign Out
                </Text>
              </>
            )}
          </FocusablePressable>
        </View>
      </View>
    );
  }, [currentProfile, watchHistory, likedVideos, handleLogout, handleQuickAction]);

  const rails = [
    { title: 'Recently Played', data: watchHistory, icon: History },
    { title: 'Liked Videos', data: likedVideos, icon: Heart },
    { title: 'Watch Later', data: watchLater, icon: Clock },
  ];

  const renderRail = useCallback(({ item, index }: { item: any, index: number }) => {
    if (item.data.length === 0) return null;
    
    return (
      <Animated.View entering={FadeInDown.delay(200 + index * 100).duration(800)}>
        <HorizontalRail 
          title={item.title}
          videos={item.data}
        />
      </Animated.View>
    );
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Ambient Glow */}
      <View style={styles.ambientGlow} />
      
      <FlatList
        data={rails}
        keyExtractor={(item) => item.title}
        ListHeaderComponent={renderHeader}
        renderItem={renderRail}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Edge Fades */}
      <LinearGradient 
        colors={['#0f0f0f', 'transparent']} 
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 100, zIndex: 50, pointerEvents: 'none' }} 
      />
      <LinearGradient 
        colors={['transparent', '#0f0f0f']} 
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, zIndex: 50, pointerEvents: 'none' }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  ambientGlow: {
    position: 'absolute',
    top: -100,
    left: '10%',
    width: '80%',
    height: 600,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: SCREEN_WIDTH,
  }
});
