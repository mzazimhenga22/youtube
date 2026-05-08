import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { FocusablePressable } from './FocusablePressable';
import { Play, Plus, ChevronLeft, ChevronRight, Info } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Video } from '@/lib/youtube';
import { playVideo } from '@/lib/navigation';
import { useAppStore } from '@/lib/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const getHDThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
const ROTATION_INTERVAL = 8000; // 8 seconds

interface HeroBannerProps {
  title: string;
  description: string;
  thumbnail: string;
  videos?: Video[]; // Array of videos to rotate through
}

export const HeroBanner = memo(function HeroBanner({ title, description, thumbnail, videos }: HeroBannerProps) {
  const heroVideos = videos && videos.length > 0 ? videos.slice(0, 5) : [{ id: '0', title, channel: description.split(' • ')[0] || '', views: '', thumbnail, duration: '' }];
  const [activeIndex, setActiveIndex] = useState(0);
  const { setAmbientState } = useAppStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if any button in the banner is focused
  const [isFocused, setIsFocused] = useState(false);
  const contentOpacity = useSharedValue(0.7);
  const contentScale = useSharedValue(0.98);

  const currentVideo = heroVideos[activeIndex] || heroVideos[0];

  // Prefetch hero images to avoid decode stalls on rotation/focus.
  useEffect(() => {
    const urls = heroVideos
      .map(v => v.thumbnail || getHDThumbnail(v.id))
      .filter(Boolean)
      .slice(0, 5);
    if (urls.length > 0) {
      void Image.prefetch(urls).catch(() => undefined);
    }
  }, [heroVideos]);

  // Auto-rotate
  useEffect(() => {
    if (heroVideos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % heroVideos.length);
    }, ROTATION_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [heroVideos.length]);

  // Sync ambient state when banner is focused or video changes
  useEffect(() => {
    if (isFocused && currentVideo) {
      setAmbientState(currentVideo.thumbnail, '#FFFFFF');
    }
  }, [isFocused, currentVideo, setAmbientState]);

  useEffect(() => {
    contentOpacity.value = withTiming(isFocused ? 1 : 0.75, { duration: 300 });
    contentScale.value = withTiming(isFocused ? 1 : 0.98, { duration: 300 });
  }, [isFocused]);

  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ scale: contentScale.value }]
  }));

  const goTo = useCallback((dir: -1 | 1) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveIndex(prev => (prev + dir + heroVideos.length) % heroVideos.length);
    // Restart timer
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % heroVideos.length);
    }, ROTATION_INTERVAL);
  }, [heroVideos.length]);

  const handlePlay = useCallback(() => {
    playVideo(currentVideo);
  }, [currentVideo]);

  // Split title into max 2 lines for cinematic display
  const titleWords = currentVideo.title.split(' ');
  const midPoint = Math.ceil(titleWords.length / 2);
  const line1 = titleWords.slice(0, midPoint).join(' ');
  const line2 = titleWords.slice(midPoint).join(' ');

  return (
    <View style={{ 
      height: 720, 
      width: '100%', 
      borderRadius: 40, 
      overflow: 'hidden', 
      marginBottom: 32, 
      marginTop: 10,
      backgroundColor: '#000',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.6,
      shadowRadius: 30,
      elevation: 15,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)'
    }}>
      {/* Background Image with crossfade - let expo-image handle the transition */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: currentVideo.thumbnail || getHDThumbnail(currentVideo.id) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={1000}
        />
      </View>

      {/* ── Overlays ── */}
      
      {/* 1. Left side gradient for text legibility */}
      <LinearGradient
        colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.4)', 'transparent']}
        locations={[0, 0.45, 0.8]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Bottom fade — blends into content below */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(10,10,10,0.3)',
          'rgba(10,10,10,0.9)',
          '#0A0A0A',
        ]}
        locations={[0, 0.5, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 80, paddingRight: 80 }}>
        <Animated.View 
          style={animatedContentStyle}
        >
          <Animated.View 
            key={currentVideo.id} 
            entering={FadeInDown.duration(800)}
          >
            {/* Category Tag */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 }}>
              <View style={{ backgroundColor: '#FF0000', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 }}>
                <Text style={{ color: 'white', fontSize: 14, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }}>
                  {activeIndex === 0 ? 'FEATURED' : `#${activeIndex + 1} TRENDING`}
                </Text>
              </View>
              {currentVideo.views ? (
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, fontWeight: '700' }}>
                  {currentVideo.views} views
                </Text>
              ) : null}
            </View>

            {/* Title */}
            <View style={{ marginBottom: 20, maxWidth: SCREEN_WIDTH * 0.6 }}>
              <Text
                style={{ color: 'white', fontSize: SCREEN_WIDTH < 768 ? 42 : 72, fontWeight: '900', lineHeight: SCREEN_WIDTH < 768 ? 48 : 78, letterSpacing: -3 }}
                numberOfLines={1}
              >
                {line1}
              </Text>
              {line2 ? (
                <Text
                  style={{ color: 'rgba(255,255,255,0.85)', fontSize: SCREEN_WIDTH < 768 ? 38 : 62, fontWeight: '900', lineHeight: SCREEN_WIDTH < 768 ? 44 : 68, letterSpacing: -3 }}
                  numberOfLines={1}
                >
                  {line2}
                </Text>
              ) : null}
            </View>

            {/* Channel */}
            <Text
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24, fontWeight: '700', marginBottom: 40, maxWidth: SCREEN_WIDTH * 0.5 }}
              numberOfLines={1}
            >
              {currentVideo.channel}{currentVideo.duration ? ` • ${currentVideo.duration}` : ''}
            </Text>
          </Animated.View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20 }}>
            <FocusablePressable
              onPress={handlePlay}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              nativeID="hero-play"
              className="bg-white"
              style={{ paddingHorizontal: 40, paddingVertical: 22, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-red-600 scale-105"
              activeScale={1.08}
            >
              {({ isFocused }) => (
                <>
                  <Play size={28} color={isFocused ? 'white' : 'black'} fill={isFocused ? 'white' : 'black'} strokeWidth={3} />
                  <Text style={{ color: isFocused ? 'white' : 'black', fontSize: 24, fontWeight: '900', marginLeft: 16, letterSpacing: -0.5 }}>Play Now</Text>
                </>
              )}
            </FocusablePressable>

            <FocusablePressable
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              nativeID="hero-info"
              className="bg-white/10"
              style={{ paddingHorizontal: 32, paddingVertical: 22, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-white/25 scale-105 border-white"
              activeScale={1.08}
            >
              {({ isFocused }) => (
                <>
                  <Info size={26} color={isFocused ? 'white' : 'rgba(255,255,255,0.9)'} />
                  <Text style={{ color: isFocused ? 'white' : 'rgba(255,255,255,0.9)', fontSize: 22, fontWeight: '800', marginLeft: 12 }}>More Info</Text>
                </>
              )}
            </FocusablePressable>

            <FocusablePressable
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              nativeID="hero-add"
              className="bg-white/10"
              style={{ width: 64, height: 64, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-white/25 scale-110 border-white"
            >
              <Plus size={32} color="white" strokeWidth={3} />
            </FocusablePressable>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Navigation — Dots + Arrows */}
      {heroVideos.length > 1 && (
        <View style={{ position: 'absolute', bottom: 60, right: 80, flexDirection: 'row', alignItems: 'center', gap: 32 }}>
          {/* Dot indicators */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{
                  width: (activeIndex % 5) === i ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: (activeIndex % 5) === i ? '#FF0000' : 'rgba(255,255,255,0.3)',
                }}
              />
            ))}
          </View>

          {/* Arrow Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <FocusablePressable
              onPress={() => goTo(-1)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              nativeID="hero-prev"
              className="bg-white/10"
              style={{ width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-white/25 scale-110"
            >
              <ChevronLeft size={32} color="white" />
            </FocusablePressable>
            <FocusablePressable
              onPress={() => goTo(1)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              nativeID="hero-next"
              className="bg-white/10"
              style={{ width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-white/25 scale-110"
            >
              <ChevronRight size={32} color="white" />
            </FocusablePressable>
          </View>
        </View>
      )}
    </View>
  );
});
