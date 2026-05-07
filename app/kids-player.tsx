import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Play, Pause, ArrowLeft, RotateCcw, SkipForward } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { youtubeService } from '@/lib/youtube';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { MagicKidsLoader } from '@/components/tv/MagicKidsLoader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function KidsPlayerScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    thumbnail: string;
  }>();
  const router = useRouter();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  console.log('[KidsPlayer] Params:', params);

  const player = useVideoPlayer(streamUrl || '', (p) => {
    p.loop = true;
  });

  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    async function fetchStream() {
      if (!params.id) return;

      try {
        const stream = await youtubeService.getStream(params.id);
        if (stream && stream.url && stream.url !== lastUrlRef.current) {
          lastUrlRef.current = stream.url;
          setStreamUrl(stream.url);
          
          // Use replaceAsync to avoid UI freezes and ensure better native stability
          await player.replace({ uri: stream.url });
          player.play();
          setIsPlaying(true);
        }
      } catch (e) {
        console.error('[KidsPlayer] Fetch exception:', e);
        setError('Network error');
      }
    }
    fetchStream();
  }, [params.id, player]);

  useEffect(() => {
    const subscription = player.addListener('timeUpdate', (event) => {
      if (player.duration > 0) {
        setProgress(event.currentTime / player.duration);
      }
    });
    return () => subscription.remove();
  }, [player]);

  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 5000);
  };

  useEffect(() => {
    showControls();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, []);

  return (
    <View style={styles.container}>
      {streamUrl ? (
        <VideoView 
          player={player} 
          style={StyleSheet.absoluteFill} 
          contentFit="contain"
          nativeControls={false}
        />
      ) : (
        <MagicKidsLoader />
      )}

      {/* Overlay Layer */}
      <View style={StyleSheet.absoluteFill} onPointerMove={showControls}>
        
        {/* Back Button */}
        <Animated.View 
          entering={FadeIn.duration(400)}
          className="absolute top-12 left-12 z-50"
        >
          <FocusablePressable 
            onPress={() => router.back()}
            className="w-20 h-20 bg-white rounded-full items-center justify-center shadow-2xl border-4 border-white"
            focusedClassName="scale-110 bg-[#FF4B4B]"
          >
            {({ isFocused }) => (
              <ArrowLeft size={40} color={isFocused ? "white" : "#FF4B4B"} strokeWidth={4} />
            )}
          </FocusablePressable>
        </Animated.View>

        {/* Playful Controls */}
        {controlsVisible && (
          <Animated.View 
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            style={StyleSheet.absoluteFill}
            pointerEvents="box-none"
          >
            <LinearGradient 
              colors={['transparent', 'rgba(0,0,0,0.6)']} 
              className="absolute inset-x-0 bottom-0 h-1/2" 
            />

            <View className="absolute bottom-16 inset-x-16 items-center">
              {/* Giant Play/Pause */}
              <View className="flex-row items-center mb-12" style={{ gap: 40 }}>
                <FocusablePressable 
                  onPress={() => player.seekBy(-10)}
                  className="w-24 h-24 bg-white/20 rounded-full items-center justify-center border-4 border-white/40"
                  focusedClassName="bg-white scale-110 border-white"
                >
                  {({ isFocused }) => <RotateCcw size={40} color={isFocused ? "black" : "white"} strokeWidth={3} />}
                </FocusablePressable>

                <FocusablePressable 
                  onPress={() => {
                    if (player.playing) {
                      player.pause();
                      setIsPlaying(false);
                    } else {
                      player.play();
                      setIsPlaying(true);
                    }
                  }}
                  className="w-32 h-32 bg-[#FF4B4B] rounded-full items-center justify-center shadow-2xl border-8 border-white"
                  focusedClassName="scale-125 shadow-[#FF4B4B]/50"
                >
                  {isPlaying ? (
                    <Pause size={60} color="white" fill="white" />
                  ) : (
                    <Play size={60} color="white" fill="white" style={{ marginLeft: 8 }} />
                  )}
                </FocusablePressable>

                <FocusablePressable 
                  onPress={() => player.seekBy(10)}
                  className="w-24 h-24 bg-white/20 rounded-full items-center justify-center border-4 border-white/40"
                  focusedClassName="bg-white scale-110 border-white"
                >
                  {({ isFocused }) => <SkipForward size={40} color={isFocused ? "black" : "white"} strokeWidth={3} />}
                </FocusablePressable>
              </View>

              {/* Colorful Progress Bar */}
              <View className="w-full">
                <View className="h-6 w-full bg-white/20 rounded-full overflow-hidden border-2 border-white/30">
                  <View 
                    className="h-full bg-[#4BFF7B]" 
                    style={{ width: `${progress * 100}%` }} 
                  />
                </View>
                <Text className="text-white text-2xl font-black mt-6 uppercase tracking-widest text-center shadow-lg">
                  {params.title}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
