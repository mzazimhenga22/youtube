import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { 
  Monitor, 
  Volume2, 
  Globe, 
  HelpCircle, 
  User, 
  CreditCard, 
  Shield, 
  Bell,
  ChevronRight,
  Tv,
  Smartphone,
  Eye,
  Settings as SettingsIcon,
  LogOut
} from 'lucide-react-native';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useAppStore } from '@/lib/store';
import { router, useLocalSearchParams } from 'expo-router';

const categories = [
  { id: 'account', label: 'Account', icon: User, description: 'Manage your profiles, members, and connected accounts.' },
  { id: 'billing', label: 'Billing', icon: CreditCard, description: 'View your subscriptions, payment methods, and transaction history.' },
  { id: 'privacy', label: 'Privacy', icon: Shield, description: 'Control your watch history, recommendations, and location settings.' },
  { id: 'playback', label: 'Playback', icon: Volume2, description: 'Customize autoplay, captions, and stats for nerds.' },
  { id: 'quality', label: 'Quality', icon: Monitor, description: 'Select your preferred video resolution and dynamic range.' },
  { id: 'about', label: 'About', icon: HelpCircle, description: 'System version, terms of service, and diagnostic information.' },
  { id: 'logout', label: 'Sign Out', icon: LogOut, description: 'Sign out of your account on this device.', isAction: true },
];

const getSettingsContent = (profile: any): Record<string, any[]> => ({
  account: [
    { label: profile?.name || 'Guest', value: profile?.handle || 'Not signed in', isProfile: true, avatar: profile?.avatar },
    { label: 'Switch profile', value: 'Change who is watching', action: 'switchProfile' },
    { label: 'Add account', value: 'Sign in to another YouTube account', action: 'addAccount' },
  ],
  playback: [
    { label: 'Autoplay', value: 'On (recommended)' },
    { label: 'Captions', value: 'English (US)' },
    { label: 'Stats for Nerds', value: 'Off' },
    { label: 'Audio Only', value: 'Disabled' },
  ],
  quality: [
    { label: 'Resolution', value: 'Auto (up to 4K)' },
    { label: 'Dynamic Range', value: 'HDR10+' },
    { label: 'Color Depth', value: '10-bit' },
  ],
});

export default function SettingsScreen() {
  const params = useLocalSearchParams<{ section?: string }>();
  const [activeCategory, setActiveCategory] = useState(params.section || 'account');
  const { currentProfile, logout } = useAppStore();

  useEffect(() => {
    if (params.section) setActiveCategory(params.section);
  }, [params.section]);

  const openProfilePicker = (openAuth = false) => {
    router.replace({
      pathname: '/',
      params: {
        skipSplash: '1',
        ...(openAuth ? { auth: '1' } : {}),
      },
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Firebase SignOut Error', e);
    }
    logout();
    openProfilePicker();
  };

  const handleSettingItemPress = (item: any) => {
    if (item.action === 'switchProfile') {
      openProfilePicker();
      return;
    }
    if (item.action === 'addAccount') {
      openProfilePicker(true);
    }
  };

  const settingsContent = getSettingsContent(currentProfile);

  return (
    <View className="flex-1 bg-[#0f0f0f] flex-row">
      
      {/* Left Column: Categories Navigation */}
      <View className="w-[400px] lg:w-[480px] pt-20 px-10">
        <View className="flex-row items-center mb-16 px-10">
           <SettingsIcon size={24} color="#71717A" />
           <Text className="text-zinc-500 text-xl font-bold uppercase tracking-widest ml-4">Settings</Text>
        </View>
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id && !cat.isAction;
            const isLogout = cat.id === 'logout';
            return (
              <FocusablePressable
                key={cat.id}
                onFocus={() => { if (!cat.isAction) setActiveCategory(cat.id); }}
                onPress={() => { if (isLogout) handleLogout(); }}
                className={`flex-row items-center p-6 rounded-3xl mb-2 border-2 border-transparent ${isLogout ? 'mt-12' : ''}`}
                focusedClassName={isLogout ? 'bg-red-500/20 border-red-500/40' : 'bg-white/10 border-white/20'}
                activeScale={isLogout ? 1.05 : 1.02}
              >
                {({ isFocused }) => (
                  <View className="flex-row items-center flex-1">
                    <Icon size={32} color={isActive || isFocused ? (isLogout ? '#EF4444' : 'white') : '#71717A'} strokeWidth={isActive ? 3 : 2} />
                    <Text className={`ml-6 text-2xl font-bold ${isActive || isFocused ? (isLogout ? 'text-red-500' : 'text-white') : 'text-zinc-500'}`}>
                      {cat.label}
                    </Text>
                    {isActive && (
                       <View className="ml-auto w-2 h-2 bg-white rounded-full" />
                    )}
                  </View>
                )}
              </FocusablePressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Right Column: Detailed Options & Preview */}
      <View className="flex-1 pt-20 pr-20">
        
        {/* Header Info for the active category */}
        <View className="mb-16">
          <Text className="text-white text-5xl font-black mb-4">
            {categories.find(c => c.id === activeCategory)?.label}
          </Text>
          <Text className="text-zinc-500 text-2xl font-medium max-w-2xl">
            {categories.find(c => c.id === activeCategory)?.description}
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          <View className="space-y-4">
            {(settingsContent[activeCategory] || []).map((item: any, index: number) => (
              <FocusablePressable
                key={index}
                onPress={() => handleSettingItemPress(item)}
                className="bg-white/5 p-8 rounded-[32px] flex-row items-center justify-between border-2 border-transparent"
                focusedClassName="bg-white"
                activeScale={1.03}
              >
                {({ isFocused }) => (
                  <>
                    <View className="flex-row items-center">
                      {item.isProfile && (
                        <View className="w-12 h-12 rounded-full bg-zinc-800 mr-6 overflow-hidden border-2 border-white/20">
                          <Image 
                            source={typeof (item.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y') === 'string' 
                              ? { uri: item.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' } 
                              : item.avatar
                            } 
                            className="w-full h-full" 
                          />
                        </View>
                      )}
                      <View>
                        <Text className={`text-2xl font-bold ${isFocused ? 'text-black' : 'text-white'}`}>
                          {item.label}
                        </Text>
                        <Text className={`text-lg font-medium mt-1 ${isFocused ? 'text-black/60' : 'text-zinc-500'}`}>
                          {item.value}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={28} color={isFocused ? "black" : "#3F3F46"} />
                  </>
                )}
              </FocusablePressable>
            ))}
            {(!settingsContent[activeCategory] || settingsContent[activeCategory].length === 0) && (
              <View className="bg-white/5 p-12 rounded-[40px] items-center border-2 border-dashed border-white/10">
                 <SettingsIcon size={64} color="#272727" strokeWidth={1} />
                 <Text className="text-zinc-600 text-2xl font-black mt-6">Advanced features in development</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Decorative Ambient Shapes */}
      <View className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-white/5 rounded-full" style={{ filter: 'blur(100px)' }} />
    </View>
  );
}
