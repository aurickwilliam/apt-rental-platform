import { View } from 'react-native';
import { Skeleton } from 'heroui-native';

// Mirrors ApplicationStatusCard: thumbnail, name + status chip, location, date.
export default function ApplicationStatusCardSkeleton() {
  return (
    <View className="border border-border rounded-3xl overflow-hidden flex-row items-stretch">
      <Skeleton className="w-24 self-stretch rounded-none" />

      <View className="flex-1 gap-2 p-3">
        <View className="flex-row items-center justify-between gap-2">
          <Skeleton className="h-5 w-32 rounded-lg" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </View>
        <Skeleton className="h-3.5 w-28 rounded-md" />
        <Skeleton className="h-3.5 w-36 rounded-md" />
      </View>
    </View>
  );
}
