import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Dimensions, 
  TextInput, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions
} from 'react-native';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { SplashScreen as TvSplashScreen } from '@/components/tv/SplashScreen';
import { useAppStore, Profile } from '@/lib/store';
import { router, useLocalSearchParams } from 'expo-router';
import { getProfileHomeRoute, PROFILES } from '@/lib/profiles';
import { Plus, ShieldCheck, Mail, Lock, X, ChevronRight, AlertCircle } from 'lucide-react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { 
  FadeIn, 
  FadeInUp, 
  ZoomIn, 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  SlideInRight,
  SlideOutRight
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const AmbientBackground = () => {
  const pulse = useSharedValue(0.4);
  const rotation = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
    transform: [{ rotate: `${rotation.value}deg` }, { scale: 1.5 }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.bgGlow, animatedStyle]} />
      <View style={styles.vignette} />
    </View>
  );
};

export default function ProfilePickerScreen() {
  const { setProfile } = useAppStore();
  const params = useLocalSearchParams<{ skipSplash?: string; auth?: string }>();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [showStartupSplash, setShowStartupSplash] = useState(params.skipSplash !== '1');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const isPhone = windowWidth < 768;
  const profileCardSize = isPhone ? Math.min(132, windowWidth * 0.32) : 224;
  const profileCardRadius = isPhone ? 34 : 64;
  const profileGap = isPhone ? 22 : 64;
  
  // Auth Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // TV Focus States for Inputs
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  useEffect(() => {
    if (params.auth === '1') setIsDrawerOpen(true);
  }, [params.auth]);

  const handleSelectProfile = (profile: Profile) => {
    setProfile(profile);
    router.replace(getProfileHomeRoute(profile) as any);
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Map Firebase user to App Profile
      const newProfile: Profile = {
        id: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'User',
        handle: user.email || '',
        mode: 'regular',
        avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400'
      };
      
      setProfile(newProfile);
      setIsDrawerOpen(false);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Sign In Error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (showStartupSplash) {
    return <TvSplashScreen onFinish={() => setShowStartupSplash(false)} />;
  }

  return (
    <View style={styles.container}>
      <AmbientBackground />
      
      {/* Kids Mode Mascot - Pops up when focused */}
      {focusedId === 'p2' && !isPhone && (
        <Animated.View 
          entering={FadeIn.duration(800)}
          style={{
            position: 'absolute',
            right: -100,
            bottom: -50,
            width: 600,
            height: 600,
            opacity: 0.2,
            zIndex: -1,
            transform: [{ rotate: '-15deg' }]
          }}
        >
          <Image 
            source={require('../assets/kids-mode.png')} 
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      <Animated.View 
        entering={FadeInUp.duration(1200).springify().damping(20)} 
        className="items-center"
        style={{ marginBottom: isPhone ? 36 : 128, paddingHorizontal: 20 }}
      >
        <Text
          className="text-white font-black tracking-tighter mb-4 shadow-2xl text-center"
          style={{ fontSize: isPhone ? 42 : 96, lineHeight: isPhone ? 48 : 104 }}
        >
          Who's Watching?
        </Text>
        {isPhone && (
          <Text
            className="text-white/40 font-bold text-center"
            style={{ fontSize: 16, marginBottom: 18 }}
          >
            Tap a profile to continue
          </Text>
        )}
        <View className="h-1 bg-white/20 rounded-full" style={{ width: isPhone ? 72 : 128 }} />
      </Animated.View>

      <View
        className="flex-row items-center justify-center"
        style={{
          gap: profileGap,
          flexWrap: isPhone ? 'wrap' : 'nowrap',
          paddingHorizontal: isPhone ? 16 : 0,
          maxWidth: isPhone ? windowWidth : undefined,
        }}
      >
        {PROFILES.map((profile, index) => (
          <Animated.View 
            key={profile.id} 
            entering={ZoomIn.delay(400 + index * 200).duration(800).springify()}
          >
            <FocusablePressable
              onFocus={() => setFocusedId(profile.id)}
              onPressIn={() => setFocusedId(profile.id)}
              onPress={() => handleSelectProfile(profile)}
              className="items-center"
              disabled={isDrawerOpen}
              hasTVPreferredFocus={index === 0 && !isDrawerOpen}
              activeScale={isPhone ? 0.96 : 1.05}
            >
              {({ isFocused, pressed }) => {
                const isActive = isFocused || pressed || (isPhone && focusedId === profile.id);
                const isDimmed = !!focusedId && focusedId !== profile.id && !isActive;

                return (
                <View className="items-center">
                  <View
                    className="overflow-hidden border-8 transition-all duration-500"
                    style={{
                      width: profileCardSize,
                      height: profileCardSize,
                      borderRadius: profileCardRadius,
                      borderColor: isActive ? 'white' : 'transparent',
                      opacity: isActive ? 1 : (isDimmed ? 0.45 : 0.85),
                      transform: [{ scale: isActive && !isPhone ? 1.14 : 1 }],
                      shadowColor: '#fff',
                      shadowOpacity: isActive ? 0.35 : 0,
                      shadowRadius: isActive ? 28 : 0,
                    }}
                  >
                    <Image 
                      source={typeof profile.avatar === 'string' ? { uri: profile.avatar } : profile.avatar} 
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                    />

                    {/* Fun Pop-out Mascot for Kids */}
                    {profile.mode === 'kids' && isActive && !isPhone && (
                      <Animated.View 
                        entering={ZoomIn.duration(500).springify().damping(12)}
                        style={{
                          position: 'absolute',
                          top: -70,
                          left: -50,
                          width: 140,
                          height: 140,
                          zIndex: 50,
                          transform: [{ rotate: '-10deg' }]
                        }}
                      >
                         <Image 
                            source={require('../assets/kids-mode.png')} 
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="contain"
                         />
                      </Animated.View>
                    )}

                    {profile.mode === 'kids' && (
                       <View className="absolute top-4 right-4 bg-yellow-400 p-2 rounded-full shadow-lg">
                          <ShieldCheck size={24} color="black" strokeWidth={3} />
                       </View>
                    )}
                  </View>
                  
                  <View className="items-center" style={{ marginTop: isPhone ? 18 : 48 }}>
                    <Text
                      className={`font-black transition-all duration-300 ${isActive ? 'text-white' : 'text-zinc-500'}`}
                      style={{ fontSize: isPhone ? 18 : 36 }}
                    >
                      {profile.name}
                    </Text>
                    {isActive && !isPhone && (
                       <Animated.View 
                         entering={FadeIn.duration(400)} 
                         className="mt-3 bg-white/10 px-6 py-2 rounded-full border border-white/10"
                       >
                          <Text className="text-white/60 text-xl font-bold tracking-widest uppercase">
                            {profile.handle}
                          </Text>
                       </Animated.View>
                    )}
                  </View>
                </View>
              )}}
            </FocusablePressable>
          </Animated.View>
        ))}

        {/* Add Profile Button */}
        <Animated.View entering={ZoomIn.delay(800).duration(800).springify()}>
          <FocusablePressable 
            onFocus={() => setFocusedId('add')}
            onPressIn={() => setFocusedId('add')}
            onPress={() => setIsDrawerOpen(true)}
            className="items-center"
            disabled={isDrawerOpen}
            activeScale={isPhone ? 0.96 : 1.05}
          >
            {({ isFocused, pressed }) => {
              const isActive = isFocused || pressed || (isPhone && focusedId === 'add');
              return (
              <View className="items-center">
                <View
                  className="items-center justify-center border-4 border-dashed transition-all duration-500"
                  style={{
                    width: profileCardSize,
                    height: profileCardSize,
                    borderRadius: profileCardRadius,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    borderColor: isActive ? 'white' : '#27272a',
                    opacity: isActive ? 1 : (focusedId ? 0.35 : 0.7),
                    transform: [{ scale: isActive && !isPhone ? 1.14 : 1 }],
                  }}
                >
                  <Plus size={isPhone ? 46 : 80} color={isActive ? "white" : "#3F3F46"} strokeWidth={3} />
                </View>
                <Text
                  className={`font-black ${isActive ? 'text-white' : 'text-zinc-600'}`}
                  style={{ marginTop: isPhone ? 18 : 48, fontSize: isPhone ? 18 : 36 }}
                >
                  Add Profile
                </Text>
              </View>
            )}}
          </FocusablePressable>
        </Animated.View>
      </View>

      {/* Auth Drawer */}
      {isDrawerOpen && (
        <View style={StyleSheet.absoluteFill} className="z-[100] flex-row justify-end">
          <Animated.View 
            entering={FadeIn.duration(300)}
            className="flex-1 bg-black/60"
          >
            <FocusablePressable 
              onPress={() => setIsDrawerOpen(false)}
              style={StyleSheet.absoluteFill}
              activeScale={1}
              focusable={false}
            >
              <View style={StyleSheet.absoluteFill} />
            </FocusablePressable>
          </Animated.View>

          <Animated.View 
            entering={SlideInRight.duration(500).springify().damping(25)}
            exiting={SlideOutRight.duration(300)}
            className="h-full bg-[#0f0f0f] border-l border-white/10 shadow-2xl"
            style={{ width: isPhone ? windowWidth : 600 }}
          >
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
            
            <View className="flex-1" style={{ padding: isPhone ? 24 : 64 }}>
              <View className="flex-row items-center justify-between mb-16">
                <Text className="text-white font-black tracking-tighter" style={{ fontSize: isPhone ? 38 : 60 }}>Sign In</Text>
                <FocusablePressable 
                  onPress={() => setIsDrawerOpen(false)}
                  className="rounded-full bg-white/5 items-center justify-center border border-white/10"
                  focusedClassName="bg-white"
                  style={{ width: isPhone ? 48 : 64, height: isPhone ? 48 : 64 }}
                >
                  {({ isFocused }) => (
                    <X size={32} color={isFocused ? "black" : "white"} />
                  )}
                </FocusablePressable>
              </View>

              <Text className="text-zinc-500 text-2xl font-medium mb-12">
                Sign in with your YouTube account to access your personalized library, history, and more.
              </Text>

              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
              >
                <View className="mb-8">
                  <Text className="text-zinc-400 text-lg font-black uppercase tracking-widest mb-4 ml-2">Email Address</Text>
                  <FocusablePressable
                    nativeID="auth-email"
                    onPress={() => {/* Soft keyboard will trigger on focus/press */}}
                    className={`flex-row items-center bg-white/5 rounded-3xl border-2 px-6 py-4 transition-colors ${isEmailFocused ? 'border-white bg-white/10' : 'border-transparent'}`}
                    focusedClassName="border-white bg-white/10"
                    nextFocusDown="auth-password"
                  >
                    <Mail size={24} color={isEmailFocused ? "#FFFFFF" : "#71717A"} />
                    <TextInput 
                      className="flex-1 ml-4 text-white font-bold"
                      style={{ fontSize: isPhone ? 18 : 24 }}
                      placeholder="email@example.com"
                      placeholderTextColor="#3F3F46"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setIsEmailFocused(true)}
                      onBlur={() => setIsEmailFocused(false)}
                      autoFocus={!isPhone}
                    />
                  </FocusablePressable>
                </View>

                <View className="mb-12">
                  <Text className="text-zinc-400 text-lg font-black uppercase tracking-widest mb-4 ml-2">Password</Text>
                  <FocusablePressable
                    nativeID="auth-password"
                    onPress={() => {}}
                    className={`flex-row items-center bg-white/5 rounded-3xl border-2 px-6 py-4 transition-colors ${isPasswordFocused ? 'border-white bg-white/10' : 'border-transparent'}`}
                    focusedClassName="border-white bg-white/10"
                    nextFocusUp="auth-email"
                    nextFocusDown="auth-continue"
                  >
                    <Lock size={24} color={isPasswordFocused ? "#FFFFFF" : "#71717A"} />
                    <TextInput 
                      className="flex-1 ml-4 text-white font-bold"
                      style={{ fontSize: isPhone ? 18 : 24 }}
                      placeholder="••••••••"
                      placeholderTextColor="#3F3F46"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      onFocus={() => setIsPasswordFocused(true)}
                      onBlur={() => setIsPasswordFocused(false)}
                    />
                  </FocusablePressable>
                </View>

                {error && (
                  <View className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex-row items-center mb-12">
                    <AlertCircle size={28} color="#EF4444" />
                    <Text className="text-red-500 text-xl font-bold ml-4 flex-1">{error}</Text>
                  </View>
                )}

                <FocusablePressable 
                  nativeID="auth-continue"
                  onPress={handleSignIn}
                  className="bg-white h-24 rounded-full items-center justify-center flex-row shadow-2xl"
                  focusedClassName="scale-105 bg-white/90"
                  activeScale={0.98}
                  disabled={loading}
                  nextFocusUp="auth-password"
                >
                  {loading ? (
                    <ActivityIndicator color="black" size="large" />
                  ) : (
                    <>
                      <Text className="text-black text-3xl font-black mr-4 uppercase tracking-tighter">Continue</Text>
                      <ChevronRight size={32} color="black" strokeWidth={3} />
                    </>
                  )}
                </FocusablePressable>
              </KeyboardAvoidingView>
              
              <View className="mt-auto items-center">
                 <View className="flex-row items-center bg-white/5 px-8 py-4 rounded-full border border-white/5">
                    <FontAwesome5 name="youtube" size={20} color="#FF0000" solid />
                    <Text className="text-white/20 text-xl font-black ml-3 uppercase tracking-[8px]">YouTube</Text>
                 </View>
              </View>
            </View>
          </Animated.View>
        </View>
      )}

      {/* Premium Navigation Hint */}
      {!isDrawerOpen && (
        <View className="absolute items-center" style={{ bottom: isPhone ? 28 : 80 }}>
           <View className="flex-row items-center bg-white/5 rounded-full border border-white/10" style={{ paddingHorizontal: isPhone ? 20 : 40, paddingVertical: isPhone ? 12 : 20 }}>
              <FontAwesome5 name="youtube" size={isPhone ? 20 : 28} color="#FF0000" solid />
              <Text className="text-white/40 font-black ml-5 uppercase" style={{ fontSize: isPhone ? 18 : 30, letterSpacing: isPhone ? 6 : 12 }}>
                YouTube
              </Text>
           </View>
        </View>
      )}
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
    left: '10%',
    width: SCREEN_WIDTH * 0.8,
    height: SCREEN_HEIGHT * 0.6,
    backgroundColor: '#ef4444',
    borderRadius: SCREEN_WIDTH,
    opacity: 0.2,
  },
  vignette: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
  }
});
