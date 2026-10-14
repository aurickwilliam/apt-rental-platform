import { View } from "react-native";
import { Skeleton } from "heroui-native";

import { useRentalHeroHeight } from "./RentalHero";

// Mirrors the rental page: photo, payment summary, quick actions, landlord,
// maintenance.
export default function RentalsSkeleton() {
  const heroHeight = useRentalHeroHeight();

  return (
    <View className="flex gap-5">
      {/* Apartment photo with name, address and button */}
      <View className="rounded-3xl overflow-hidden" style={{ height: heroHeight }}>
        <Skeleton className="absolute inset-0 rounded-3xl" />
        <View className="absolute left-4 right-4 bottom-4 gap-2">
          <Skeleton className="h-6 w-40 rounded-lg" />
          <Skeleton className="h-3.5 w-56 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-full mt-1" />
        </View>
      </View>

      {/* Payment Summary Card — compact: header + 2 icon rows */}
      <View className="rounded-3xl p-4 border border-border gap-3 bg-surface">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="h-4 w-28 rounded-lg" />
          </View>
          <Skeleton className="h-6 w-16 rounded-full" />
        </View>
        <View className="flex-row gap-3 mt-1">
          <View className="flex-1 flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-xl" />
            <View className="gap-1.5 flex-1">
              <Skeleton className="h-2.5 w-12 rounded-md" />
              <Skeleton className="h-3.5 w-20 rounded-md" />
            </View>
          </View>
          <View className="flex-1 flex-row items-center gap-2">
            <Skeleton className="size-8 rounded-xl" />
            <View className="gap-1.5 flex-1">
              <Skeleton className="h-2.5 w-12 rounded-md" />
              <Skeleton className="h-3.5 w-16 rounded-md" />
            </View>
          </View>
        </View>
        <View className="flex-row gap-3 mt-1">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </View>
      </View>

      {/* Quick Actions */}
      <View className="flex gap-3">
        <View className="flex-row items-center gap-2">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-5 w-32 rounded-md" />
        </View>
        <View className="flex-row flex-wrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} className="w-1/4 px-2 mb-4 items-center gap-2">
              <Skeleton className="aspect-square w-full rounded-2xl" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </View>
          ))}
        </View>
      </View>

      {/* Landlord Information */}
      <View className="flex gap-3">
        <View className="flex-row items-center gap-2">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-5 w-40 rounded-md" />
        </View>
        <View className="flex-row items-center gap-3 border border-border rounded-3xl p-3">
          <Skeleton className="size-12 rounded-full" />
          <View className="flex-1 gap-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-40 rounded-md" />
          </View>
          <Skeleton className="size-10 rounded-full" />
        </View>
      </View>

      {/* Maintenance: header, recent requests, request button */}
      <View className="flex gap-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Skeleton className="size-6 rounded-md" />
            <Skeleton className="h-5 w-32 rounded-md" />
          </View>
          <Skeleton className="h-4 w-14 rounded-md" />
        </View>
        {Array.from({ length: 2 }).map((_, i) => (
          <View key={i} className="border border-border rounded-3xl p-4 gap-3 bg-surface">
            <View className="flex-row justify-between items-start gap-3">
              <View className="flex-1 gap-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-3 w-24 rounded-md" />
              </View>
              <Skeleton className="h-6 w-20 rounded-full" />
            </View>
          </View>
        ))}
        <Skeleton className="h-12 w-full rounded-full" />
      </View>
    </View>
  );
}
