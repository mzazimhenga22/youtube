import React, { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { View, Text, FlatList, Image, Dimensions, StyleSheet, useWindowDimensions } from 'react-native';
import { youtubeService, Video } from '@/lib/youtube';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Delete, Search as SearchIcon, X, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInRight, FadeInDown } from 'react-native-reanimated';
import { SingularityLoader } from '@/components/tv/SingularityLoader';
import { useScreenGC } from '@/lib/useScreenGC';
import { VideoCard } from '@/components/tv/VideoCard';
import { playVideo } from '@/lib/navigation';

const KEYBOARD_KEYS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9', '0'],
  ['&', '@', '.', '-', '_', '/'],
  ['SPACE', 'BACK', 'CLEAR']
];

const QUICK_CHIPS = ['Music', 'Gaming', 'News', 'Movies', 'Shorts', 'Live'];

/* ─── Memoized keyboard key to prevent re-renders when results update ─── */
const KeyboardKey = memo(({
  keyLabel,
  isControl,
  isPreferred,
  onPress,
}: {
  keyLabel: string;
  isControl: boolean;
  isPreferred: boolean;
  onPress: () => void;
}) => (
  <FocusablePressable
    onPress={onPress}
    hasTVPreferredFocus={isPreferred}
    className={isControl ? 'flex-1 mx-1' : 'w-[64px] mx-0.5'}
    style={{ height: 56 }}
    activeScale={1.15}
  >
    {({ isFocused }) => (
      <View style={{
        flex: 1,
        backgroundColor: isFocused ? '#CC0000' : 'rgba(255,255,255,0.04)',
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: isFocused ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.04)',
      }}>
        {keyLabel === 'BACK' ? (
          <Delete size={22} color={isFocused ? "white" : "#71717A"} strokeWidth={2.5} />
        ) : (
          <Text style={{
            fontSize: isControl ? 13 : 22,
            fontWeight: '900',
            color: isFocused ? 'white' : '#71717A',
            letterSpacing: isControl ? 1.5 : -0.5,
          }}>{keyLabel}</Text>
        )}
      </View>
    )}
  </FocusablePressable>
), (prev, next) => prev.keyLabel === next.keyLabel && prev.isPreferred === next.isPreferred);

/* ─── Memoized Quick Chip ─── */
const QuickChip = memo(({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) => (
  <FocusablePressable
    onPress={onPress}
    className="rounded-2xl bg-white/5 border border-white/5"
    focusedClassName="bg-white border-white scale-105"
    style={{ paddingHorizontal: 18, paddingVertical: 10 }}
  >
    {({ isFocused }) => (
      <Text style={{
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: -0.3,
        color: isFocused ? 'black' : '#71717A',
      }}>{label}</Text>
    )}
  </FocusablePressable>
), (prev, next) => prev.label === next.label);

/* ─── Memoized Result Card wrapper — prevents keyboard focus theft ─── */
const SearchResultCard = memo(({ item, cardWidth }: { item: Video; cardWidth: number }) => (
  <View style={{ width: cardWidth, marginBottom: 24 }}>
    <VideoCard
      {...item}
      onPress={() => playVideo(item)}
      width="100%"
    />
  </View>
), (prev, next) => prev.item.id === next.item.id && prev.cardWidth === next.cardWidth);


export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [gcCycle, setGcCycle] = useState(0);
  const { width: screenWidth } = useWindowDimensions();

  const KEYBOARD_WIDTH = screenWidth < 768 ? 380 : 480;
  const RESULTS_PADDING = 48;
  const CARD_COLUMNS = screenWidth < 768 ? 2 : 3;
  const CARD_GAP = 20;
  const availableWidth = screenWidth - KEYBOARD_WIDTH - RESULTS_PADDING * 2;
  const cardWidth = (availableWidth - CARD_GAP * (CARD_COLUMNS - 1)) / CARD_COLUMNS;

  // ── Screen Garbage Collector ──
  useScreenGC('Search', {
    delayMs: 30_000,
    onCleanup: useCallback(() => {
      setResults([]);
      setQuery('');
      setHasSearched(false);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      console.log('[Search] 🧹 GC: Released search results');
    }, []),
    onReactivate: useCallback(() => {
      setGcCycle(c => c + 1);
      console.log('[Search] ♻️ GC: Re-fetching initial data');
    }, []),
  });

  useEffect(() => {
    let cancelled = false;
    async function fetchInitial() {
      const data = await youtubeService.getHomeVideos();
      if (!cancelled) setResults(data);
    }
    fetchInitial();
    return () => { cancelled = true; };
  }, [gcCycle]);

  const performSearch = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await youtubeService.search(searchTerm);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * CRITICAL for TV: handleKeyPress is stable (useCallback) so the
   * memoized KeyboardKey components don't re-render when results change.
   * This prevents the results FlatList from stealing D-pad focus.
   */
  const handleKeyPress = useCallback((key: string) => {
    setQuery(prev => {
      let newQuery = prev;
      if (key === 'BACK') newQuery = prev.slice(0, -1);
      else if (key === 'SPACE') newQuery = prev + ' ';
      else if (key === 'CLEAR') newQuery = '';
      else newQuery = prev + key;

      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(newQuery);
      }, 800);

      return newQuery;
    });
  }, [performSearch]);

  const handleChipPress = useCallback((chip: string) => {
    setQuery(chip);
    performSearch(chip);
  }, [performSearch]);

  const renderVideoItem = useCallback(({ item }: { item: Video }) => (
    <SearchResultCard item={item} cardWidth={cardWidth} />
  ), [cardWidth]);

  /* Stable key extractor */
  const keyExtractor = useCallback((item: Video, index: number) => `${item.id}-${index}`, []);

  return (
    <View style={styles.container}>
      {/* ── AMBIENT BACKGROUND ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient colors={['#050505', '#0f0f0f']} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(255, 0, 0, 0.05)', 'transparent']}
          style={{ position: 'absolute', top: 0, left: 0, width: 500, height: 500 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(255, 255, 255, 0.02)']}
          style={{ position: 'absolute', bottom: 0, right: 0, width: 600, height: 600 }}
        />
      </View>

      <View style={styles.mainRow}>
        {/* ══════════ LEFT: KEYBOARD PANEL ══════════ */}
        <View style={[styles.keyboardPanel, { width: KEYBOARD_WIDTH }]}>
          {/* Query Display Bar */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.queryBar}>
            <SearchIcon size={22} color={query ? "#FFFFFF" : "#3F3F46"} strokeWidth={3} />
            <Text
              style={[styles.queryText, { color: query ? '#FFFFFF' : '#3F3F46' }]}
              numberOfLines={1}
            >
              {query || 'Search YouTube...'}
            </Text>
            {query.length > 0 && (
              <FocusablePressable
                onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}
                style={styles.clearBtn}
                focusedClassName="bg-white/20"
                activeScale={0.9}
              >
                <X size={20} color="white" strokeWidth={3} />
              </FocusablePressable>
            )}
            {query.length > 0 && (
              <FocusablePressable
                onPress={() => performSearch(query)}
                style={styles.searchSubmitBtn}
                focusedClassName="bg-red-600 scale-105"
                activeScale={0.95}
              >
                {({ isFocused }) => (
                  <ArrowRight size={20} color={isFocused ? 'white' : '#A1A1AA'} strokeWidth={3} />
                )}
              </FocusablePressable>
            )}
          </Animated.View>

          {/* ── On-screen Keyboard ── */}
          <View style={styles.keyboardGrid}>
            {KEYBOARD_KEYS.map((row, rIdx) => (
              <View key={rIdx} style={styles.keyboardRow}>
                {row.map((key) => {
                  const isControl = ['SPACE', 'BACK', 'CLEAR'].includes(key);
                  return (
                    <KeyboardKey
                      key={key}
                      keyLabel={key}
                      isControl={isControl}
                      isPreferred={rIdx === 0 && key === 'A'}
                      onPress={() => handleKeyPress(key)}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          {/* ── Quick Suggestions ── */}
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsLabel}>Quick Search</Text>
            <View style={styles.chipsRow}>
              {QUICK_CHIPS.map(chip => (
                <QuickChip
                  key={chip}
                  label={chip}
                  onPress={() => handleChipPress(chip)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* ── Vertical divider ── */}
        <View style={styles.divider} />

        {/* ══════════ RIGHT: RESULTS ══════════ */}
        <View style={styles.resultsPanel}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <SingularityLoader transparent minimal />
            </View>
          ) : (
            <>
              {/* Results Header */}
              <View style={styles.resultsHeader}>
                <View style={styles.headerLine} />
                <Text style={styles.headerLabel}>
                  {hasSearched ? `Results for "${query}"` : 'Trending'}
                </Text>
                <View style={styles.headerLine} />
              </View>

              {/* Results Grid — focusable={false} on the wrapper prevents
                  the FlatList from pulling D-pad focus away from keyboard */}
              <FlatList
                data={results}
                keyExtractor={keyExtractor}
                renderItem={renderVideoItem}
                numColumns={CARD_COLUMNS}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={{ gap: CARD_GAP }}
                contentContainerStyle={{ paddingBottom: 150, paddingHorizontal: 12 }}
                initialNumToRender={6}
                windowSize={5}
                maxToRenderPerBatch={6}
                removeClippedSubviews={false}
                /* CRITICAL: Don't let results list steal keyboard focus on data change */
                maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  mainRow: {
    flex: 1,
    flexDirection: 'row',
  },
  keyboardPanel: {
    paddingHorizontal: 28,
    paddingTop: 40,
    paddingBottom: 20,
    justifyContent: 'flex-start',
  },
  queryBar: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    height: 68,
    borderRadius: 22,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  queryText: {
    marginLeft: 14,
    fontSize: 24,
    fontWeight: '900',
    flex: 1,
    letterSpacing: -0.8,
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  searchSubmitBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 6,
  },
  keyboardGrid: {
    marginBottom: 20,
  },
  keyboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  suggestionsContainer: {
    marginTop: 'auto',
    paddingBottom: 32,
  },
  suggestionsLabel: {
    color: '#3F3F46',
    fontWeight: '900',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 11,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginVertical: 60,
  },
  resultsPanel: {
    flex: 1,
    paddingTop: 40,
    paddingRight: 24,
    paddingLeft: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  headerLine: {
    height: 1,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerLabel: {
    color: '#52525B',
    fontWeight: '900',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginHorizontal: 16,
  },
});
