import { View } from 'react-native';
import { Skeleton } from 'heroui-native';

export default function ApplicationStatusCardSkeleton() {
  return (
    <View className="border border-border rounded-3xl p-4 gap-3">
      <Skeleton className="h-5 w-4/5 rounded-lg" />
      <Skeleton className="h-4 w-1/2 rounded-lg" />

      <View className="flex-row justify-between items-center mt-2">
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-4 w-16 rounded-md" />
      </View>
    </View>
  );
}