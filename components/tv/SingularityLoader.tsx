import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  interpolate,
  type SharedValue
} from 'react-native-reanimated';
import { Svg, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Monitor, Activity, Play } from 'lucide-react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '@/lib/store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * YOUTUBE: STREAMING ENGINE
 */

// --- DataMist (Particle Background) ---
const DataMist = () => {
  const particles = useMemo(() => [...Array(14)].map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    duration: 10000 + Math.random() * 15000,
    delay: Math.random() * 5000,
  })), []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={p.id} {...p} />
      ))}
    </View>
  );
};

const Particle = ({ size, x, y, duration, delay }: any) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-150, { duration, easing: Easing.linear }),
        withTiming(0, { duration: 0 })
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
  }, [duration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          left: x,
          top: y,
          backgroundColor: '#ef4444',
          borderRadius: size / 2,
        },
        animatedStyle
      ]}
    />
  );
};

// --- SingularityEngine ---
const SingularityEngine = () => {
  const rotation = useSharedValue(0);
  const satelliteRotation = useSharedValue(0);
  const corePulse = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 3600, easing: Easing.linear }), -1, false);
    satelliteRotation.value = withRepeat(withTiming(360, { duration: 12000, easing: Easing.linear }), -1, false);
    corePulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 1200 }), withTiming(1, { duration: 1200 })),
      -1,
      true
    );
  }, []);

  const arcStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const satelliteStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${satelliteRotation.value}deg` }],
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: corePulse.value }],
    opacity: interpolate(corePulse.value, [1, 1.1], [0.6, 1]),
  }));

  return (
    <View style={styles.engineContainer}>
      {/* Deep Space Ring */}
      <View style={styles.deepSpaceRing} />

      {/* Outer Data Ring (Dashed) */}
      <Animated.View style={[styles.dashedRing, { transform: [{ rotate: '-180deg' }] }]}>
         <View style={[StyleSheet.absoluteFill, { borderRadius: 160, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' }]} />
      </Animated.View>

      {/* Orbiting Satellite Pulse */}
      <Animated.View style={[StyleSheet.absoluteFill, satelliteStyle]}>
        <View style={styles.satellite} />
      </Animated.View>

      <Animated.View style={arcStyle}>
        <Svg width="240" height="240" viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="singularityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="transparent" />
              <Stop offset="50%" stopColor="#ef4444" stopOpacity="0.3" />
              <Stop offset="100%" stopColor="#ffffff" />
            </LinearGradient>
          </Defs>

          <Circle
            cx="50" cy="50" r="42"
            fill="transparent" stroke="#ef4444" strokeWidth="0.5"
            strokeDasharray="1, 20"
            opacity="0.2"
          />

          <Circle
            cx="50" cy="50" r="40"
            fill="transparent"
            stroke="url(#singularityGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray="80 200"
          />
        </Svg>
      </Animated.View>

      {/* Core Diagnostic Core */}
      <View style={styles.core}>
        <Animated.Text style={[styles.coreText, coreStyle]}>
          STREAMING
        </Animated.Text>
        <ExpoLinearGradient
          colors={['#ef4444', '#ef4444', 'transparent']}
          style={styles.coreLine}
        />
        <Text style={styles.coreStatus}>Status: Buffering</Text>
      </View>
    </View>
  );
};

export function SingularityLoader({ transparent = false, minimal = false }: { transparent?: boolean, minimal?: boolean }) {
  const ambientThumbnail = useAppStore((state) => state.ambientThumbnail);

  return (
    <View style={[styles.container, transparent && { backgroundColor: 'transparent' }]}>
      {/* Background Layer: Only show particles if not transparent, or show thumb if transparent */}
      {transparent ? (
        <View style={StyleSheet.absoluteFill}>
           {ambientThumbnail && (
             <Image
               source={{ uri: ambientThumbnail }}
               style={StyleSheet.absoluteFill}
               blurRadius={60}
               className="opacity-30"
             />
           )}
        </View>
      ) : (
        <DataMist />
      )}

      {/* Scanline Effect Overlay */}
      <View style={styles.scanlineOverlay} pointerEvents="none" />

      {/* Header - Hidden in minimal mode */}
      {!minimal && <LoaderHeader />}

      {/* Main Cinematic Viewport */}
      <View style={styles.viewportContainer}>
        <View style={styles.viewport}>

          {/* Corner Decals */}
          {!minimal && <ViewportDecals />}

          {/* Centered Singularity */}
          <View style={styles.centerContent}>
            <SingularityEngine />
            <BootStatus />
          </View>

          {/* Ambient Vignette */}
          <ExpoLinearGradient
            colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </View>
      </View>

      {/* Global Footer */}
      {!minimal && <LoaderFooter />}
    </View>
  );
}

function LoaderHeader() {
  return (
  <View style={styles.header}>
    <View style={styles.logoGroup}>
      <View style={styles.logoIcon}>
        <Play size={24} color="white" fill="white" />
      </View>
      <View>
        <Text style={styles.logoText}>
          STREAM<Text style={{ color: '#ef4444' }}>FLOW</Text>
        </Text>
        <Text style={styles.logoSub}>Video Engine v4.0.2</Text>
      </View>
    </View>

    <View style={styles.headerStats}>
        <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Monitor size={10} color="#475569" />
              <Text style={styles.statHeaderText}>Streaming Hub</Text>
            </View>
            <Text style={styles.statValue}>YT-CORE-NODE-01</Text>
        </View>
        <View style={styles.statItem}>
            <View style={styles.statHeader}>
              <Activity size={10} color="#475569" />
              <Text style={styles.statHeaderText}>Codec</Text>
            </View>
            <Text style={styles.statValue}>VP9 / AV1 4K</Text>
        </View>
    </View>
  </View>
  );
}

function ViewportDecals() {
  return (
  <>
    <View style={styles.decalTopLeft}>
      <Text style={styles.decalText}>
        // Streaming Metrics{'\n'}
        // Bitrate: 24.5 Mbps{'\n'}
        // Buffer: 4K Stable
      </Text>
    </View>
    <View style={styles.decalTopRight}>
      <Text style={[styles.decalText, { textAlign: 'right' }]}>
        Playback: Ready{'\n'}
        Priority: Ultra-High{'\n'}
        Network: Optimized
      </Text>
    </View>
  </>
  );
}

function BootStatus() {
  const [bootProgress, setBootProgress] = useState(0);
  const pulseProgress = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBootProgress(prev => (prev >= 100 ? 0 : prev + 4));
    }, 480);

    pulseProgress.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    return () => clearInterval(interval);
  }, [pulseProgress]);

  return (
    <View style={styles.bootContainer}>
      <View style={styles.pulseBars}>
        {PULSE_BAR_INDICES.map((index) => (
          <PulseBar key={index} index={index} progress={pulseProgress} />
        ))}
      </View>

      <View style={styles.bootStatusBox}>
         <View style={styles.bootPill}>
            <Text style={styles.bootText}>
              Optimizing Video Stream ... {bootProgress}%
            </Text>
         </View>
         <Text style={styles.bootSubText}>
           Fetching High-Resolution Recommendations
         </Text>
      </View>
    </View>
  );
}

function LoaderFooter() {
  return (
  <View style={styles.footer}>
    <View style={styles.footerLinks}>
      <Text style={styles.footerLink}>Protocol: HLS</Text>
      <Text style={styles.footerLink}>Stream: 4K HDR</Text>
    </View>
    <View style={styles.footerStatus}>
        <Activity size={12} color="#450a0a" />
        <Text style={styles.footerStatusText}>Video Pipeline Ready</Text>
    </View>
  </View>
  );
}

const PULSE_BAR_INDICES = [0, 1, 2, 3, 4, 5, 6, 7];

function PulseBar({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const phase = Math.abs(progress.value - index / (PULSE_BAR_INDICES.length - 1));
    return { opacity: interpolate(phase, [0, 0.35, 1], [1, 0.35, 0.1]) };
  });
  return <Animated.View style={[styles.pulseBar, style]} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    flexDirection: 'column',
  },
  scanlineOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    opacity: 0.04,
    backgroundColor: 'transparent',
    // In a real implementation, we'd use a small tiled image or SVG pattern
    // for scanlines. For now, we'll keep it as a placeholder.
  },
  header: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logoIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#dc2626',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    textTransform: 'uppercase',
    color: 'white',
    letterSpacing: -1,
  },
  logoSub: {
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 40,
    opacity: 0.6,
  },
  statItem: {
    alignItems: 'flex-end',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statHeaderText: {
    fontSize: 9,
    color: '#475569',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: 'white',
  },
  viewportContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    zIndex: 10,
  },
  viewport: {
    width: '100%',
    maxWidth: 1000,
    aspectRatio: 21/9,
    borderRadius: 64,
    backgroundColor: '#020202',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 1,
    shadowRadius: 50,
  },
  decalTopLeft: {
    position: 'absolute',
    top: 40,
    left: 40,
  },
  decalTopRight: {
    position: 'absolute',
    top: 40,
    right: 40,
  },
  decalText: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#1e293b',
    textTransform: 'uppercase',
    lineHeight: 12,
  },
  centerContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  engineContainer: {
    width: 320,
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deepSpaceRing: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 160,
  },
  dashedRing: {
    ...StyleSheet.absoluteFillObject,
    padding: 32,
  },
  satellite: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    backgroundColor: '#ef4444',
    borderRadius: 3,
    shadowColor: '#ef4444',
    shadowRadius: 8,
    shadowOpacity: 1,
  },
  core: {
    position: 'absolute',
    alignItems: 'center',
  },
  coreText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 4,
    color: 'white',
  },
  coreLine: {
    height: 24,
    width: 1,
    marginVertical: 8,
  },
  coreStatus: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: 'rgba(239, 68, 68, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  bootContainer: {
    marginTop: 64,
    alignItems: 'center',
    gap: 24,
  },
  pulseBars: {
    flexDirection: 'row',
    gap: 8,
  },
  pulseBar: {
    width: 4,
    height: 12,
    backgroundColor: '#dc2626',
    borderRadius: 2,
  },
  bootStatusBox: {
    alignItems: 'center',
    gap: 4,
  },
  bootPill: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
  },
  bootText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 5,
  },
  bootSubText: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: 'rgba(239, 68, 68, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },
  footer: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 48,
  },
  footerLink: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#334155',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  footerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerStatusText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#334155',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
});
