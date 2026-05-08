import React, { useState, memo, useCallback } from 'react';
import { View, Image, Text, useWindowDimensions, ScrollView, StyleSheet } from 'react-native';
import {
  Search,
  Home,
  Settings,
  Library,
  Radio,
  Tv,
  ListVideo,
  Film,
  Music,
  User,
} from 'lucide-react-native';
import { FocusablePressable } from './FocusablePressable';
import { useRouter, usePathname } from 'expo-router';
import { useAppStore } from '@/lib/store';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming,
} from 'react-native-reanimated';
import { Easing } from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';

const LEFT_NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/', id: 'home' },
  { icon: Film, label: 'Shorts', path: '/shorts', id: 'shorts' },
  { icon: Music, label: 'Music', path: '/music', id: 'music' },
  { icon: Radio, label: 'Live', path: '/live-guide', id: 'live-guide' },
  { icon: Tv, label: 'Movies', path: '/movies', id: 'movies' },
];

const RIGHT_NAV_ITEMS = [
  { icon: ListVideo, label: 'Subscriptions', path: '/subscriptions', id: 'subscriptions' },
  { icon: Library, label: 'Library', path: '/library', id: 'library' },
];

/* ─── Solid-background sidebar for TV remote navigation ─── */
export function Sidebar({ side = 'left' }: { side?: 'left' | 'right' }) {
  const { currentProfile } = useAppStore();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const pathname = usePathname();

  const isSmallScreen = screenWidth < 768;
  const COLLAPSED_WIDTH = isSmallScreen ? 64 : 80;
  const EXPANDED_WIDTH = isSmallScreen ? 220 : 250;

  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarWidth = useSharedValue(COLLAPSED_WIDTH);

  const expand = useCallback(() => {
    setIsExpanded(true);
    sidebarWidth.value = withTiming(EXPANDED_WIDTH, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [EXPANDED_WIDTH]);

  const collapse = useCallback(() => {
    setIsExpanded(false);
    sidebarWidth.value = withTiming(COLLAPSED_WIDTH, { duration: 180, easing: Easing.inOut(Easing.quad) });
  }, [COLLAPSED_WIDTH]);

  const sidebarStyle = useAnimatedStyle(() => ({
    width: sidebarWidth.value,
  }));

  const isActive = useCallback((path: string) => {
    if (path === '/') return pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    return pathname.includes(path);
  }, [pathname]);

  const navItems = side === 'left' ? LEFT_NAV_ITEMS : RIGHT_NAV_ITEMS;

  return (
    /*
     * Outer container — sized to EXPANDED_WIDTH so all focusable items
     * remain inside the container even when expanded.
     * pointerEvents="box-none" ensures the transparent area doesn't
     * block touch/focus from reaching the content beneath.
     */
    <View
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        [side]: 0,
        width: EXPANDED_WIDTH + 40,
        zIndex: 150,
      }}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          sidebarStyle,
          {
            position: 'absolute',
            top: 40,
            bottom: 40,
            [side]: 20,
            /* No overflow:hidden — critical for TV focus engine.
               Clipping is handled by borderRadius on individual items. */
            backgroundColor: 'transparent',
            borderRadius: 32,
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingTop: isSmallScreen ? 30 : 40, // Increased by 10px
            paddingBottom: isSmallScreen ? 20 : 30,
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
          /* Allow focus to escape the ScrollView when pressing
             LEFT/RIGHT — critical for TV sidebar-to-content traversal */
          nestedScrollEnabled={false}
        >
          {/* ── Profile avatar (left sidebar only) ── */}
          {side === 'left' && (
            <View style={{ marginTop: 10, marginBottom: 24 }}>
              <FocusablePressable
                onPress={() => router.push('/profile' as any)}
                onFocus={expand}
                onBlur={collapse}
                nativeID="sidebar-left-profile"
                style={{
                  width: isSmallScreen ? 48 : 56,
                  height: isSmallScreen ? 48 : 56,
                  borderRadius: 28,
                  overflow: 'hidden',
                  borderWidth: 3,
                  borderColor: 'rgba(255,255,255,0.15)',
                  backgroundColor: '#181818', // Solid dark background
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                focusedClassName="border-white scale-110 shadow-2xl"
              >
                {currentProfile?.avatar ? (
                  <Image
                    source={typeof currentProfile.avatar === 'string' ? { uri: currentProfile.avatar } : currentProfile.avatar}
                    style={{ width: '100%', height: '100%' }}
                  />
                ) : (
                  <User size={isSmallScreen ? 24 : 28} color="white" />
                )}
              </FocusablePressable>
            </View>
          )}

          {/* ── Search (right sidebar only) ── */}
          {side === 'right' && (
            <View style={{ marginTop: 10 }}>
              <SidebarItem
                icon={Search}
                label="Search"
                isActive={pathname.includes('/search')}
                isExpanded={isExpanded}
                onPress={() => router.push('/search' as any)}
                onFocus={expand}
                onBlur={collapse}
                isSmall={isSmallScreen}
                side={side}
                nativeID="sidebar-right-search"
              />
            </View>
          )}

          {/* Divider - Minimalist */}
          <View style={{
            height: 2,
            width: isExpanded ? '60%' : 24,
            backgroundColor: 'rgba(255,255,255,0.08)',
            marginVertical: 16,
            borderRadius: 1,
          }} />

          {/* ── Nav items ── */}
          <View style={{ width: '100%' }}>
            {navItems.map((item) => (
              <SidebarItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                isActive={isActive(item.path)}
                isExpanded={isExpanded}
                onPress={() => router.push(item.path as any)}
                onFocus={expand}
                onBlur={collapse}
                isSmall={isSmallScreen}
                side={side}
                nativeID={`sidebar-${side}-${item.id}`}
              />
            ))}
          </View>

          <View style={{ flex: 1, minHeight: 20 }} />

          {/* ── Settings (right sidebar only) ── */}
          {side === 'right' && (
            <SidebarItem
              icon={Settings}
              label="Settings"
              isActive={pathname.includes('/settings')}
              isExpanded={isExpanded}
              onPress={() => router.push('/settings' as any)}
              onFocus={expand}
              onBlur={collapse}
              isSmall={isSmallScreen}
              side={side}
              nativeID="sidebar-right-settings"
            />
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

/* ─── Individual sidebar nav item ─── */
const SidebarItem = memo(({
  icon: Icon, label, isActive, isExpanded, onPress, onFocus, onBlur, isSmall, side, nativeID,
}: {
  icon: any; label: string; isActive: boolean; isExpanded: boolean;
  onPress: () => void; onFocus: () => void; onBlur: () => void;
  isSmall?: boolean; side?: 'left' | 'right'; nativeID?: string;
}) => (
  <FocusablePressable
    onPress={onPress}
    onFocus={onFocus}
    onBlur={onBlur}
    nativeID={nativeID}
    activeScale={0.96}
    style={{
      flexDirection: isExpanded ? (side === 'right' ? 'row-reverse' : 'row') : 'column',
      alignItems: 'center',
      paddingVertical: isExpanded ? (isSmall ? 14 : 16) : (isSmall ? 12 : 14),
      paddingHorizontal: isExpanded ? (isSmall ? 16 : 24) : 0,
      width: isExpanded ? '92%' : (isSmall ? 48 : 60),
      alignSelf: 'center',
      borderRadius: 24,
      marginVertical: 6,
      marginHorizontal: isExpanded ? 8 : 4,
      /* Solid backgrounds for the buttons themselves */
      backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : '#181818',
      borderWidth: 1,
      borderColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)',
      /* Individual items clip their own content — NOT the parent */
      overflow: 'hidden',
    }}
    focusedClassName="bg-white scale-105 shadow-2xl"
  >
    {({ isFocused }) => (
      <>
        {/* Active indicator bar - Vertical Glowing Line */}
        {isActive && !isFocused && (
          <View
            style={{
              position: 'absolute',
              [side === 'right' ? 'right' : 'left']: 0,
              top: '25%',
              bottom: '25%',
              width: 4,
              borderRadius: 2,
              backgroundColor: '#FF0000',
              shadowColor: '#FF0000',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 8,
            }}
          />
        )}

        <View style={{ width: 28, alignItems: 'center', justifyContent: 'center' }}>
          <Icon
            size={isExpanded ? (isSmall ? 22 : 24) : (isSmall ? 24 : 26)}
            color={isFocused ? '#000000' : (isActive ? '#FFFFFF' : '#A1A1AA')}
            strokeWidth={isActive || isFocused ? 2.5 : 2}
            fill={isActive && !isFocused && Icon !== Search ? 'white' : 'none'}
          />
        </View>

        {isExpanded ? (
          <Text
            style={{
              fontSize: isSmall ? 16 : 18,
              color: isFocused ? '#000000' : (isActive ? '#FFFFFF' : '#A1A1AA'),
              fontWeight: '900',
              letterSpacing: -0.4,
              [side === 'right' ? 'marginRight' : 'marginLeft']: 16,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : (
          !isSmall && (
            <Text
              style={{
                fontSize: 10,
                color: isFocused ? '#000000' : (isActive ? '#FFFFFF' : '#71717A'),
                fontWeight: '900',
                textTransform: 'uppercase',
                letterSpacing: 1.2,
                marginTop: 6,
              }}
              numberOfLines={1}
            >
              {label}
            </Text>
          )
        )}
      </>
    )}
  </FocusablePressable>
));
