import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withRepeat, 
  withSequence, 
  withSpring,
  withDelay,
  Easing,
  interpolate,
  FadeIn
} from 'react-native-reanimated';
import { Star, Heart, Cloud, Zap, Play } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MAGIC KIDS LOADER: A PLAYFUL, BOUNCY LOADING EXPERIENCE
 * Designed to fit the colorful aesthetic of Kids Mode
 */

export const MagicKidsLoader = () => {
  const jump = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    jump.value = withRepeat(
      withSequence(
        withSpring(-50, { damping: 10, stiffness: 100 }),
        withSpring(0, { damping: 10, stiffness: 100 })
      ),
      -1,
      false
    );

    rotate.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const jumpStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: jump.value }],
  }));

  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Background Playful Shapes */}
      <View style={[styles.bgShape, { top: '10%', left: '15%', backgroundColor: '#FF4B4B22' }]} />
      <View style={[styles.bgShape, { bottom: '15%', right: '10%', backgroundColor: '#4B7BFF22', width: 300, height: 300 }]} />
      
      <Animated.View entering={FadeIn.duration(800)} style={styles.center}>
        {/* Rotating Rainbow Ring */}
        <Animated.View style={[styles.ringContainer, rotateStyle]}>
          <View style={[styles.dot, { top: 0, backgroundColor: '#FF4B4B' }]} />
          <View style={[styles.dot, { bottom: 0, backgroundColor: '#4B7BFF' }]} />
          <View style={[styles.dot, { left: 0, backgroundColor: '#4BFF7B' }]} />
          <View style={[styles.dot, { right: 0, backgroundColor: '#FFB84B' }]} />
        </Animated.View>

        {/* Bouncing Icon Stage */}
        <Animated.View style={[styles.stage, jumpStyle]}>
           <Animated.View style={[styles.iconBox, pulseStyle]}>
              <Play size={64} color="white" fill="white" />
           </Animated.View>
           <View style={styles.shadow} />
        </Animated.View>

        <Text style={styles.loadingText}>FINDING MAGIC...</Text>
        
        <View style={styles.iconRow}>
          <FloatingIcon Icon={Star} color="#FFD600" delay={0} />
          <FloatingIcon Icon={Heart} color="#FF4081" delay={200} />
          <FloatingIcon Icon={Cloud} color="#00E5FF" delay={400} />
          <FloatingIcon Icon={Zap} color="#FFD600" delay={600} />
        </View>
      </Animated.View>
    </View>
  );
};

const FloatingIcon = ({ Icon, color, delay }: any) => {
  const y = useSharedValue(0);
  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withDelay(delay, withTiming(-20, { duration: 1500, easing: Easing.inOut(Easing.ease) })),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={[{ marginHorizontal: 12 }, style]}>
      <Icon size={32} color={color} fill={color} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFBE6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bgShape: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  center: {
    alignItems: 'center',
  },
  ringContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  dot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  stage: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FF4B4B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF4B4B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 10,
  },
  shadow: {
    width: 80,
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 10,
    marginTop: 20,
  },
  loadingText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF4B4B',
    letterSpacing: 4,
    marginBottom: 40,
  },
  iconRow: {
    flexDirection: 'row',
  }
});
