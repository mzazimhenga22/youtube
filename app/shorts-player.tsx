import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, FlatList, ViewToken, ActivityIndicator, useWindowDimensions, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoView, useVideoPlayer } from 'expo-video';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, MoreVertical, Play, User, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { youtubeService, Video } from '@/lib/youtube';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, FadeIn } from 'react-native-reanimated';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { ShortsPulseLoader } from '@/components/tv/ShortsPulseLoader';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ShortsPlayerScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    url?: string;
    title?: string;
    channel?: string;
    views?: string;
    thumbnail?: string;
    duration?: string;
  }>();
  const router = useRouter();
  const [shorts, setShorts] = useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [prefetchedStreams, setPrefetchedStreams] = useState<Record<string, string>>({});
  
  // Drawer state
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const drawerAnim = useSharedValue(400); // 400 means off-screen (since width is 400 and right is 0)

  const initialShort: Video | null = params.id ? {
    id: params.id,
    title: params.title || 'Short',
    channel: params.channel || 'YouTube',
    views: params.views || '0',
    thumbnail: params.thumbnail || '',
    duration: params.duration || '0:00',
  } : null;

  useEffect(() => {
    async function loadMore() {
      try {
        const data = await youtubeService.search("shorts");
        const merged = initialShort
          ? [initialShort, ...data.filter(video => video.id !== initialShort.id)]
          : data;
        setShorts(merged.length > 0 ? merged : buildFallbackShorts());
        if (params.url && initialShort) {
          setPrefetchedStreams(prev => ({ ...prev, [initialShort.id]: params.url as string }));
        }
      } catch (e) { console.error(e); }
    }
    loadMore();
  }, [params.id]);

  useEffect(() => {
    const activeVideo = shorts[activeIndex];
    if (!activeVideo || prefetchedStreams[activeVideo.id]) return;
    youtubeService.getStream(activeVideo.id).then(stream => {
      if (stream?.url) setPrefetchedStreams(prev => ({ ...prev, [activeVideo.id]: stream.url }));
    }).catch(e => console.error(e));
  }, [activeIndex, shorts]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setActiveIndex(viewableItems[0].index ?? 0);
  }).current;

  const toggleComments = useCallback(() => {
    setIsCommentsOpen(prev => {
      const nextState = !prev;
      drawerAnim.value = withSpring(nextState ? 0 : 400, { damping: 20 });
      return nextState;
    });
  }, [drawerAnim]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drawerAnim.value }],
  }));

  const flatListRef = useRef<FlatList>(null);

  const playNext = useCallback(() => {
    if (activeIndex < shorts.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  }, [activeIndex, shorts.length]);

  const renderItem = useCallback(({ item, index }: { item: Video, index: number }) => (
    <ShortPage 
      video={item} 
      isActive={index === activeIndex} 
      streamUrl={prefetchedStreams[item.id] || null}
      onOpenComments={toggleComments}
      onPlayNext={playNext}
    />
  ), [activeIndex, prefetchedStreams, toggleComments, playNext]);

  return (
    <View style={StyleSheet.absoluteFill} className="bg-black">
      <FlatList
        ref={flatListRef}
        data={shorts}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        scrollEnabled={!isCommentsOpen}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        removeClippedSubviews={true}
        style={{ height: SCREEN_HEIGHT }}
        onScrollToIndexFailed={(info) => {
           flatListRef.current?.scrollToOffset({ offset: info.averageItemLength * info.index, animated: true });
        }}
      />

      {/* Exit Button */}
      <View className="absolute top-12 left-12 z-50">
        <FocusablePressable 
          onPress={() => router.back()}
          className="w-12 h-12 bg-white/10 rounded-full items-center justify-center"
          focusedClassName="bg-white scale-110"
        >
          {({ isFocused }) => (
            <X size={24} color={isFocused ? 'black' : 'white'} />
          )}
        </FocusablePressable>
      </View>

      {/* Comments Drawer */}
      <Animated.View 
        style={[styles.drawer, drawerStyle]}
        className="bg-[#1a1a1a] border-l border-white/10 shadow-2xl"
      >
        <CommentsPanel videoId={shorts[activeIndex]?.id} onClose={toggleComments} />
      </Animated.View>
    </View>
  );
}

const ShortPage = memo(({ video, isActive, streamUrl, onOpenComments, onPlayNext }: { 
  video: Video, isActive: boolean, streamUrl: string | null, onOpenComments: () => void, onPlayNext: () => void
}) => {
  const { width, height } = useWindowDimensions();
  const isPhone = width < 768;
  const [videoAspect, setVideoAspect] = useState(9/16);
  
  const player = useVideoPlayer(streamUrl || '', (p) => {
    p.loop = false; // We handle autoplay ourselves for 'infinite' feel
    if (isActive) p.play();
  });

  // Autoplay next logic
  useEffect(() => {
    const subscription = player.addListener('statusChange', (event) => {
      if (event.status === 'idle' && isActive) {
        // Video ended, navigate to next
        onPlayNext?.();
      }
    });
    return () => subscription.remove();
  }, [player, isActive, onPlayNext]);

  useEffect(() => {
    const status = player.status as any;
    if (status?.videoSize?.width && status?.videoSize?.height) {
      const ratio = status.videoSize.width / status.videoSize.height;
      setVideoAspect(Math.max(0.5, Math.min(ratio, 0.8)));
    }
  }, [player.status]);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const subscription = player.addListener('timeUpdate', (event) => {
      if (player.duration > 0) {
        setProgress(event.currentTime / player.duration);
      }
    });
    return () => subscription.remove();
  }, [player]);

  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (isActive) {
      player.play();
      setIsPlaying(true);
    } else {
      player.pause();
      setIsPlaying(false);
    }
  }, [isActive, player]);

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  }, [player]);

  const videoHeight = height * 0.85;
  const containerWidth = videoHeight * videoAspect;

  // Local loading state to ensure the loader has time to be seen
  const [isStreamLoading, setIsStreamLoading] = useState(true);

  useEffect(() => {
    if (streamUrl) {
      setIsStreamLoading(false);
    } else {
      setIsStreamLoading(true);
    }
  }, [streamUrl]);

  return (
    <View style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }} className="items-center justify-center">
      {/* ── AMBIENT CANVAS ── */}
      <View style={StyleSheet.absoluteFill}>
        <Image source={{ uri: video.thumbnail }} style={StyleSheet.absoluteFill} blurRadius={100} className="opacity-40" />
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
      </View>

      <View className="flex-row items-center justify-center">
        {/* ── FLOATING VERTICAL PLAYER ── */}
        <Animated.View 
          entering={FadeIn.duration(1000)}
          className="bg-zinc-950 overflow-hidden border-[1px] border-white/10 shadow-2xl"
          style={{ 
            height: videoHeight, 
            width: containerWidth,
            borderRadius: 48,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 30 },
            shadowOpacity: 0.8,
            shadowRadius: 50,
            elevation: 40,
          }} 
        >
          <FocusablePressable
            onPress={togglePlay}
            className="flex-1"
            focusedClassName=""
            activeScale={1}
          >
            {({ isFocused }) => (
              <>
                {!isStreamLoading && streamUrl ? (
                  <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
                ) : (
                  <ShortsPulseLoader thumbnail={video.thumbnail} />
                )}

                {/* Focus indicator & Play/Pause Overlay */}
                {isFocused && (
                  <View style={StyleSheet.absoluteFill} className="items-center justify-center bg-white/5">
                    {!isPlaying && (
                      <Animated.View entering={FadeIn.duration(200)} className="bg-white/90 p-6 rounded-full shadow-2xl">
                        <Play size={48} color="black" fill="black" />
                      </Animated.View>
                    )}
                  </View>
                )}

                {/* Info Overlay (Bottom) */}
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} className="absolute inset-x-0 bottom-0 p-8">
                  <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 rounded-full bg-zinc-800 mr-3 border-2 border-white/20 overflow-hidden shadow-lg">
                      <Image source={{ uri: video.thumbnail }} className="w-full h-full" />
                    </View>
                    <View>
                      <Text className="text-white text-lg font-black tracking-tight" numberOfLines={1}>
                        @{video.channel.replace(/\s+/g, '').toLowerCase()}
                      </Text>
                      <Text className="text-zinc-400 text-xs font-bold uppercase tracking-widest">{video.views} Views</Text>
                    </View>
                    <FocusablePressable className="bg-red-600 px-6 py-2 rounded-full ml-4" focusedClassName="bg-white">
                       {({ isFocused: btnFocused }) => <Text className={`font-black text-xs ${btnFocused ? 'text-black' : 'text-white'}`}>FOLLOW</Text>}
                    </FocusablePressable>
                  </View>
                  <Text className="text-white text-2xl font-black leading-tight tracking-tighter" numberOfLines={2}>{video.title}</Text>
                </LinearGradient>

                {/* Progress Pill */}
                <View className="absolute bottom-0 inset-x-0 h-1.5 px-8 pb-4">
                  <View className="flex-1 bg-white/20 rounded-full overflow-hidden">
                    <View 
                      className="h-full bg-white" 
                      style={{ width: `${progress * 100}%` }} 
                    />
                  </View>
                </View>
              </>
            )}
          </FocusablePressable>
        </Animated.View>

        {/* ── MINIMALIST ACTION DOCK ── */}
        <View className="ml-16 space-y-12 items-center">
          <ShortsPlayerAction icon={ThumbsUp} label="Like" color="#00E5FF" />
          <ShortsPlayerAction icon={ThumbsDown} label="Dislike" color="#FF3D00" />
          <ShortsPlayerAction icon={MessageSquare} label="Talk" onPress={onOpenComments} color="#FFD600" />
          <ShortsPlayerAction icon={Share2} label="Send" color="#00E676" />
          <ShortsPlayerAction icon={MoreVertical} />
        </View>
      </View>
    </View>
  );
});

function CommentsPanel({ videoId, onClose }: { videoId: string, onClose: () => void }) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    youtubeService.getComments(videoId).then(data => {
      setComments(Array.isArray(data) ? data : []);
      setLoading(false);
    }).catch(() => {
      setComments([]);
      setLoading(false);
    });
  }, [videoId]);

  return (
    <View className="flex-1 p-6">
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-white text-2xl font-black">Comments</Text>
        <FocusablePressable onPress={onClose} className="p-2 rounded-full" focusedClassName="bg-white/10">
          <X size={24} color="white" />
        </FocusablePressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#FF0000" size="large" className="mt-20" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {comments?.map((comment, i) => (
            <View key={i} className="flex-row mb-6">
              <View className="w-10 h-10 rounded-full bg-zinc-800 mr-3 overflow-hidden">
                <Image source={{ uri: comment.avatar }} className="w-full h-full" />
              </View>
              <View className="flex-1">
                <Text className="text-zinc-400 font-bold text-sm mb-1">{comment.user}</Text>
                <Text className="text-white text-base leading-snug">{comment.text}</Text>
              </View>
            </View>
          ))}
          {comments?.length === 0 && (
            <Text className="text-zinc-500 text-center mt-20 font-bold">No comments yet</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const ShortsPlayerAction = memo(({ icon: Icon, label, onPress, color = "white" }: any) => (
  <FocusablePressable 
    onPress={onPress}
    className="items-center"
    focusedClassName="scale-110"
  >
    {({ isFocused }) => (
      <View className="items-center">
        <View 
          className={`w-16 h-16 rounded-full items-center justify-center mb-2 ${isFocused ? 'bg-white' : 'bg-white/10'}`}
          style={isFocused ? { shadowColor: color, shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 } : {}}
        >
          <Icon size={28} color={isFocused ? "black" : color} strokeWidth={3} />
        </View>
        {label && (
          <Text className={`font-black text-xs tracking-widest uppercase ${isFocused ? 'text-white' : 'text-white/40'}`}>{label}</Text>
        )}
      </View>
    )}
  </FocusablePressable>
));

function buildFallbackShorts(): Video[] {
  return [{ id: 'fallback', title: 'Trending Short', channel: 'YouTube', views: '1M', thumbnail: '', duration: '0:30' }];
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 400,
    zIndex: 100,
  }
});
