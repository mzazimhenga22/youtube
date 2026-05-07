import React, { useMemo, memo } from 'react';
import { View, Text, useWindowDimensions, StyleSheet, Image } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { Sidebar } from '@/components/tv/Sidebar';
import { useAppStore } from '@/lib/store';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Mic, Search as SearchIcon, Music2, Clapperboard, Radio, Sparkles, User } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';

/* ═══════════════════════════════════════════════════════════
 * TV Tab Layout — Flex-based for proper remote navigation
 * 
 * Structure:
 *  ┌────────────────────────────────────────────────┐
 *  │                 SOLID HEADER                   │
 *  ├─────┬──────────────────────────────────┬───────┤
 *  │  L  │                                  │   R   │
 *  │  S  │          CONTENT (Tabs)          │   S   │
 *  │  I  │                                  │   I   │
 *  │  D  │                                  │   D   │
 *  │  E  │                                  │   E   │
 *  │  B  │                                  │   B   │
 *  │  A  │                                  │   A   │
 *  │  R  │                                  │   R   │
 *  └─────┴──────────────────────────────────┴───────┘
 *
 * D-pad Left from content → Left sidebar items
 * D-pad Right from content → Right sidebar items
 * D-pad Up from top content → Header buttons
 * ═══════════════════════════════════════════════════════════ */

export default function TabLayout() {
  const { currentProfile } = useAppStore();
  const { width: screenWidth } = useWindowDimensions();
  const pathname = usePathname();

  const isKids = currentProfile?.mode === 'kids';
  const isSearch = pathname.includes('search');

  const screenTheme = useMemo(() => {
    if (pathname.includes('music')) return { label: 'Music', icon: Music2, color: '#FF0055' };
    if (pathname.includes('movies')) return { label: 'Movies', icon: Clapperboard, color: '#FF4444' };
    if (pathname.includes('live')) return { label: 'Live', icon: Radio, color: '#FF0000' };
    if (pathname.includes('shorts')) return { label: 'Shorts', icon: Radio, color: '#FF4400' };
    return { label: 'YouTube', icon: Sparkles, color: '#FFFFFF' };
  }, [pathname]);

  return (
    <View style={styles.root}>
      {/* ── SOLID HEADER BAR ── */}
      {!isKids && !isSearch && (
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          {/* Red accent line at top */}
          <View style={styles.headerAccentLine} />

          {/* Left: Branding */}
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              <View style={styles.playTriangle} />
            </View>
            <Text style={styles.logoText}>YouTube</Text>
            {screenTheme.label !== 'YouTube' && (
              <View style={[styles.themeBadge, { backgroundColor: `${screenTheme.color}18`, borderColor: `${screenTheme.color}30` }]}>
                <Text style={[styles.themeBadgeText, { color: screenTheme.color }]}>{screenTheme.label}</Text>
              </View>
            )}
          </View>

          {/* Right: Action buttons */}
          <View style={styles.headerRight}>
            <FocusablePressable
              nativeID="header-search"
              style={styles.headerBtn}
              focusedClassName="bg-white/15 scale-110"
              onPress={() => router.push('/search' as any)}
            >
              {({ isFocused }) => (
                <SearchIcon size={18} color={isFocused ? '#FFFFFF' : '#A1A1AA'} strokeWidth={isFocused ? 2.5 : 2} />
              )}
            </FocusablePressable>

            <FocusablePressable
              nativeID="header-mic"
              style={styles.headerBtn}
              focusedClassName="bg-white/15 scale-110"
            >
              {({ isFocused }) => (
                <Mic size={18} color={isFocused ? '#FFFFFF' : '#A1A1AA'} strokeWidth={isFocused ? 2.5 : 2} />
              )}
            </FocusablePressable>

            <FocusablePressable
              nativeID="header-avatar"
              style={styles.avatarBtn}
              focusedClassName="border-white scale-110"
              onPress={() => router.push('/profile' as any)}
            >
              {currentProfile?.avatar ? (
                <Image source={{ uri: currentProfile.avatar }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={16} color="#A1A1AA" />
                </View>
              )}
            </FocusablePressable>
          </View>
        </Animated.View>
      )}

      {/* ── MAIN CONTENT ROW: [LeftSidebar | Content | RightSidebar] ── */}
      <View style={styles.contentRow}>
        {/* Left Sidebar — in flex flow for focus navigation */}
        {!isKids && !isSearch && <Sidebar side="left" />}

        {/* Content Area */}
        <View style={styles.contentArea}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
            }}
          />
        </View>

        {/* Right Sidebar — in flex flow for focus navigation */}
        {!isKids && !isSearch && <Sidebar side="right" />}
      </View>
    </View>
  );
}

/* ── Styles ── */
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  /* ─ Header ─ */
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    margin: 20,
    marginBottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 200,
    overflow: 'hidden',
  },
  headerAccentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF0000',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'white',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  logoText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 22,
    letterSpacing: -1,
  },
  themeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  themeBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    marginLeft: 6,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
    backgroundColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ─ Content ─ */
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 12, // Space below floating header
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 12, // Space from floating sidebars
  },
});
