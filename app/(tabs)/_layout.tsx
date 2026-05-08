import React, { useMemo, memo, useCallback, useRef, useEffect } from 'react';
import { View, Text, useWindowDimensions, StyleSheet, Image, findNodeHandle } from 'react-native';
import { Tabs, usePathname } from 'expo-router';
import { Sidebar } from '@/components/tv/Sidebar';
import { useAppStore } from '@/lib/store';
import { FocusablePressable } from '@/components/tv/FocusablePressable';
import { Mic, Search as SearchIcon, Music2, Clapperboard, Radio, Sparkles, User } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MiniPlayer } from '@/components/tv/MiniPlayer';

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
      {/* ── FLOATING HEADER PODS ── */}
      {!isKids && !isSearch && (
        <>
          {/* Left Pod: Branding */}
          <Animated.View 
            entering={FadeIn.duration(500).delay(100)} 
            style={[styles.floatingPod, styles.headerLeftPod]}
          >
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
          </Animated.View>

          {/* Right Pod: Action buttons */}
          <Animated.View 
            entering={FadeIn.duration(500).delay(200)} 
            style={[styles.floatingPod, styles.headerRightPod]}
          >
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
                  <Image
                    source={typeof currentProfile.avatar === 'string' ? { uri: currentProfile.avatar } : currentProfile.avatar}
                    style={styles.avatarImg}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <User size={16} color="#A1A1AA" />
                  </View>
                )}
              </FocusablePressable>
            </View>
          </Animated.View>
        </>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <View style={styles.contentRow}>
        {/* Left focus guide strip — catches D-pad LEFT from content,
            sidebar items are directly to the left of this strip */}
        {!isKids && !isSearch && (
          <View
            style={styles.focusGuideLeft}
            pointerEvents="box-none"
          />
        )}

        <View style={styles.contentArea}>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarStyle: { display: 'none' },
              animation: 'fade', // Smoother native fade transition
              freezeOnBlur: true, // Optimizes background screens
            }}
          />
        </View>

        {/* Right focus guide strip */}
        {!isKids && !isSearch && (
          <View
            style={styles.focusGuideRight}
            pointerEvents="box-none"
          />
        )}
      </View>

      {/* ── OVERLAY MINI PLAYER ── */}
      <MiniPlayer />

      {/* ── OVERLAY SIDEBARS ── */}
      {!isKids && !isSearch && (
        <>
          <Sidebar side="left" />
          <Sidebar side="right" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  floatingPod: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 18, 0.5)',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 200,
    paddingHorizontal: 20,
  },
  headerLeftPod: {
    position: 'absolute',
    top: 24,
    left: 24,
  },
  headerRightPod: {
    position: 'absolute',
    top: 24,
    right: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  contentRow: {
    flex: 1,
    flexDirection: 'row',
  },
  focusGuideLeft: {
    width: 100,
    /* This column occupies the same space as the collapsed left sidebar,
       ensuring the focus engine sees the sidebar items as 'inside' the
       natural left boundary of the layout. */
  },
  focusGuideRight: {
    width: 100,
  },
  contentArea: {
    flex: 1,
  },
});
