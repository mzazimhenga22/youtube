import React, { useEffect, useMemo, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withRepeat, 
  withSequence, 
  withDelay,
  Easing,
  interpolate
} from 'react-native-reanimated';
import { Svg, Circle, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { Zap, Activity, Cpu } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * SHORTS PULSE: VERTICAL STREAMING ENGINE
 * Designed to fit perfectly within the 9:16 Shorts Stage
 */

const VerticalDataStream = memo(() => {
  const lines = useMemo(() => [...Array(12)].map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    duration: 1500 + Math.random() * 2000,
    delay: Math.random() * 1000,
  })), []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {lines.map((l) => (
        <DataLine key={l.id} {...l} />
      ))}
    </View>
  );
});

const DataLine = ({ left, duration, delay }: any) => {
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(SCREEN_HEIGHT, { duration, easing: Easing.linear })),
        withTiming(-200, { duration: 0 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: duration * 0.5 }),
        withTiming(0, { duration: duration * 0.5 })
      ),
      -1,
      true
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        {
          position: 'absolute',
          width: 1,
          height: 100,
          left,
          backgroundColor: '#ef4444',
        },
        animStyle
      ]} 
    >
        <ExpoLinearGradient colors={['transparent', '#ef4444', 'transparent']} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
};

export const ShortsPulseLoader = memo(({ thumbnail }: { thumbnail?: string }) => {
  const scanPos = useSharedValue(0);
  const corePulse = useSharedValue(1);

  useEffect(() => {
    scanPos.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    corePulse.value = withRepeat(
      withSequence(withTiming(1.2, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1,
      true
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    top: `${scanPos.value * 100}%`,
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: corePulse.value }],
    opacity: interpolate(corePulse.value, [1, 1.2], [0.4, 0.8]),
  }));

  return (
    <View style={styles.container}>
      {/* Ambient Thumbnail Background */}
      {thumbnail && (
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: thumbnail }} style={StyleSheet.absoluteFill} blurRadius={40} className="opacity-20" />
        </View>
      )}

      <VerticalDataStream />

      {/* Scanning Line */}
      <Animated.View style={[styles.scanLine, scanStyle]}>
        <ExpoLinearGradient 
          colors={['transparent', 'rgba(239, 68, 68, 0.5)', 'transparent']} 
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill} 
        />
      </Animated.View>

      {/* Center Engine */}
      <View style={styles.center}>
        <Animated.View style={[styles.glowCore, coreStyle]} />
        <View style={styles.iconContainer}>
          <Zap size={32} color="white" fill="#ef4444" />
        </View>
        <Text style={styles.loadingText}>BUFFERING STREAM</Text>
        <View style={styles.metrics}>
            <View style={styles.metric}>
                <Activity size={10} color="#ef4444" />
                <Text style={styles.metricText}>4K VERTICAL</Text>
            </View>
            <View style={styles.metric}>
                <Cpu size={10} color="#ef4444" />
                <Text style={styles.metricText}>ENGINE: ACTIVE</Text>
            </View>
        </View>
      </View>

      {/* Corner Brackets */}
      <View style={styles.bracketTL} />
      <View style={styles.bracketTR} />
      <View style={styles.bracketBL} />
      <View style={styles.bracketBR} />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 100,
    zIndex: 5,
  },
  center: {
    alignItems: 'center',
    zIndex: 10,
  },
  glowCore: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ef4444',
    filter: 'blur(40px)', // Note: standard RN doesn't support filter, but we use it for concept
    opacity: 0.2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 16,
  },
  metrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricText: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bracketTL: {
    position: 'absolute',
    top: 30,
    left: 30,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bracketTR: {
    position: 'absolute',
    top: 30,
    right: 30,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bracketBL: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bracketBR: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
});
