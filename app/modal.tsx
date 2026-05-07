import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Text, FlatList, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { VideoPlayerOverlay } from '@/components/tv/VideoPlayerOverlay';
import { MusicPlayerOverlay } from '@/components/tv/MusicPlayerOverlay';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { youtubeService, Video, Chapter } from '@/lib/youtube';
import { fetchLyrics, LyricsData } from '@/lib/lyrics';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  interpolate,
  useSharedValue,
  FadeInRight,
  FadeOutRight
} from 'react-native-reanimated';
import { useAppStore } from '@/lib/store';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { User, MessageSquare, Play, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { savePlaybackProgress, getPlaybackProgress } from '@/lib/db';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { getWatchHistoryFromFirestore } from '@/lib/firestore';
import { useScreenGC } from '@/lib/useScreenGC';

export default function VideoPlayerScreen() {
  const params = useLocalSearchParams<{
    id: string;
    title: string;
    channel: string;
    views: string;
    thumbnail: string;
    duration: string;
    isLive?: string;
    publishedAt?: string;
    type?: string;
  }>();

  const [videoDetails, setVideoDetails] = useState<Partial<Video> | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [recommendationRows, setRecommendationRows] = useState<{title: string, data: Video[]}[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedTime, setSavedTime] = useState(0);
  const [liveChat, setLiveChat] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [lyrics, setLyrics] = useState<LyricsData | null>(null);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const elapsedSecondsRef = useRef(0);
  const [upNextVideo, setUpNextVideo] = useState<Video | null>(null);
  const [upNextCountdown, setUpNextCountdown] = useState(0);
  const [showUpNext, setShowUpNext] = useState(false);
  const upNextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const hasEndedRef = useRef(false);
  
  const layoutProgress = useSharedValue(0);

  const { 
    globalVideo, 
    globalStreamUrl, 
    setGlobalPlayback, 
    setGlobalPlaying,
    setGlobalProgress
  } = useAppStore();

  // Detect if this is a music track (explicitly passed or heuristic)
  const isMusic = params.type === 'music' || (
    params.channel?.toLowerCase().includes('vevo') || 
    params.channel?.toLowerCase().includes('music') ||
    params.title?.toLowerCase().includes('official audio') ||
    params.title?.toLowerCase().includes('lyrics')
  );

  // ── Screen Garbage Collector ──
  useScreenGC('VideoPlayer', {
    delayMs: 20_000,
    onCleanup: useCallback(() => {
      setRecommendationRows([]);
      setComments([]);
      setLiveChat([]);
      setVideoDetails(null);
      setUpNextVideo(null);
      setShowUpNext(false);
      console.log('[Modal] 🧹 GC: Released player data');
    }, []),
    onReactivate: useCallback(() => {
      // Player screen re-fetches via params.id effect, no extra trigger needed
      console.log('[Modal] ♻️ GC: Screen reactivated');
    }, []),
  });

  useEffect(() => {
    layoutProgress.value = withSpring((isCommentsOpen || isLyricsOpen) ? 1 : 0, { damping: 15 });
  }, [isCommentsOpen, isLyricsOpen]);

  const player = useVideoPlayer(streamUrl || '', (player) => {
    player.loop = false; // Never loop — we autoplay next
    player.timeUpdateEventInterval = 0.5;
    player.playbackRate = playbackSpeed;
    player.play();
  });

  // Update playback speed when state changes
  useEffect(() => {
    player.playbackRate = playbackSpeed;
  }, [playbackSpeed, player]);

  // Cleanup player on unmount - Only pause if NOT music to allow bg play
  useEffect(() => {
    return () => {
      if (!isMusic) {
        try {
          player.pause();
        } catch (e) {
          console.warn('[Modal] Player cleanup failed:', e);
        }
      }
    };
  }, [player, isMusic]);

  // Fetch real stream URL, recommendations, progress, and Live Chat / Comments
  useEffect(() => {
    async function fetchData() {
      if (!params.id) return;
      try {
        const [details, related, history, saved] = await Promise.all([
          youtubeService.getVideoDetails(params.id),
          youtubeService.getRelatedVideos({ 
            id: params.id, 
            title: params.title || '', 
            channel: params.channel || '', 
            views: params.views || '', 
            thumbnail: params.thumbnail || '', 
            duration: params.duration || '' 
          }),
          getWatchHistoryFromFirestore(),
          getPlaybackProgress(params.id)
        ]);

        // Check if we already have the stream from global background (Music tab)
        if (globalVideo?.id === params.id && globalStreamUrl) {
          console.log('[Modal] 🚀 Unifying with background playback');
          setStreamUrl(globalStreamUrl);
        } else {
          const stream = await youtubeService.getStream(params.id);
          if (stream) {
            setStreamUrl(stream.url);
            setGlobalPlayback(params as any, stream.url);
          }
        }
        
        if (details) setVideoDetails(details);
        
        // Setup recommendation rows
        const rows = [
          { title: 'Up Next', data: related.slice(0, 8) },
          { title: 'More from ' + (params.channel || 'this channel'), data: related.slice(8, 16) },
          { title: 'For You', data: (history as Video[]).slice(0, 8) },
          { title: 'Trending Now', data: (history as Video[]).slice(8, 16) },
        ].filter(r => r.data && r.data.length > 0);
        
        setRecommendationRows(rows);
        if (related.length > 0) setUpNextVideo(related[0]);

        // Secondary data (comments/chat)
        if (params.isLive === 'true') {
          youtubeService.getLiveChat(params.id).then(setLiveChat);
        } else {
          youtubeService.getComments(params.id).then(setComments);
        }
        
        // Resume Progress
        if (saved && saved.time > 10) {
          setSavedTime(saved.time);
          setShowResumePrompt(true);
        }

        // Fetch Lyrics
        fetchLyrics(params.title || '', params.channel || '').then(setLyrics);
      } catch (e) {
        console.warn('[Modal] Fetch failed:', e);
      }
    }

    // Reset state for new video
    hasEndedRef.current = false;
    setShowUpNext(false);
    setUpNextCountdown(0);
    setVideoDetails(null);
    setCurrentChapter(null);
    setLyrics(null);
    setActiveLyricIndex(-1);
    
    fetchData();
  }, [params.id]);

  // Live Chat Polling
  useEffect(() => {
    if (!params.isLive || !params.id) return;
    
    const interval = setInterval(async () => {
       const newChat = await youtubeService.getLiveChat(params.id as string);
       if (newChat.length > 0) {
          setLiveChat(prev => {
             const combined = [...newChat, ...prev];
             return combined.filter((v, i, self) => self.findIndex(t => t.id === v.id) === i).slice(0, 50);
          });
       }
    }, 10000); // Poll every 10s for new messages

    return () => clearInterval(interval);
  }, [params.isLive, params.id]);

  // Keep track of duration in a ref to avoid native crashes on unmount
  const durationRef = useRef(0);
  useEffect(() => {
    if (player.duration > 0) durationRef.current = player.duration;
  }, [player.duration]);

  useEffect(() => {
    elapsedSecondsRef.current = elapsedSeconds;
  }, [elapsedSeconds]);

  // Periodic Save
  useEffect(() => {
    if (!streamUrl || !params.id) return;
    
    const interval = setInterval(() => {
      const duration = durationRef.current;
      const currentTime = elapsedSecondsRef.current;

      if (currentTime > 5 && duration > 0) {
        savePlaybackProgress({
          id: params.id,
          time: currentTime,
          duration,
          title: params.title || '',
          channel: params.channel || '',
          thumbnail: params.thumbnail || ''
        });
      }
    }, 10000); // Save every 10s

    return () => {
      clearInterval(interval);
      // Final save on unmount using state/refs to avoid accessing released native objects
      if (elapsedSecondsRef.current > 5 && durationRef.current > 0) {
        savePlaybackProgress({
          id: params.id,
          time: elapsedSecondsRef.current,
          duration: durationRef.current,
          title: params.title || '',
          channel: params.channel || '',
          thumbnail: params.thumbnail || ''
        });
      }
    };
  }, [streamUrl, params.id, params.title, params.channel, params.thumbnail]);

  // Sync progress + detect video ending
  useEffect(() => {
    const subscription = player.addListener('timeUpdate', (event) => {
      const currentTimeMs = event.currentTime * 1000;
      setElapsedSeconds(event.currentTime);

      if (player.duration > 0) {
        const currentProgress = Math.max(0, Math.min(1, event.currentTime / player.duration));
        setProgress(currentProgress);

        // Track Current Chapter
        if (videoDetails?.chapters) {
          const chapter = [...videoDetails.chapters].reverse().find(c => event.currentTime >= c.time);
          if (chapter && chapter.title !== currentChapter?.title) {
            setCurrentChapter(chapter);
          }
        }

        // Track Synced Lyrics
        if (lyrics?.type === 'synced' && lyrics.lines) {
          const index = [...lyrics.lines].reverse().findIndex(line => currentTimeMs >= line.timeMs);
          const finalIndex = index !== -1 ? (lyrics.lines.length - 1 - index) : -1;
          if (finalIndex !== activeLyricIndex) {
            setActiveLyricIndex(finalIndex);
          }
        }

        // Show Up Next card when 90% through (and we have a next video)
        if (currentProgress > 0.90 && upNextVideo && !showUpNext && !hasEndedRef.current) {
          setShowUpNext(true);
          setUpNextCountdown(10);
        }
      }
    });
    return () => subscription.remove();
  }, [player, upNextVideo, showUpNext, videoDetails, currentChapter, lyrics, activeLyricIndex]);

  // Listen for playback ending to auto-advance
  useEffect(() => {
    const subscription = player.addListener('statusChange', (event: any) => {
      if (event.status === 'idle' && !hasEndedRef.current && upNextVideo) {
        hasEndedRef.current = true;
        playNextVideo();
      }
    });
    return () => subscription.remove();
  }, [player, upNextVideo]);

  // Sync isPlaying state with player
  useEffect(() => {
    const sub = player.addListener('playingChange', ({ isPlaying: playing }) => {
      setIsPlaying(playing);
      setGlobalPlaying(playing);
    });
    return () => sub.remove();
  }, [player, setGlobalPlaying]);

  // Up Next countdown timer
  useEffect(() => {
    if (!showUpNext || upNextCountdown <= 0) return;
    upNextTimerRef.current = setTimeout(() => {
      const next = upNextCountdown - 1;
      setUpNextCountdown(next);
      if (next <= 0 && upNextVideo) {
        playNextVideo();
      }
    }, 1000);
    return () => {
      if (upNextTimerRef.current) clearTimeout(upNextTimerRef.current);
    };
  }, [showUpNext, upNextCountdown, upNextVideo]);

  const playNextVideo = useCallback(() => {
    if (!upNextVideo) return;
    setShowUpNext(false);
    setUpNextCountdown(0);
    router.replace({
      pathname: '/modal',
      params: {
        id: upNextVideo.id,
        title: upNextVideo.title,
        channel: upNextVideo.channel,
        views: upNextVideo.views,
        thumbnail: upNextVideo.thumbnail,
        duration: upNextVideo.duration,
      },
    });
  }, [upNextVideo, router]);

  const cancelUpNext = useCallback(() => {
    setShowUpNext(false);
    setUpNextCountdown(0);
    if (upNextTimerRef.current) clearTimeout(upNextTimerRef.current);
  }, []);

  const { width: screenWidth } = Dimensions.get('window');
  
  const animatedPlayerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(layoutProgress.value, [0, 1], [0, -screenWidth * 0.425]) },
        { scale: interpolate(layoutProgress.value, [0, 1], [1, 0.85]) },
      ],
      borderRadius: interpolate(layoutProgress.value, [0, 1], [0, 32]),
      overflow: 'hidden',
    };
  });

  const displayDuration = player.duration > 0 ? formatTime(player.duration) : params.duration || "0:00";
  const commentsCount = comments.length > 0 ? (comments.length > 99 ? '99+' : comments.length.toString()) : undefined;

  return (
    <View style={styles.container} className="bg-[#0a0e14]">
      <StatusBar hidden />
      
      {/* Ambient Background Layer */}
      <Animated.View 
        style={StyleSheet.absoluteFill}
        className="opacity-40"
      >
        <Image 
          source={{ uri: params.thumbnail }} 
          style={StyleSheet.absoluteFill}
          blurRadius={80}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,14,20,0.8)', '#0a0e14']}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Animated Video Container */}
      <Animated.View style={[StyleSheet.absoluteFillObject, animatedPlayerStyle, { backgroundColor: '#18181b', shadowColor: '#000', shadowOffset: { width: 0, height: 25 }, shadowOpacity: 0.5, shadowRadius: 50, elevation: 30 }]}>
        {streamUrl ? (
          <VideoView 
            player={player} 
            style={StyleSheet.absoluteFill} 
            contentFit="contain"
            nativeControls={false}
          />
        ) : (
          <SingularityLoader transparent minimal />
        )}

        {/* Resume Prompt Overlay */}
        {showResumePrompt && (
          <View className="absolute inset-0 z-[60] items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <View className="bg-zinc-900 rounded-3xl border border-white/10 items-center shadow-2xl" style={{ width: Math.min(520, screenWidth * 0.85), padding: screenWidth < 768 ? 24 : 48 }}>
              <Text className="text-white text-2xl md:text-3xl font-black mb-3 tracking-tighter">Continue watching?</Text>
              <Text className="text-zinc-500 text-base md:text-lg font-bold mb-6 text-center">
                You stopped at {formatTime(savedTime)}. Resume?
              </Text>
              
              <View className="flex-row" style={{ gap: 12 }}>
                <FocusablePressable 
                  onPress={() => {
                    player.seekBy(savedTime);
                    setShowResumePrompt(false);
                  }}
                  className="bg-white px-8 py-4 rounded-full"
                  focusedClassName="scale-110"
                >
                  <Text className="text-black font-black text-lg">Resume</Text>
                </FocusablePressable>
                
                <FocusablePressable 
                  onPress={() => setShowResumePrompt(false)}
                  className="bg-white/10 px-8 py-4 rounded-full"
                  focusedClassName="bg-white"
                >
                  {({ isFocused }) => (
                    <Text className={`font-black text-lg ${isFocused ? 'text-black' : 'text-white'}`}>Start Over</Text>
                  )}
                </FocusablePressable>
              </View>
            </View>
          </View>
        )}

        {/* Overlay - Only visible when sidebars are CLOSED */}
        {(!isCommentsOpen && !isLyricsOpen) && (
          isMusic ? (
            <MusicPlayerOverlay 
              title={params.title || "Unknown Track"}
              artist={params.channel || "Unknown Artist"}
              albumArt={params.thumbnail || ""}
              isPlaying={isPlaying}
              progress={progress}
              currentTime={formatTime(elapsedSeconds)}
              duration={displayDuration}
              isLive={params.isLive === 'true'}
              viewerCount={videoDetails?.viewerCount}
              chapters={videoDetails?.chapters}
              currentChapter={currentChapter}
              totalDurationSeconds={player.duration}
              recommendations={recommendationRows[0]?.data || []}
              lyrics={lyrics}
              activeLyricIndex={activeLyricIndex}
              onTogglePlay={() => {
                if (player.playing) {
                  player.pause();
                } else {
                  player.play();
                }
              }}
              onSeek={(delta) => {
                try { player.seekBy(delta); } catch {}
              }}
              onNext={playNextVideo}
              onSetSpeed={(speed) => setPlaybackSpeed(speed)}
              playbackSpeed={playbackSpeed}
            />
          ) : (
            <VideoPlayerOverlay 
              title={params.title || "Unknown Video"}
              channelName={params.channel || "Unknown Channel"}
              channelAvatar={params.thumbnail || ""} 
              isPlaying={isPlaying}
              progress={progress}
              currentTime={formatTime(elapsedSeconds)}
              duration={displayDuration}
              isLive={params.isLive === 'true'}
              views={params.views || ''}
              publishedAt={params.publishedAt || ''}
              videoId={params.id}
              viewerCount={videoDetails?.viewerCount}
              chapters={videoDetails?.chapters}
              currentChapter={currentChapter}
              playbackSpeed={playbackSpeed}
              totalDurationSeconds={player.duration}
              commentsCount={commentsCount}
              recommendationRows={recommendationRows}
              onToggleComments={() => {
                setIsCommentsOpen(true);
                setIsLyricsOpen(false);
              }}
              onToggleLyrics={() => {
                setIsLyricsOpen(true);
                setIsCommentsOpen(false);
              }}
              onNext={playNextVideo}
              onSetSpeed={(speed) => setPlaybackSpeed(speed)}
              onSeek={(delta) => {
                try { player.seekBy(delta); } catch {}
              }}
              onTogglePlay={() => {
                if (player.playing) {
                  player.pause();
                } else {
                  player.play();
                }
              }}
            />
          )
        )}
      </Animated.View>

      {/* ── UP NEXT COUNTDOWN CARD (Aura Style) ── */}
      {showUpNext && upNextVideo && (
        <View className="absolute bottom-28 right-8 z-[70]" style={{ width: 380 }}>
          <View style={{ backgroundColor: 'rgba(10,10,10,0.85)', borderRadius: 24, overflow: 'hidden' }}>
            {/* Ambient Aura Background */}
            <LinearGradient
              colors={['rgba(255, 0, 0, 0.15)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: -0.5 }}>Up Next</Text>
                <View style={{ backgroundColor: '#FF0000', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                  <Text style={{ color: 'white', fontSize: 13, fontWeight: '900' }}>{upNextCountdown}s</Text>
                </View>
              </View>
              <FocusablePressable
                onPress={cancelUpNext}
                className="w-10 h-10 rounded-full bg-white/10 items-center justify-center"
                focusedClassName="bg-white/30 scale-110"
              >
                <X size={18} color="white" strokeWidth={3} />
              </FocusablePressable>
            </View>

            <FocusablePressable
              onPress={playNextVideo}
              className="flex-row p-3 rounded-2xl mx-2 mb-2"
              focusedClassName="bg-white/10 scale-102"
            >
              {({ isFocused }) => (
                <>
                  <View style={{ width: 140, height: 80, borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
                    <Image source={{ uri: upNextVideo.thumbnail }} style={{ width: '100%', height: '100%' }} />
                    {isFocused && (
                      <LinearGradient
                        colors={['rgba(255, 0, 0, 0.3)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.95)', alignItems: 'center', justifyContent: 'center' }}>
                        <Play size={20} color="black" fill="black" style={{ marginLeft: 2 }} />
                      </View>
                    </View>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                    <Text style={{ color: isFocused ? 'white' : '#A1A1AA', fontSize: 15, fontWeight: '900', lineHeight: 20, letterSpacing: -0.4 }} numberOfLines={2}>
                      {upNextVideo.title}
                    </Text>
                    <Text style={{ color: '#52525B', fontSize: 13, fontWeight: '800', marginTop: 4 }} numberOfLines={1}>
                      {upNextVideo.channel}
                    </Text>
                  </View>
                </>
              )}
            </FocusablePressable>
            
            {/* Glowing Progress Aura */}
            <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <LinearGradient
                colors={['#FF0000', '#FF4444']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ height: '100%', width: `${((10 - upNextCountdown) / 10) * 100}%` }}
              />
            </View>
          </View>
        </View>
      )}

      {/* Comments Sidebar (Aura Redesign) */}
      {isCommentsOpen && (
        <Animated.View 
          entering={FadeInRight.duration(400)}
          exiting={FadeOutRight.duration(300)}
          style={{ 
            position: 'absolute', 
            right: 0, 
            top: 0, 
            bottom: 0, 
            width: screenWidth < 768 ? screenWidth * 0.92 : screenWidth * 0.42, 
            backgroundColor: 'rgba(5, 5, 5, 0.85)',
            zIndex: 100 
          }}
        >
          {/* Side Aura Light Bleed */}
          <LinearGradient
            colors={['rgba(255, 0, 0, 0.1)', 'transparent']}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={{ flex: 1, paddingHorizontal: screenWidth < 768 ? 16 : 40, paddingTop: screenWidth < 768 ? 20 : 60, paddingBottom: 16 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between" style={{ marginBottom: screenWidth < 768 ? 12 : 24 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <MessageSquare size={screenWidth < 768 ? 22 : 32} color="white" strokeWidth={3} />
                <Text className="text-white font-black tracking-tighter" style={{ fontSize: screenWidth < 768 ? 20 : 32 }}>
                  {params.isLive ? 'Live Chat' : 'Comments'}
                </Text>
              </View>
              <FocusablePressable 
                onPress={() => setIsCommentsOpen(false)}
                className="bg-white/10 rounded-xl"
                focusedClassName="bg-white"
                style={{ paddingHorizontal: screenWidth < 768 ? 12 : 20, paddingVertical: screenWidth < 768 ? 8 : 12 }}
              >
                {({ isFocused }) => (
                  <Text className={`font-black ${isFocused ? 'text-black' : 'text-white'}`} style={{ fontSize: screenWidth < 768 ? 14 : 18 }}>Close</Text>
                )}
              </FocusablePressable>
            </View>

          {/* Comments List */}
          <FlatList
            data={params.isLive ? liveChat : comments}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            renderItem={({ item }) => (
              <FocusablePressable 
                className="rounded-2xl bg-white/5 border border-white/5"
                focusedClassName="bg-white/10 border-white/20 scale-[1.01]"
                style={{ marginBottom: screenWidth < 768 ? 8 : 12, padding: screenWidth < 768 ? 12 : 16 }}
              >
                <View className="flex-row items-start">
                  <View className="rounded-full bg-zinc-800 items-center justify-center overflow-hidden" style={{ width: screenWidth < 768 ? 32 : 44, height: screenWidth < 768 ? 32 : 44, marginRight: screenWidth < 768 ? 10 : 14 }}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} className="w-full h-full" />
                    ) : (
                      <User size={screenWidth < 768 ? 16 : 22} color="white" />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between mb-1">
                      <View className="flex-row items-center" style={{ gap: 6 }}>
                        <Text className="font-black" style={{ fontSize: screenWidth < 768 ? 13 : 16, color: item.color || '#A1A1AA' }}>@{item.user}</Text>
                        {item.publishedTime && <Text className="text-white/40" style={{ fontSize: screenWidth < 768 ? 11 : 13 }}>• {item.publishedTime}</Text>}
                      </View>
                      {!params.isLive && <Text className="text-white/30 font-bold" style={{ fontSize: screenWidth < 768 ? 11 : 14 }}>{item.likes} likes</Text>}
                    </View>
                    <Text className="text-white leading-relaxed font-medium" style={{ fontSize: screenWidth < 768 ? 14 : 18 }}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              </FocusablePressable>
            )}
          />
          </View>
        </Animated.View>
      )}

      {/* Lyrics Sidebar (Unified with Music design) */}
      {isLyricsOpen && (
        <Animated.View 
          entering={FadeInRight.duration(400)}
          exiting={FadeOutRight.duration(300)}
          style={{ 
            position: 'absolute', 
            right: 0, 
            top: 0, 
            bottom: 0, 
            width: screenWidth < 768 ? screenWidth * 0.92 : screenWidth * 0.42, 
            backgroundColor: 'rgba(5, 5, 5, 0.85)',
            zIndex: 100 
          }}
        >
          {/* Side Aura Light Bleed */}
          <LinearGradient
            colors={['rgba(255, 0, 0, 0.1)', 'transparent']}
            start={{ x: 1, y: 0.5 }}
            end={{ x: 0, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={{ flex: 1, paddingHorizontal: screenWidth < 768 ? 16 : 40, paddingTop: screenWidth < 768 ? 20 : 60, paddingBottom: 16 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between" style={{ marginBottom: screenWidth < 768 ? 12 : 24 }}>
              <View className="flex-row items-center" style={{ gap: 8 }}>
                <Music size={screenWidth < 768 ? 22 : 32} color="white" strokeWidth={3} />
                <Text className="text-white font-black tracking-tighter" style={{ fontSize: screenWidth < 768 ? 20 : 32 }}>
                  Lyrics
                </Text>
              </View>
              <FocusablePressable 
                onPress={() => setIsLyricsOpen(false)}
                className="bg-white/10 rounded-xl"
                focusedClassName="bg-white"
                style={{ paddingHorizontal: screenWidth < 768 ? 12 : 20, paddingVertical: screenWidth < 768 ? 8 : 12 }}
              >
                {({ isFocused }) => (
                  <Text className={`font-black ${isFocused ? 'text-black' : 'text-white'}`} style={{ fontSize: screenWidth < 768 ? 14 : 18 }}>Close</Text>
                )}
              </FocusablePressable>
            </View>

            {/* Lyrics Content */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
              {lyrics ? (
                (lyrics.type === 'synced' ? lyrics.lines : lyrics.raw?.split('\n').map(l => ({ text: l })) || []).map((line, index) => {
                  const isActive = index === activeLyricIndex;
                  return (
                    <FocusablePressable
                      key={index}
                      className="mb-8 rounded-2xl p-2"
                      focusedClassName="bg-white/10"
                      activeScale={1.02}
                      onPress={() => {
                        if ('timeMs' in line) {
                            try { player.seekTo(line.timeMs / 1000); } catch {}
                        }
                      }}
                    >
                      {({ isFocused }) => (
                        <Text 
                          className={`font-black leading-tight transition-all duration-700 tracking-tighter ${isActive || isFocused ? 'text-white scale-105' : 'text-white/40'}`}
                          style={{ 
                            fontSize: screenWidth < 768 ? 24 : 40,
                            opacity: isActive || isFocused ? 1 : 0.4
                          }}
                        >
                          {line.text}
                        </Text>
                      )}
                    </FocusablePressable>
                  );
                })
              ) : (
                <View className="flex-1 items-center justify-center py-20">
                  <Text className="text-white/20 text-2xl font-black">No lyrics found</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

function buildFallbackRecommendations(seed: Video): Video[] {
  const artist = seed.channel.replace(/\b(vevo|official|topic)\b/gi, '').trim() || 'YouTube Music';
  const title = seed.title
    .replace(/\([^)]*(official|video|audio|lyrics|visualizer|music)[^)]*\)/gi, ' ')
    .replace(/\[[^\]]*(official|video|audio|lyrics|visualizer|music)[^\]]*\]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalized = `${seed.title} ${seed.channel}`.toLowerCase();
  const isShenseea = normalized.includes('shensea') || normalized.includes('shenseea');
  const topics = isShenseea
    ? [
        'Shenseea dancehall hits',
        'Jamaican dancehall mix',
        'Female dancehall artists',
        'Dancehall party videos',
        'Reggae fusion playlist',
        'Caribbean music videos',
        'Caribbean music videos',
      ]
    : [
        `${artist} top songs`,
        `${artist} live performances`,
        `Artists similar to ${artist}`,
        `${title} remixes`,
        'Trending music videos',
        'New songs this week',
      ];

  return topics.map((topic, index) => ({
    ...seed,
    id: `${seed.id || 'fallback'}-${index}`,
    title: topic,
    channel: index < 2 ? artist : ['YouTube Music', 'Trending', 'Mixes', 'Live Sessions'][index % 4],
    views: index % 2 === 0 ? seed.views : `${12 + index * 7}K`,
    duration: index % 3 === 0 ? seed.duration : `${3 + index}:${String(12 + index).padStart(2, '0')}`,
  }));
}
