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
    /* Fixed-width slot in the flex row — sidebar overlays content when expanded */
    <View style={{ width: COLLAPSED_WIDTH, zIndex: 120 }}>
      <Animated.View
        style={[
          sidebarStyle,
          {
            position: 'absolute',
            top: 20,
            bottom: 20,
            [side]: 12,
            backgroundColor: 'rgba(12, 12, 12, 0.92)',
            /* Soft rounded corners for modern floating look */
            borderRadius: 32,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.06)',
            overflow: 'hidden',
          },
        ]}
      >
        {/* Subtle Side Aura */}
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.03)', 'transparent']}
          start={{ x: side === 'left' ? 0 : 1, y: 0.5 }}
          end={{ x: side === 'left' ? 1 : 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            alignItems: 'center',
            paddingVertical: isSmallScreen ? 20 : 30,
          }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={isExpanded}
        >
          {/* ── Profile avatar (left sidebar only) ── */}
          {side === 'left' && (
            <FocusablePressable
              onPress={() => router.push('/profile' as any)}
              onFocus={expand}
              onBlur={collapse}
              nativeID="sidebar-left-profile"
              style={{
                width: isSmallScreen ? 36 : 42,
                height: isSmallScreen ? 36 : 42,
                borderRadius: 21,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: 'transparent',
                marginBottom: 16,
              }}
              focusedClassName="border-white scale-110"
            >
              {currentProfile?.avatar ? (
                <Image source={{ uri: currentProfile.avatar }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <View style={{ width: '100%', height: '100%', backgroundColor: '#1F1F1F', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={isSmallScreen ? 18 : 20} color="white" />
                </View>
              )}
            </FocusablePressable>
          )}

          {/* ── Search (right sidebar only) ── */}
          {side === 'right' && (
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
          )}

          {/* Divider */}
          <View style={{
            height: 1,
            width: isExpanded ? '75%' : isSmallScreen ? 28 : 36,
            backgroundColor: 'rgba(255,255,255,0.06)',
            marginVertical: 10,
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
      paddingVertical: isExpanded ? (isSmall ? 12 : 14) : (isSmall ? 10 : 12),
      paddingHorizontal: isExpanded ? (isSmall ? 16 : 24) : 0,
      width: isExpanded ? '88%' : (isSmall ? 44 : 54),
      alignSelf: 'center',
      borderRadius: 20,
      marginVertical: 4,
      marginHorizontal: isExpanded ? 10 : 4,
      backgroundColor: isActive && !isExpanded ? 'rgba(255,255,255,0.06)' : 'transparent',
      overflow: 'hidden',
    }}
    focusedClassName="bg-white/10"
  >
    {({ isFocused }) => (
      <>
        {/* Active indicator bar */}
        {isActive && (
          <View
            style={{
              position: 'absolute',
              [side === 'right' ? 'right' : 'left']: 0,
              top: '20%',
              bottom: '20%',
              width: 3,
              borderRadius: 2,
              backgroundColor: '#FF0000',
            }}
          />
        )}

        <View style={{ width: 26, alignItems: 'center', justifyContent: 'center' }}>
          <Icon
            size={isExpanded ? (isSmall ? 20 : 21) : (isSmall ? 22 : 23)}
            color={isActive ? '#FFFFFF' : isFocused ? '#E4E4E7' : '#71717A'}
            strokeWidth={isActive || isFocused ? 2.5 : 1.8}
            fill={isActive && Icon !== Search ? 'white' : 'none'}
          />
        </View>

        {isExpanded ? (
          <Text
            style={{
              fontSize: isSmall ? 15 : 16,
              color: isActive ? '#FFFFFF' : isFocused ? '#E4E4E7' : '#A1A1AA',
              fontWeight: isActive ? '900' : '700',
              letterSpacing: -0.3,
              [side === 'right' ? 'marginRight' : 'marginLeft']: 14,
            }}
            numberOfLines={1}
          >
            {label}
          </Text>
        ) : (
          !isSmall && (
            <Text
              style={{
                fontSize: 9,
                color: isActive ? '#FFFFFF' : isFocused ? '#A1A1AA' : '#52525B',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginTop: 5,
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
