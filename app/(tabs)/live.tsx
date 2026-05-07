import { View } from 'react-native';
import { LiveGuide } from '@/components/tv/LiveGuide';

export default function LiveScreen() {
  return (
    <View className="flex-1 bg-[#030303]">
      <LiveGuide />
    </View>
  );
}
