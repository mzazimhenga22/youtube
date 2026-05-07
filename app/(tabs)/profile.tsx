import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { useAppStore } from '@/lib/store';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { User, Settings, HelpCircle, LogOut, Bell, Shield, Clock, Heart } from 'lucide-react-native';
import Animated, { FadeIn, FadeInLeft } from 'react-native-reanimated';
import { router } from 'expo-router';

const PROFILE_ACTIONS = [
  { id: 'settings', label: 'Settings', icon: Settings, route: '/(tabs)/settings' },
  { id: 'history', label: 'Watch History', icon: Clock, route: '/(tabs)/library' },
  { id: 'liked', label: 'Liked Videos', icon: Heart, route: '/(tabs)/library' },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'help', label: 'Help & Support', icon: HelpCircle },
];

export default function ProfileScreen() {
  const { currentProfile, logout } = useAppStore();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  if (!currentProfile) return null;

  return (
    <View style={styles.container}>
      {/* Left Profile Info */}
      <View style={styles.leftColumn}>
        <Animated.View entering={FadeIn.duration(1000)} className="items-center">
          <View className="w-64 h-64 rounded-[80px] overflow-hidden border-8 border-white/10 mb-10 shadow-2xl">
            <Image 
              source={{ uri: currentProfile.avatar }} 
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          </View>
          <Text className="text-white text-6xl font-black mb-2">{currentProfile.name}</Text>
          <Text className="text-zinc-500 text-3xl font-bold mb-12">{currentProfile.handle}</Text>
          
          <FocusablePressable
            onPress={() => router.replace('/')}
            className="bg-white/10 px-10 py-5 rounded-full border-2 border-transparent"
            focusedClassName="bg-white border-white scale-105"
          >
            {({ isFocused }) => (
              <Text className={`text-2xl font-black ${isFocused ? 'text-black' : 'text-white'}`}>
                SWITCH PROFILE
              </Text>
            )}
          </FocusablePressable>
        </Animated.View>
      </View>

      {/* Right Actions Grid */}
      <View style={styles.rightColumn}>
        <Text className="text-zinc-500 text-xl font-black uppercase tracking-[4px] mb-8">
          Account Settings
        </Text>
        
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingRight: 40, paddingBottom: 100 }}>
          <View className="flex-row flex-wrap" style={{ gap: 24 }}>
            {PROFILE_ACTIONS.map((action, index) => {
              const Icon = action.icon;
              return (
                <Animated.View 
                  key={action.id} 
                  entering={FadeInLeft.delay(index * 100).duration(600)}
                  style={{ width: '48%' }}
                >
                  <FocusablePressable
                    onPress={() => action.route && router.push(action.route)}
                    className="bg-white/5 p-8 rounded-[40px] flex-row items-center border-2 border-transparent"
                    focusedClassName="bg-white scale-105"
                  >
                    {({ isFocused }) => (
                      <>
                        <View className={`w-16 h-16 rounded-3xl items-center justify-center ${isFocused ? 'bg-zinc-100' : 'bg-white/10'}`}>
                          <Icon size={32} color={isFocused ? "black" : "white"} />
                        </View>
                        <Text className={`ml-6 text-2xl font-bold ${isFocused ? 'text-black' : 'text-white'}`}>
                          {action.label}
                        </Text>
                      </>
                    )}
                  </FocusablePressable>
                </Animated.View>
              );
            })}

            {/* Logout Action */}
            <Animated.View 
              entering={FadeInLeft.delay(PROFILE_ACTIONS.length * 100).duration(600)}
              style={{ width: '48%' }}
            >
              <FocusablePressable
                onPress={handleLogout}
                className="bg-red-500/10 p-8 rounded-[40px] flex-row items-center border-2 border-transparent"
                focusedClassName="bg-red-500 scale-105"
              >
                {({ isFocused }) => (
                  <>
                    <View className={`w-16 h-16 rounded-3xl items-center justify-center ${isFocused ? 'bg-white/20' : 'bg-red-500/20'}`}>
                      <LogOut size={32} color="white" />
                    </View>
                    <Text className="ml-6 text-2xl font-bold text-white">
                      Sign Out
                    </Text>
                  </>
                )}
              </FocusablePressable>
            </Animated.View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    flexDirection: 'row',
    padding: 60,
  },
  leftColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.05)',
  },
  rightColumn: {
    flex: 2,
    paddingLeft: 60,
    justifyContent: 'center',
  }
});
