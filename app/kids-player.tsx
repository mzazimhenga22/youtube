import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { youtubeService, Video } from '@/lib/youtube';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MagicKidsLoader } from '@/components/tv/MagicKidsLoader';
import { KidsVideoPlayerOverlay } from '@/components/tv/KidsVideoPlayerOverlay';
import { FocusablePressable } from '@/components/tv/FocusablePressable';

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
  const [upNext, setUpNext] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const player = useVideoPlayer(null, (p) => {
    p.loop = true;
    p.timeUpdateEventInterval = 0.5;
  });

  useEffect(() => {
    const videoId = Array.isArray(params.id) ? params.id[0] : params.id;
    const requestId = ++requestIdRef.current;
    let cancelled = false;

    async function fetchData() {
      if (!videoId) {
        setError('Missing video id');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setStreamUrl(null);
      setProgress(0);
      setIsPlaying(false);
      try {
        player.pause();
      } catch {}

      try {
        const [stream, related] = await Promise.all([
          youtubeService.getStream(videoId),
          youtubeService.getKidsUpNext(videoId).catch(() => []),
        ]);

        if (cancelled || requestId !== requestIdRef.current) return;

        setUpNext(related);

        if (!stream?.url) {
          setError('This video cannot be played right now');
          setLoading(false);
          return;
        }

        const source = {
          uri: stream.url,
          contentType: stream.mimeType?.includes('mpegURL') ? 'hls' : 'auto',
        } as const;

        await player.replaceAsync(source);

        if (cancelled || requestId !== requestIdRef.current) return;

        setStreamUrl(stream.url);
        player.play();
        setIsPlaying(true);
      } catch (e) {
        console.error('[KidsPlayer] Fetch exception:', e);
        if (!cancelled && requestId === requestIdRef.current) {
          setError('Network error');
        }
      } finally {
        if (!cancelled && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [params.id, player, retryKey]);

  useEffect(() => {
    const timeSubscription = player.addListener('timeUpdate', (event) => {
      if (player.duration > 0) {
        setProgress(event.currentTime / player.duration);
      }
    });

    const playingSubscription = player.addListener('playingChange', ({ isPlaying: nextIsPlaying }) => {
      setIsPlaying(nextIsPlaying);
    });

    const statusSubscription = player.addListener('statusChange', (event: any) => {
      if (event.status === 'error') {
        setError(event.error?.message || 'Playback failed');
        setLoading(false);
      }
    });

    return () => {
      timeSubscription.remove();
      playingSubscription.remove();
      statusSubscription.remove();
    };
  }, [player]);

  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setControlsVisible(false);
    }, 8000); // Longer timeout for kids
  };

  useEffect(() => {
    showControls();
    return () => { if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current); };
  }, []);

  const handleTogglePlay = () => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
    showControls();
  };

  const retry = () => setRetryKey((value) => value + 1);

  return (
    <View style={styles.container} onPointerMove={showControls} onTouchStart={showControls}>
      <VideoView 
        player={player} 
        style={StyleSheet.absoluteFill} 
        contentFit="contain"
        nativeControls={false}
        useExoShutter={false}
      />

      {/* Loader removed: now handled globally in _layout.tsx via playVideo */}

      {error && (
        <View style={styles.errorState}>
          {params.thumbnail ? (
            <Image source={{ uri: params.thumbnail }} style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={styles.errorScrim} />
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Video unavailable</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <View style={styles.errorActions}>
              <FocusablePressable
                onPress={retry}
                className="bg-white px-8 py-4 rounded-full"
                focusedClassName="scale-110"
              >
                <Text className="text-black text-xl font-black">Try Again</Text>
              </FocusablePressable>
              <FocusablePressable
                onPress={() => router.back()}
                className="bg-white/10 px-8 py-4 rounded-full"
                focusedClassName="bg-white scale-110"
              >
                {({ isFocused }) => (
                  <Text className={`text-xl font-black ${isFocused ? 'text-black' : 'text-white'}`}>
                    Go Back
                  </Text>
                )}
              </FocusablePressable>
            </View>
          </View>
        </View>
      )}

      {/* Playful Overlay */}
      {streamUrl && !error && controlsVisible && (
        <Animated.View 
          entering={FadeIn.duration(400)}
          exiting={FadeOut.duration(400)}
          style={StyleSheet.absoluteFill}
        >
          <KidsVideoPlayerOverlay 
            title={params.title || 'Playing Video'}
            isPlaying={isPlaying}
            progress={progress}
            onClose={() => router.back()}
            onTogglePlay={handleTogglePlay}
            upNext={upNext}
            onSelectVideo={(video) => {
                router.replace({
                    pathname: '/kids-player',
                    params: { 
                      id: video.id, 
                      title: video.title, 
                      thumbnail: video.thumbnail 
                    }
                });
            }}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  errorState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  errorCard: {
    alignItems: 'center',
    maxWidth: 620,
  },
  errorTitle: {
    color: 'white',
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 16,
  },
});
