import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { useAppStore, Profile } from '@/lib/store';
import { router } from 'expo-router';
import { Plus, User, ShieldCheck, Zap } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PROFILES: Profile[] = [
  {
    id: 'p1',
    name: 'Main Account',
    handle: '@user_one',
    mode: 'regular',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'
  },
  {
    id: 'p2',
    name: 'Kids Mode',
    handle: 'Kids Safe',
    mode: 'kids',
    avatar: 'https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?auto=format&fit=crop&q=80&w=200'
  }
];

export default function ProfilePickerScreen() {
  const { setProfile } = useAppStore();
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const handleSelectProfile = (profile: Profile) => {
    setProfile(profile);
    if (profile.mode === 'kids') {
      router.replace('/kids-home');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Background Glow */}
      <View style={styles.bgGlow} />
      
      <Animated.View entering={FadeInUp.duration(1000)} className="items-center mb-24">
        <Text className="text-white text-7xl font-black tracking-tighter mb-4">
          Who's Watching?
        </Text>
        <Text className="text-zinc-500 text-3xl font-medium">
          Select a profile to start streaming
        </Text>
      </Animated.View>

      <View className="flex-row items-center justify-center" style={{ gap: 48 }}>
        {PROFILES.map((profile, index) => (
          <Animated.View 
            key={profile.id} 
            entering={FadeIn.delay(index * 200).duration(800)}
          >
            <FocusablePressable
              onFocus={() => setFocusedId(profile.id)}
              onPress={() => handleSelectProfile(profile)}
              className="items-center"
            >
              {({ isFocused }) => (
                <View className="items-center">
                  <View className={`
                    w-48 h-48 rounded-[60px] overflow-hidden border-8 transition-all duration-300
                    ${isFocused ? 'border-white scale-110 shadow-2xl shadow-white/30' : 'border-transparent opacity-60'}
                  `}>
                    <Image 
                      source={{ uri: profile.avatar }} 
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />
                    {profile.mode === 'kids' && (
                       <View className="absolute top-2 right-2 bg-yellow-400 p-1 rounded-full">
                          <ShieldCheck size={20} color="black" />
                       </View>
                    )}
                  </View>
                  <Text className={`
                    mt-8 text-3xl font-bold transition-all duration-300
                    ${isFocused ? 'text-white' : 'text-zinc-500'}
                  `}>
                    {profile.name}
                  </Text>
                  {isFocused && (
                     <Animated.View entering={ZoomIn.duration(300)} className="mt-2 bg-white/10 px-4 py-1 rounded-full">
                        <Text className="text-white/60 text-lg font-bold">{profile.handle}</Text>
                     </Animated.View>
                  )}
                </View>
              )}
            </FocusablePressable>
          </Animated.View>
        ))}

        {/* Add Profile Button */}
        <Animated.View entering={FadeIn.delay(600).duration(800)}>
          <FocusablePressable className="items-center">
            {({ isFocused }) => (
              <View className="items-center">
                <View className={`
                  w-48 h-48 rounded-[60px] items-center justify-center border-4 border-dashed transition-all duration-300
                  ${isFocused ? 'bg-white/10 border-white scale-110' : 'border-zinc-800 opacity-40'}
                `}>
                  <Plus size={64} color={isFocused ? "white" : "#71717A"} strokeWidth={3} />
                </View>
                <Text className={`mt-8 text-3xl font-bold ${isFocused ? 'text-white' : 'text-zinc-500'}`}>
                  Add Profile
                </Text>
              </View>
            )}
          </FocusablePressable>
        </Animated.View>
      </View>

      {/* Footer Branding */}
      <View className="absolute bottom-20 items-center">
         <View className="flex-row items-center bg-white/5 px-8 py-4 rounded-full border border-white/10">
            <Zap size={24} color="#ef4444" fill="#ef4444" />
            <Text className="text-white/40 text-2xl font-black ml-4 uppercase tracking-[8px]">
              Stream<Text className="text-white/20">flow</Text>
            </Text>
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgGlow: {
    position: 'absolute',
    top: '20%',
    width: SCREEN_WIDTH * 0.8,
    height: 400,
    backgroundColor: '#ef4444',
    opacity: 0.05,
    borderRadius: 200,
    filter: 'blur(100px)',
  }
});
