import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { useAppStore } from '@/lib/store';
import { FocusablePressable } from './FocusablePressable';
import { Play, Pause, X, Maximize2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useGlobalPlayer } from '@/lib/PlayerContext';

export const MiniPlayer = memo(() => {
  const { 
    globalVideo, 
    isGlobalPlaying, 
    globalProgress, 
    setGlobalPlaying, 
    setGlobalPlayback 
  } = useAppStore();
  const { player } = useGlobalPlayer();

  const handleTogglePlay = useCallback(() => {
    if (isGlobalPlaying) {
      player.pause();
      setGlobalPlaying(false);
    } else {
      player.play();
      setGlobalPlaying(true);
    }
  }, [isGlobalPlaying, player, setGlobalPlaying]);

  const handleOpenFull = useCallback(() => {
    if (!globalVideo) return;
    router.push({
      pathname: '/modal',
      params: { 
        id: globalVideo.id,
        title: globalVideo.title,
        channel: globalVideo.channel,
        thumbnail: globalVideo.thumbnail,
        type: 'music'
      }
    });
  }, [globalVideo]);

  const handleClose = useCallback(() => {
    player.pause();
    setGlobalPlayback(null, null);
  }, [player, setGlobalPlayback]);

  if (!globalVideo) return null;

  return (
    <Animated.View 
      entering={FadeInUp.duration(400)} 
      exiting={FadeOutDown.duration(300)}
      style={styles.container}
    >
      <LinearGradient
        colors={['rgba(28,28,30,0.95)', 'rgba(18,18,18,0.98)']}
        style={StyleSheet.absoluteFill}
        className="rounded-3xl"
      />
      
      <View style={styles.content}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          <Image source={{ uri: globalVideo.thumbnail }} style={styles.thumbnail} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{globalVideo.title}</Text>
          <Text style={styles.channel} numberOfLines={1}>{globalVideo.channel}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <FocusablePressable
            onPress={handleTogglePlay}
            className="w-12 h-12 items-center justify-center rounded-full"
            focusedClassName="bg-white/20 scale-110"
          >
            {isGlobalPlaying ? <Pause size={24} color="white" fill="white" /> : <Play size={24} color="white" fill="white" />}
          </FocusablePressable>

          <FocusablePressable
            onPress={handleOpenFull}
            className="w-12 h-12 items-center justify-center rounded-full"
            focusedClassName="bg-white/20 scale-110"
          >
            <Maximize2 size={22} color="white" />
          </FocusablePressable>

          <View style={styles.divider} />

          <FocusablePressable
            onPress={handleClose}
            className="w-12 h-12 items-center justify-center rounded-full"
            focusedClassName="bg-red-500 scale-110"
          >
            <X size={22} color="white" />
          </FocusablePressable>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${globalProgress * 100}%` }]} />
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    width: 600,
    height: 90,
    zIndex: 1000,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  thumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    marginLeft: 20,
    justifyContent: 'center',
  },
  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  channel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 8,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF0000',
  },
});
