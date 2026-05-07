import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay, 
  withSequence, 
  withRepeat,
  FadeIn
} from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';
import { Svg, Path, Defs, LinearGradient as SvgLinearGradient, RadialGradient as SvgRadialGradient, Stop, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Premium Bezier Easing for consistent smoothness
const PREMIUM_EASING = Easing.bezier(0.25, 0.1, 0.25, 1);

const Typewriter = ({ text, delay }: { text: string; delay: number }) => {
  const [displayText, setDisplayText] = useState("");
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (delay > 0) {
      timeout = setTimeout(() => {
        let i = 0;
        const interval = setInterval(() => {
          setDisplayText(text.slice(0, i + 1));
          i++;
          if (i === text.length) clearInterval(interval);
        }, 35); // Faster typing
      }, delay * 1000);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [text, delay]);

  return <Text className="text-zinc-500 text-[10px] uppercase tracking-[0.25em] font-bold">{displayText}</Text>;
};

export function SplashScreen({ onFinish }: { onFinish?: () => void }) {
  const logoScale = useSharedValue(0.94);
  const logoOpacity = useSharedValue(0);
  const flareX = useSharedValue(-SCREEN_WIDTH);
  const flareOpacity = useSharedValue(0);
  const letterY = useSharedValue(20);
  const letterOpacity = useSharedValue(0);
  const progressX = useSharedValue(-200);
  const shimmerX = useSharedValue(-150);
  const bgGlowOpacity = useSharedValue(0);

  useEffect(() => {
    // 1. Initial Logo Entrance (Smoother, faster)
    logoScale.value = withTiming(1, { duration: 1800, easing: PREMIUM_EASING });
    logoOpacity.value = withTiming(1, { duration: 800 });

    // 2. Background Glow (Slower breathing)
    bgGlowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.12, { duration: 2500 }),
        withTiming(0.04, { duration: 2500 })
      ),
      -1,
      true
    );

    // 3. Optical Flare (Snappier)
    flareX.value = withDelay(400, withTiming(SCREEN_WIDTH, { duration: 1800, easing: Easing.inOut(Easing.cubic) }));
    flareOpacity.value = withDelay(400, withSequence(
      withTiming(0.5, { duration: 600 }),
      withTiming(0, { duration: 1000 })
    ));

    // 4. Shimmer on Logo
    shimmerX.value = withDelay(1200, withTiming(250, { duration: 1000, easing: PREMIUM_EASING }));

    // 5. Letters Animation (Tighter delay)
    letterY.value = withDelay(1400, withTiming(0, { duration: 600, easing: Easing.out(Easing.back(0.5)) }));
    letterOpacity.value = withDelay(1400, withTiming(1, { duration: 400 }));

    // 6. Progress Bar (Faster progression)
    progressX.value = withDelay(2500, withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) }));

    // 7. Finish (Snappier overall experience)
    const timer = setTimeout(() => {
      onFinish?.();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const flareStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: flareX.value }, { rotate: '12deg' }],
    opacity: flareOpacity.value,
  }));

  const letterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: letterY.value }],
    opacity: letterOpacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progressX.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }, { skewX: '-20deg' }],
  }));

  const bgGlowStyle = useAnimatedStyle(() => ({
    opacity: bgGlowOpacity.value,
  }));

  const ytLetters = "YouTube".split("");

  return (
    <View style={StyleSheet.absoluteFill} className="bg-[#030303] items-center justify-center overflow-hidden">
      
      {/* Background Ambient Layer */}
      <Animated.View 
        style={[
          { 
            position: 'absolute', 
            width: SCREEN_WIDTH * 1.5, 
            height: SCREEN_HEIGHT, 
            borderRadius: SCREEN_WIDTH,
            backgroundColor: 'rgba(255,0,0,0.12)',
            top: SCREEN_HEIGHT / 4,
          }, 
          bgGlowStyle
        ]} 
      />

      {/* Optimized Grid Floor (Single SVG for lightness) */}
      <View 
        className="absolute bottom-[-5%] w-full h-[35%] opacity-[0.05]"
        style={{ transform: [{ perspective: 1000 }, { rotateX: '70deg' }] }}
      >
        <Svg height="100%" width="100%">
          {[...Array(12)].map((_, i) => (
            <Line key={`h-${i}`} x1="0" y1={`${i * 9}%`} x2="100%" y2={`${i * 9}%`} stroke="white" strokeWidth="1" />
          ))}
          {[...Array(12)].map((_, i) => (
            <Line key={`v-${i}`} x1={`${i * 9}%`} y1="0" x2={`${i * 9}%`} y2="100%" stroke="white" strokeWidth="1" />
          ))}
        </Svg>
        <LinearGradient
           colors={['transparent', 'black']}
           style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Optical Flare */}
      <Animated.View 
        style={[
          { position: 'absolute', width: SCREEN_WIDTH * 0.6, height: 30 },
          flareStyle
        ]}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Main Logo Group */}
      <Animated.View style={[logoStyle, { flexDirection: 'row', alignItems: 'center' }]}>
        
        {/* Logo Icon */}
        <View className="relative">
          <View className="w-[120px] h-[84px]">
            <Svg viewBox="0 0 120 84" style={{ width: '100%', height: '100%' }}>
              <Defs>
                <SvgLinearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FF0000" />
                  <Stop offset="100%" stopColor="#D90000" />
                </SvgLinearGradient>
              </Defs>
              <Path
                d="M117.3 13.1C115.9 8.2 112 4.3 107.1 2.9C97.7 0.5 60 0.5 60 0.5C60 0.5 22.3 0.5 12.9 2.9C8 4.3 4.1 8.2 2.7 13.1C0.2 22.5 0.2 42 0.2 42C0.2 42 0.2 61.5 2.7 70.9C4.1 75.8 8 79.7 12.9 81.1C22.3 83.5 60 83.5 60 83.5C60 83.5 97.7 83.5 107.1 81.1C112 79.7 115.9 75.8 117.3 70.9C119.8 61.5 119.8 42 119.8 42C119.8 42 119.8 22.5 117.3 13.1Z"
                fill="url(#iconGrad)"
              />
              <Path d="M48 60L79 42L48 24V60Z" fill="white" />
            </Svg>

            {/* Shimmer Effect */}
            <Animated.View 
              style={[
                { position: 'absolute', height: '100%', width: '40%', opacity: 0.35 },
                shimmerStyle
              ]}
            >
               <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.5)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
               />
            </Animated.View>
          </View>

          {/* Floor Reflection */}
          <View className="absolute top-[102%] opacity-[0.08] w-full" style={{ transform: [{ scaleY: -1 }] }}>
            <Svg viewBox="0 0 120 84" style={{ width: '100%', height: '100%' }}>
              <Path
                d="M117.3 13.1C115.9 8.2 112 4.3 107.1 2.9C97.7 0.5 60 0.5 60 0.5C60 0.5 22.3 0.5 12.9 2.9C8 4.3 4.1 8.2 2.7 13.1C0.2 22.5 0.2 42 0.2 42C0.2 42 0.2 61.5 2.7 70.9C4.1 75.8 8 79.7 12.9 81.1C22.3 83.5 60 83.5 60 83.5C60 83.5 97.7 83.5 107.1 81.1C112 79.7 115.9 75.8 117.3 70.9C119.8 61.5 119.8 42 119.8 42C119.8 42 119.8 22.5 117.3 13.1Z"
                fill="#FF0000"
              />
            </Svg>
            <LinearGradient
              colors={['rgba(3,3,3,0.1)', '#030303']}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>

        {/* Typography */}
        <View className="ml-8">
          <View className="flex-row items-center overflow-hidden h-[70px]">
            {ytLetters.map((letter, i) => (
              <Animated.Text
                key={i}
                style={[
                  { color: 'white', fontSize: 64, fontWeight: '900', letterSpacing: -2 },
                  letterStyle
                ]}
              >
                {letter}
              </Animated.Text>
            ))}
          </View>

          {/* Credit Line */}
          <View className="flex-row items-center mt-1">
            <Typewriter text="made by mzazimhenga" delay={2.2} />
            <Animated.View 
              style={{ width: 1.2, height: 10, backgroundColor: '#FF0000', marginLeft: 4 }}
              entering={FadeIn.delay(2500).duration(800)}
            />
            {/* Subtle Red Underline */}
            <Animated.View 
              style={{ height: 1, backgroundColor: 'rgba(255,0,0,0.25)', flex: 1, marginLeft: 10 }}
              entering={FadeIn.delay(3000).duration(1000)}
            />
          </View>
        </View>
      </Animated.View>

      {/* Progress Loader */}
      <View className="absolute bottom-20 w-[180px] h-[1.2px] bg-white/10 overflow-hidden rounded-full">
        <Animated.View 
          style={[
            { height: '100%', width: '100%', backgroundColor: '#FF0000' },
            progressStyle
          ]}
        />
      </View>

      {/* Overlay Vignette */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <VignetteGradient />
      </View>

    </View>
  );
}

function VignetteGradient() {
  return (
    <Svg style={StyleSheet.absoluteFill}>
      <Defs>
        <SvgRadialGradient id="vignette" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="50%" stopColor="transparent" stopOpacity="0" />
          <Stop offset="100%" stopColor="black" stopOpacity="0.55" />
        </SvgRadialGradient>
      </Defs>
      <Path d={`M 0 0 H ${SCREEN_WIDTH} V ${SCREEN_HEIGHT} H 0 Z`} fill="url(#vignette)" />
    </Svg>
  );
}
