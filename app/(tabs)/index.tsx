import React, { useEffect, useState, useCallback, useMemo, Component, memo } from 'react';
import { View, Text, FlatList } from 'react-native';
import { HorizontalRail } from '@/components/tv/HorizontalRail';
import { HeroBanner } from '@/components/tv/HeroBanner';
import { youtubeService, Video } from '@/lib/youtube';
import { useAppStore } from '@/lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import KidsHomeScreen from '@/components/tv/KidsHomeScreen';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Sparkles, TrendingUp, Gamepad2, Music2, Clapperboard, Monitor, Newspaper, ChefHat, TreePine, Zap } from 'lucide-react-native';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { getContinueWatchingFromFirestore, getProgressMapFromFirestore } from '@/lib/firestore';
import { getWatchHistory } from '@/lib/db';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useScreenGC } from '@/lib/useScreenGC';

const CATEGORIES = [
  { label: "Recommended", icon: Sparkles, color: "#FF0055" },
  { label: "Trending", icon: TrendingUp, color: "#00AAFF" },
  { label: "Gaming", icon: Gamepad2, color: "#00FF99" },
  { label: "Music", icon: Music2, color: "#7700FF" },
  { label: "Movies", icon: Clapperboard, color: "#FF9900" },
  { label: "Tech", icon: Monitor, color: "#00FFFF" },
  { label: "News", icon: Newspaper, color: "#FFCC00" },
  { label: "Cooking", icon: ChefHat, color: "#FF66CC" },
  { label: "Nature", icon: TreePine, color: "#33FF33" }
];

const FALLBACK_VIDEOS: Video[] = [
  {
    id: "v1",
    title: "Cinematic Nature: 8K Ultra HD Drone Footage",
    channel: "Nature World",
    views: "2.4M",
    thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1920",
    duration: "10:00"
  },
  {
    id: "v2",
    title: "Lofi Hip Hop Radio - Beats to Relax/Study to",
    channel: "Lofi Girl",
    views: "45K Live",
    thumbnail: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1920",
    duration: "LIVE"
  },
  {
    id: "v3",
    title: "The Future of Space Travel: Mars Colonization",
    channel: "SpaceX",
    views: "1.8M",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1920",
    duration: "15:42"
  }
];

/* AmbientBackground removed — was causing washed-out content */

async function safeFetch<T>(fn: () => Promise<T>, fallback: T, label = 'fetch'): Promise<T> {
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout`)), 15000)),
    ]);
  } catch (e) {
    console.warn(`[HomeScreen] ${label} failed:`, e);
    return fallback;
  }
}

class HomeErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: string }> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error: error?.message || 'Unknown crash' }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0f0f0f', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#FF4444', fontSize: 24, fontWeight: '900' }}>Something went wrong</Text>
          <FocusablePressable className="mt-8 bg-white px-8 py-4 rounded-full" onPress={() => this.setState({ hasError: false })}>
            <Text className="text-black font-bold">Try Again</Text>
          </FocusablePressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function HomeScreenInner() {
  const { currentProfile, setAmbientState } = useAppStore();
  const [railData, setRailData] = useState<Record<string, Video[]>>({
    "Recommended": FALLBACK_VIDEOS
  });
  const [loading, setLoading] = useState(false);
  const [focusedThumbnail, setFocusedThumbnail] = useState<string | null>(FALLBACK_VIDEOS[0].thumbnail);
  const [continueWatching, setContinueWatching] = useState<Video[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const focusTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isKids = currentProfile?.mode === 'kids';
  const [gcCycle, setGcCycle] = useState(0);

  // ── Screen Garbage Collector ──
  // Releases heavy state (video arrays, thumbnails) after 30s of inactivity
  useScreenGC('Home', {
    delayMs: 30_000,
    onCleanup: useCallback(() => {
      setRailData({ 'Recommended': FALLBACK_VIDEOS });
      setContinueWatching([]);
      setProgressMap(new Map());
      setFocusedThumbnail(FALLBACK_VIDEOS[0].thumbnail);
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      console.log('[Home] 🧹 GC: Released rail data & thumbnails');
    }, []),
    onReactivate: useCallback(() => {
      setGcCycle(c => c + 1);
      console.log('[Home] ♻️ GC: Re-fetching data');
    }, []),
  });

  // Fetch watch history & progress from Firestore + local SQLite
  useEffect(() => {
    if (isKids) return;
    let cancelled = false;
    async function loadWatchData() {
      try {
        const [firestoreCW, firestoreProgress, localHistory] = await Promise.all([
          getContinueWatchingFromFirestore(),
          getProgressMapFromFirestore(),
          getWatchHistory().catch(() => []),
        ]);

        if (cancelled) return;

        // Merge local SQLite progress into the Firestore map
        const mergedMap = new Map(firestoreProgress);
        (localHistory as any[]).forEach((row: any) => {
          if (row.id && row.duration > 0 && !mergedMap.has(row.id)) {
            mergedMap.set(row.id, Math.min(row.time / row.duration, 1));
          }
        });
        setProgressMap(mergedMap);

        // Continue Watching: prefer Firestore, fallback to local
        if (firestoreCW.length > 0) {
          setContinueWatching(firestoreCW as Video[]);
        } else if (localHistory.length > 0) {
          const localCW = (localHistory as any[])
            .filter((r: any) => r.duration > 0 && r.time / r.duration > 0.05 && r.time / r.duration < 0.95)
            .map((r: any) => ({
              id: r.id,
              title: r.title || 'Untitled',
              channel: r.channel || '',
              views: '',
              thumbnail: r.thumbnail || '',
              duration: formatDuration(r.duration),
            }));
          setContinueWatching(localCW);
        }
      } catch (e) {
        console.warn('[HomeScreen] Watch data fetch failed:', e);
      }
    }
    loadWatchData();
    return () => { cancelled = true; };
  }, [isKids, gcCycle]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      if (isKids) return;
      setLoading(true);
      
      try {
        // Fetch Trending (KE) and Home in parallel for speed
        const [trending, home] = await Promise.all([
          safeFetch(() => youtubeService.getTrending(), [] as Video[], 'Trending'),
          safeFetch(() => youtubeService.getHomeVideos(), [] as Video[], 'Home')
        ]);

        if (cancelled) return;

        const newData: Record<string, Video[]> = { ...railData };

        if (trending.length > 0) {
          newData["Trending"] = trending;
          newData["Hero"] = trending.slice(0, 10);
        }
        
        newData["Recommended"] = home.length > 0 ? home : FALLBACK_VIDEOS;
        // Fallback hero if trending failed
        if (!newData["Hero"]) {
          newData["Hero"] = home.length > 0 ? home.slice(0, 5) : FALLBACK_VIDEOS.slice(0, 5);
        }

        setRailData(newData);
      } finally {
        setLoading(false);
      }

      // Fetch other categories in background
      for (const cat of CATEGORIES.slice(2)) {
        if (cancelled) return;
        const videos = await safeFetch(() => youtubeService.getVideosByCategory(cat.label), [] as Video[], cat.label);
        if (!cancelled && videos.length > 0) {
          setRailData(prev => ({ ...prev, [cat.label]: videos }));
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [isKids, gcCycle]);

  const handleFocusThumbnail = useCallback((thumbnail: string | null) => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => {
      setFocusedThumbnail(thumbnail);
      setAmbientState(thumbnail, '#FFFFFF');
    }, 300); // 300ms settle time
  }, [setAmbientState]);

  const heroVideo = useMemo(() => railData["Hero"]?.[0] || null, [railData]);

  const renderHeader = useCallback(() => (
    <View>
      {/* ── Instant Hero Section (Borderless) ── */}
      <View>
        {railData["Hero"] && railData["Hero"].length > 0 ? (
          <Animated.View entering={FadeIn.duration(800)}>
            <HeroBanner 
              title={railData["Hero"][0].title}
              description={railData["Hero"][0].channel}
              thumbnail={railData["Hero"][0].thumbnail}
              videos={railData["Hero"]}
            />
          </Animated.View>
        ) : (
          <View style={{ height: 600 }} className="w-full bg-white/5 items-center justify-center">
            <Zap size={48} color="rgba(255,255,255,0.1)" />
          </View>
        )}
      </View>
      
      {/* ── Premium Category Chips with Horizontal Edge Fade ── */}
      <View style={{ marginBottom: 40, position: 'relative' }}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24 }}
          renderItem={({ item, index }) => (
            <FocusablePressable
              className="flex-row items-center bg-white/5 rounded-3xl mr-4"
              focusedClassName="bg-white scale-110 shadow-2xl shadow-white/20"
              style={{ paddingHorizontal: 28, paddingVertical: 16, gap: 12 }}
            >
              {({ isFocused }) => (
                <>
                  <item.icon size={24} color={isFocused ? 'black' : item.color} />
                  <Text className="font-black text-2xl" style={{ color: isFocused ? 'black' : 'white' }}>{item.label}</Text>
                </>
              )}
            </FocusablePressable>
          )}
        />
        {/* Left Fade */}
        <LinearGradient
          colors={['#0A0A0A', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, zIndex: 10, pointerEvents: 'none' }}
        />
        {/* Right Fade */}
        <LinearGradient
          colors={['transparent', '#0A0A0A']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 10, pointerEvents: 'none' }}
        />
      </View>

      {/* ── Continue Watching Rail (Firestore-powered) ── */}
      {continueWatching.length > 0 && (
        <Animated.View entering={FadeInDown.duration(600)}>
          <HorizontalRail
            title="Continue Watching"
            videos={continueWatching}
            onFocusVideo={handleFocusThumbnail}
            progressMap={progressMap}
          />
        </Animated.View>
      )}
    </View>
  ), [heroVideo, continueWatching, progressMap, handleFocusThumbnail]);

  const renderRail = useCallback(({ item: cat }: { item: typeof CATEGORIES[0] }) => {
    const videos = railData[cat.label];
    if (!videos || videos.length === 0) return null;
    return (
      <View className="mb-8">
        <HorizontalRail
          title={cat.label}
          videos={videos}
          onFocusVideo={handleFocusThumbnail}
          progressMap={progressMap}
        />
      </View>
    );
  }, [railData, handleFocusThumbnail, progressMap]);

  if (isKids) return <KidsHomeScreen />;

  if (loading && Object.keys(railData).length === 0) {
    return <SingularityLoader />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <FlatList
        data={CATEGORIES}
        keyExtractor={(item) => item.label}
        renderItem={renderRail}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={2}
        windowSize={5}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={100}
        removeClippedSubviews={true}
      />
    </View>
  );
}

export default function HomeScreen() {
  return (
    <HomeErrorBoundary>
      <HomeScreenInner />
    </HomeErrorBoundary>
  );
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
