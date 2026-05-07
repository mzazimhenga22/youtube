import React, { memo, useCallback } from 'react';
import { View, Text, FlatList, DimensionValue } from 'react-native';
import { VideoCard } from './VideoCard';
import { router } from 'expo-router';
import { Video } from '@/lib/youtube';

interface HorizontalRailProps {
  title: string;
  videos: Video[];
  aspectRatio?: number;
  onFocusVideo?: (thumbnail: string) => void;
  onPressVideo?: (video: Video) => void;
  cardWidth?: DimensionValue;
  progressMap?: Map<string, number>;
}

const MemoVideoCard = memo(({ 
  item, 
  index, 
  videosCount, 
  onPress, 
  onFocus, 
  aspectRatio, 
  cardWidth, 
  title, 
  progress 
}: { 
  item: Video, 
  index: number, 
  videosCount: number, 
  onPress: (video: Video) => void, 
  onFocus: (thumb: string) => void,
  aspectRatio: number,
  cardWidth?: DimensionValue,
  title: string,
  progress?: number
}) => (
  <View className="ml-6" style={index === videosCount - 1 ? { marginRight: 24 } : {}}>
    <VideoCard 
      {...item} 
      onPress={() => onPress(item)}
      aspectRatio={aspectRatio}
      onFocus={() => onFocus(item.thumbnail)}
      width={cardWidth}
      isLive={item.duration === 'LIVE' || (index === 0 && title === "Live Now")}
      progress={progress}
    />
  </View>
));

export const HorizontalRail = memo(function HorizontalRail({ 
  title, 
  videos, 
  aspectRatio = 16/9, 
  onFocusVideo,
  onPressVideo,
  cardWidth,
  progressMap
}: HorizontalRailProps) {
  const handleVideoPress = useCallback((video: Video) => {
    if (onPressVideo) {
      onPressVideo(video);
    } else {
      router.push({
        pathname: "/modal",
        params: { 
          id: video.id,
          title: video.title,
          channel: video.channel,
          views: video.views,
          thumbnail: video.thumbnail,
          duration: video.duration
        }
      });
    }
  }, [onPressVideo]);

  const handleFocus = useCallback((thumbnail: string) => {
    onFocusVideo?.(thumbnail);
  }, [onFocusVideo]);

  const renderItem = useCallback(({ item, index }: { item: Video, index: number }) => (
    <MemoVideoCard
      item={item}
      index={index}
      videosCount={videos.length}
      onPress={handleVideoPress}
      onFocus={handleFocus}
      aspectRatio={aspectRatio}
      cardWidth={cardWidth}
      title={title}
      progress={progressMap?.get(item.id)}
    />
  ), [videos.length, handleVideoPress, handleFocus, aspectRatio, cardWidth, title, progressMap]);

  return (
    <View className="mb-12">
      <View className="px-6 mb-5">
        <Text className="text-white text-[36px] font-black tracking-tighter opacity-95">{title}</Text>
      </View>
      <FlatList
        horizontal
        data={videos}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        initialNumToRender={4}
        windowSize={5}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        getItemLayout={(_, index) => ({
          length: 400, // Approximate width + margin
          offset: 400 * index,
          index,
        })}
      />
    </View>
  );
}, (prev, next) => {
  return prev.title === next.title && 
         prev.videos.length === next.videos.length &&
         prev.videos[0]?.id === next.videos[0]?.id &&
         prev.progressMap?.size === next.progressMap?.size;
});
