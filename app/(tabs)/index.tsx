import React, { useEffect, useState, useCallback, useMemo, Component, memo } from 'react';
import { View, Text, FlatList } from 'react-native';
import { HorizontalRail } from '@/components/tv/HorizontalRail';
import { HeroBanner } from '@/components/tv/HeroBanner';
import { youtubeService, Video } from '@/lib/youtube';
import { useAppStore } from '@/lib/store';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import KidsHomeScreen from '@/components/tv/KidsHomeScreen';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Sparkles, TrendingUp, Gamepad2, Music2, Clapperboard, Monitor, Newspaper, ChefHat, TreePine, Zap } from 'lucide-react-native';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { getContinueWatchingFromFirestore, getProgressMapFromFirestore } from '@/lib/firestore';
import { getWatchHistory } from '@/lib/db';
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

function mergeRailData(
  prev: Record<string, Video[]>,
  updates: Record<string, Video[]>
): Record<string, Video[]> {
  let next = prev;
  let changed = false;

  for (const [key, value] of Object.entries(updates)) {
    if (prev[key] !== value) {
      if (!changed) {
        next = { ...prev };
        changed = true;
      }
      next[key] = value;
    }
  }

  return next;
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

// ── Memoized Components for Extreme TV Performance ──

const CategoryChip = memo(({
  item,
  isActive,
  onSelect,
}: {
  item: typeof CATEGORIES[0];
  isActive: boolean;
  onSelect: (label: string) => void;
}) => {
  const Icon = item.icon;
  return (
    <FocusablePressable
      onPress={() => onSelect(item.label)}
      className={`flex-row items-center rounded-3xl mr-4 border-2 ${isActive ? 'bg-white border-white' : 'bg-white/5 border-transparent'}`}
      focusedClassName="bg-white scale-110 shadow-2xl shadow-white/20"
      style={{ paddingHorizontal: 28, paddingVertical: 16, gap: 12 }}
    >
      {({ isFocused }) => (
        <>
          <Icon size={24} color={isFocused || isActive ? 'black' : item.color} />
          <Text className="font-black text-2xl" style={{ color: isFocused || isActive ? 'black' : 'white' }}>{item.label}</Text>
        </>
      )}
    </FocusablePressable>
  );
}, (prev, next) => (
  prev.item.label === next.item.label &&
  prev.isActive === next.isActive &&
  prev.onSelect === next.onSelect
));

const MemoizedCategoryRail = memo(({
  activeCategory,
  onSelectCategory,
}: {
  activeCategory: string;
  onSelectCategory: (label: string) => void;
}) => (
  <View style={{ marginBottom: 40, position: 'relative' }}>
    <FlatList
      horizontal
      data={CATEGORIES}
      keyExtractor={(item) => item.label}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24 }}
      initialNumToRender={5}
      windowSize={5}
      removeClippedSubviews={false} // False is usually better for horizontal TV carousels to prevent focus loss
      extraData={activeCategory}
      renderItem={({ item }) => (
        <CategoryChip
          item={item}
          isActive={item.label === activeCategory}
          onSelect={onSelectCategory}
        />
      )}
    />
    <LinearGradient
      colors={['#0A0A0A', 'transparent']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 40, zIndex: 10, pointerEvents: 'none' }}
    />
    <LinearGradient
      colors={['transparent', '#0A0A0A']}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
      style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 40, zIndex: 10, pointerEvents: 'none' }}
    />
  </View>
), (prev, next) => (
  prev.activeCategory === next.activeCategory &&
  prev.onSelectCategory === next.onSelectCategory
));

const MemoizedHero = memo(({ videos }: { videos?: Video[] }) => {
  if (!videos || videos.length === 0) {
    return (
      <View style={{ height: 600 }} className="w-full bg-white/5 items-center justify-center">
        <Zap size={48} color="rgba(255,255,255,0.1)" />
      </View>
    );
  }
  return (
    <HeroBanner
      title={videos[0].title}
      description={videos[0].channel}
      thumbnail={videos[0].thumbnail}
      videos={videos}
    />
  );
}, (prev, next) => {
  if (!prev.videos || !next.videos) return prev.videos === next.videos;
  if (prev.videos.length !== next.videos.length) return false;
  return prev.videos[0]?.id === next.videos[0]?.id;
});

const HomeHeader = memo(({
  heroVideos,
  continueWatching,
  progressMap,
  activeCategory,
  onSelectCategory,
  onFocusVideo
}: {
  heroVideos?: Video[];
  continueWatching: Video[];
  progressMap: Map<string, number>;
  activeCategory: string;
  onSelectCategory: (label: string) => void;
  onFocusVideo: (t: string | null) => void;
}) => {
  return (
    <View>
      <MemoizedHero videos={heroVideos} />
      <MemoizedCategoryRail activeCategory={activeCategory} onSelectCategory={onSelectCategory} />
      {activeCategory === 'Recommended' && continueWatching.length > 0 && (
        <MemoizedRail
          title="Continue Watching"
          videos={continueWatching}
          progressMap={progressMap}
          onFocusVideo={onFocusVideo}
        />
      )}
    </View>
  );
}, (prev, next) => {
  return prev.heroVideos === next.heroVideos &&
         prev.continueWatching === next.continueWatching &&
         prev.progressMap === next.progressMap &&
         prev.activeCategory === next.activeCategory &&
         prev.onSelectCategory === next.onSelectCategory;
});

const MemoizedRail = memo(({
  title,
  videos,
  progressMap,
  onFocusVideo
}: {
  title: string;
  videos?: Video[];
  progressMap: Map<string, number>;
  onFocusVideo: (t: string | null) => void
}) => {
  if (!videos || videos.length === 0) return null;
  return (
    <View className="mb-8">
      <HorizontalRail
        title={title}
        videos={videos}
        onFocusVideo={onFocusVideo}
        progressMap={progressMap}
      />
    </View>
  );
}, (prev, next) => prev.videos === next.videos && prev.progressMap === next.progressMap);

// ── Main Screen ──

function HomeScreenInner() {
  const { currentProfile, setAmbientState } = useAppStore();
  const [railData, setRailData] = useState<Record<string, Video[]>>({
    "Recommended": FALLBACK_VIDEOS
  });
  const [loading, setLoading] = useState(true);
  const [continueWatching, setContinueWatching] = useState<Video[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, number>>(new Map());
  const focusTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const categoryRequestsRef = React.useRef<Set<string>>(new Set());
  const isKids = currentProfile?.mode === 'kids';
  const [gcCycle, setGcCycle] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Recommended');

  useScreenGC('Home', {
    delayMs: 30_000,
    onCleanup: useCallback(() => {
      setRailData({ 'Recommended': FALLBACK_VIDEOS });
      setContinueWatching([]);
      setProgressMap(new Map());
      categoryRequestsRef.current.clear();
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      console.log('[Home] 🧹 GC: Released rail data & thumbnails');
    }, []),
    onReactivate: useCallback(() => {
      setGcCycle(c => c + 1);
      console.log('[Home] ♻️ GC: Re-fetching data');
    }, []),
  });

  const prefetchUrls = useMemo(() => {
    if (isKids) return [] as string[];

    const urls: string[] = [];
    const seen = new Set<string>();

    const add = (url?: string) => {
      if (!url) return;
      if (seen.has(url)) return;
      seen.add(url);
      urls.push(url);
    };

    for (const v of (railData["Hero"] || []).slice(0, 5)) add(v.thumbnail);
    for (const v of continueWatching.slice(0, 12)) add(v.thumbnail);
    for (const cat of CATEGORIES.slice(0, 4)) {
      for (const v of (railData[cat.label] || []).slice(0, 6)) add(v.thumbnail);
    }

    return urls;
  }, [isKids, railData, continueWatching]);

  useEffect(() => {
    if (prefetchUrls.length > 0) {
      void Image.prefetch(prefetchUrls).catch(() => undefined);
    }
  }, [prefetchUrls]);

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

        const mergedMap = new Map(firestoreProgress);
        (localHistory as any[]).forEach((row: any) => {
          if (row.id && row.duration > 0 && !mergedMap.has(row.id)) {
            mergedMap.set(row.id, Math.min(row.time / row.duration, 1));
          }
        });
        setProgressMap(mergedMap);

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
        const [trending, home] = await Promise.all([
          safeFetch(() => youtubeService.getTrending(), [] as Video[], 'Trending'),
          safeFetch(() => youtubeService.getHomeVideos(), [] as Video[], 'Home')
        ]);

        if (cancelled) return;

        const updates: Record<string, Video[]> = {};

        if (trending.length > 0) {
          updates["Trending"] = trending;
          updates["Hero"] = trending.slice(0, 10);
        }

        updates["Recommended"] = home.length > 0 ? home : FALLBACK_VIDEOS;
        if (!updates["Hero"]) {
          updates["Hero"] = home.length > 0 ? home.slice(0, 5) : FALLBACK_VIDEOS.slice(0, 5);
        }

        setRailData(prev => mergeRailData(prev, updates));
      } finally {
        setLoading(false);
      }

      for (const cat of CATEGORIES.slice(2)) {
        if (cancelled) return;
        const videos = await safeFetch(() => youtubeService.getVideosByCategory(cat.label), [] as Video[], cat.label);
        if (!cancelled && videos.length > 0) {
          setRailData(prev => mergeRailData(prev, { [cat.label]: videos }));
          await new Promise(r => setTimeout(r, 600));
        }
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [isKids, gcCycle]);

  useEffect(() => {
    if (isKids || activeCategory === 'Recommended' || railData[activeCategory]?.length > 0) return;
    if (categoryRequestsRef.current.has(activeCategory)) return;

    let cancelled = false;
    categoryRequestsRef.current.add(activeCategory);

    async function fetchSelectedCategory() {
      const videos = activeCategory === 'Trending'
        ? await safeFetch(() => youtubeService.getTrending(), [] as Video[], 'Trending')
        : await safeFetch(() => youtubeService.getVideosByCategory(activeCategory), [] as Video[], activeCategory);

      if (!cancelled && videos.length > 0) {
        setRailData(prev => mergeRailData(prev, {
          [activeCategory]: videos,
          Hero: videos.slice(0, 10),
        }));
      }
    }

    fetchSelectedCategory();
    return () => { cancelled = true; };
  }, [activeCategory, isKids, railData, gcCycle]);

  const handleFocusThumbnail = useCallback((thumbnail: string | null) => {
    if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
    focusTimerRef.current = setTimeout(() => {
      setAmbientState(thumbnail, '#FFFFFF');
    }, 300);
  }, [setAmbientState]);

  const handleSelectCategory = useCallback((label: string) => {
    setActiveCategory(label);
  }, []);

  const visibleCategories = useMemo(() => {
    if (activeCategory === 'Recommended') return CATEGORIES;
    return CATEGORIES.filter(category => category.label === activeCategory);
  }, [activeCategory]);

  const heroVideos = useMemo(() => {
    if (activeCategory === 'Recommended') return railData["Hero"];
    return railData[activeCategory] || railData["Hero"];
  }, [activeCategory, railData]);

  const renderHeader = useCallback(() => (
    <HomeHeader
      heroVideos={heroVideos}
      continueWatching={continueWatching}
      progressMap={progressMap}
      activeCategory={activeCategory}
      onSelectCategory={handleSelectCategory}
      onFocusVideo={handleFocusThumbnail}
    />
  ), [heroVideos, continueWatching, progressMap, activeCategory, handleSelectCategory, handleFocusThumbnail]);

  const renderRail = useCallback(({ item: cat }: { item: typeof CATEGORIES[0] }) => {
    return (
      <MemoizedRail
        title={cat.label}
        videos={railData[cat.label]}
        progressMap={progressMap}
        onFocusVideo={handleFocusThumbnail}
      />
    );
  }, [railData, progressMap, handleFocusThumbnail]);

  if (isKids) return <KidsHomeScreen />;

  if (loading && !railData["Hero"]) {
    return <SingularityLoader />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A' }}>
      <FlatList
        data={visibleCategories}
        keyExtractor={(item) => item.label}
        renderItem={renderRail}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        initialNumToRender={2}
        windowSize={3}
        maxToRenderPerBatch={2}
        updateCellsBatchingPeriod={150}
        removeClippedSubviews={false}
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
