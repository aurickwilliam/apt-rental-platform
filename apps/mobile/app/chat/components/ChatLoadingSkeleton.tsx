import { View } from 'react-native';
import { SkeletonGroup } from 'heroui-native';

export default function ChatLoadingSkeleton() {
  return (
    <View className="flex-1 px-4 pt-4">
      <SkeletonGroup isLoading className="gap-3">
        <SkeletonGroup.Item className="h-10 w-3/5 rounded-2xl ml-auto" />
        <SkeletonGroup.Item className="h-8 w-2/4 rounded-2xl" />
        <SkeletonGroup.Item className="h-14 w-2/4 rounded-2xl ml-auto" />
        <SkeletonGroup.Item className="h-10 w-3/5 rounded-2xl" />
        <SkeletonGroup.Item className="h-9 w-1/3 rounded-2xl ml-auto" />
        <SkeletonGroup.Item className="h-12 w-4/6 rounded-2xl" />
      </SkeletonGroup>
    </View>
  );
}
