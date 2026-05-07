import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FocusablePressable } from './FocusablePressable';
import { Play, Plus, ChevronLeft, ChevronRight, Info } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Video } from '@/lib/youtube';
import { router } from 'expo-router';

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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentVideo = heroVideos[activeIndex] || heroVideos[0];

  // Auto-rotate
  useEffect(() => {
    if (heroVideos.length <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % heroVideos.length);
    }, ROTATION_INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [heroVideos.length]);

  const goTo = useCallback((dir: -1 | 1) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveIndex(prev => (prev + dir + heroVideos.length) % heroVideos.length);
    // Restart timer
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % heroVideos.length);
    }, ROTATION_INTERVAL);
  }, [heroVideos.length]);

  const handlePlay = useCallback(() => {
    router.push({
      pathname: '/modal',
      params: {
        id: currentVideo.id,
        title: currentVideo.title,
        channel: currentVideo.channel,
        views: currentVideo.views,
        thumbnail: currentVideo.thumbnail,
        duration: currentVideo.duration,
      },
    });
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
      borderRadius: 32, 
      overflow: 'hidden', 
      marginBottom: 20, 
      marginTop: 10,
      backgroundColor: '#111',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    }}>
      {/* Background Image with crossfade */}
      <Animated.View key={`hero-${activeIndex}`} entering={FadeIn.duration(800)} style={StyleSheet.absoluteFill}>
        <Image
          source={{ uri: currentVideo.thumbnail || getHDThumbnail(currentVideo.id) }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </Animated.View>

      {/* ── Clean overlays — NO full-screen darkening ── */}
      
      {/* 1. Left side gradient ONLY — for text legibility */}
      <LinearGradient
        colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.4)', 'transparent']}
        locations={[0, 0.4, 0.7]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Bottom fade — blends into content below */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(10,10,10,0.2)',
          'rgba(10,10,10,0.8)',
          '#0A0A0A',
        ]}
        locations={[0, 0.6, 0.85, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', paddingLeft: 60, paddingRight: 60 }}>
        <Animated.View key={`content-${activeIndex}`} entering={FadeInDown.duration(600)}>
          {/* Category Tag */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 }}>
            <View style={{ backgroundColor: '#FF0000', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}>
              <Text style={{ color: 'white', fontSize: 13, fontWeight: '900', letterSpacing: 2.5, textTransform: 'uppercase' }}>
                {activeIndex === 0 ? 'TRENDING' : `#${activeIndex + 1} TRENDING`}
              </Text>
            </View>
            {currentVideo.views ? (
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '700' }}>
                {currentVideo.views} views
              </Text>
            ) : null}
          </View>

          {/* Title */}
          <View style={{ marginBottom: 16, maxWidth: SCREEN_WIDTH * 0.5 }}>
            <Text
              style={{ color: 'white', fontSize: SCREEN_WIDTH < 768 ? 38 : 62, fontWeight: '900', lineHeight: SCREEN_WIDTH < 768 ? 42 : 68, letterSpacing: -2.5 }}
              numberOfLines={1}
            >
              {line1}
            </Text>
            {line2 ? (
              <Text
                style={{ color: 'rgba(255,255,255,0.8)', fontSize: SCREEN_WIDTH < 768 ? 34 : 54, fontWeight: '900', lineHeight: SCREEN_WIDTH < 768 ? 38 : 60, letterSpacing: -2.5 }}
                numberOfLines={1}
              >
                {line2}
              </Text>
            ) : null}
          </View>

          {/* Channel */}
          <Text
            style={{ color: 'rgba(255,255,255,0.6)', fontSize: 20, fontWeight: '700', marginBottom: 32, maxWidth: SCREEN_WIDTH * 0.45 }}
            numberOfLines={1}
          >
            {currentVideo.channel}{currentVideo.duration ? ` • ${currentVideo.duration}` : ''}
          </Text>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <FocusablePressable
              onPress={handlePlay}
              nativeID="hero-play"
              style={{ backgroundColor: 'white', paddingHorizontal: 36, paddingVertical: 18, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-red-600 scale-105"
              activeScale={1.08}
            >
              {({ isFocused }) => (
                <>
                  <Play size={24} color={isFocused ? 'white' : 'black'} fill={isFocused ? 'white' : 'black'} strokeWidth={3} />
                  <Text style={{ color: isFocused ? 'white' : 'black', fontSize: 20, fontWeight: '900', marginLeft: 12, letterSpacing: -0.5 }}>Play Now</Text>
                </>
              )}
            </FocusablePressable>

            <FocusablePressable
              nativeID="hero-info"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 28, paddingVertical: 18, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-white/25 scale-105"
              activeScale={1.08}
            >
              {({ isFocused }) => (
                <>
                  <Info size={22} color={isFocused ? 'white' : 'rgba(255,255,255,0.8)'} />
                  <Text style={{ color: isFocused ? 'white' : 'rgba(255,255,255,0.8)', fontSize: 18, fontWeight: '800', marginLeft: 10 }}>More Info</Text>
                </>
              )}
            </FocusablePressable>

            <FocusablePressable
              nativeID="hero-add"
              style={{ width: 56, height: 56, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-white/25 scale-110"
            >
              <Plus size={26} color="rgba(255,255,255,0.8)" strokeWidth={3} />
            </FocusablePressable>
          </View>
        </Animated.View>
      </View>

      {/* Bottom Navigation — Dots + Arrows */}
      {heroVideos.length > 1 && (
        <View style={{ position: 'absolute', bottom: 60, right: 60, flexDirection: 'row', alignItems: 'center', gap: 20 }}>
          {/* Dot indicators */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{
                  width: (activeIndex % 5) === i ? 26 : 8,
                  height: 8,
                  borderRadius: 5,
                  backgroundColor: (activeIndex % 5) === i ? '#FF0000' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </View>

          {/* Arrow Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <FocusablePressable
              onPress={() => goTo(-1)}
              nativeID="hero-prev"
              style={{ width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-white/25 scale-110"
            >
              <ChevronLeft size={26} color="white" />
            </FocusablePressable>
            <FocusablePressable
              onPress={() => goTo(1)}
              nativeID="hero-next"
              style={{ width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
              focusedClassName="bg-white/25 scale-110"
            >
              <ChevronRight size={26} color="white" />
            </FocusablePressable>
          </View>
        </View>
      )}
    </View>
  );
});
