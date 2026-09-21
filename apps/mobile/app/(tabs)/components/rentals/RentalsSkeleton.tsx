import { View } from 'react-native'
import { Skeleton } from 'heroui-native'

export default function RentalsSkeleton() {
  return (
    <View className="flex gap-5">
      {/* Header */}
      <View className="flex-row items-center justify-between gap-2">
        <View className="flex-row items-center gap-2">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-7 w-36 rounded-lg" />
        </View>
        <Skeleton className="size-10 rounded-full" />
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

      {/* Apartment Description */}
      <View className="flex gap-3">
        <View className="flex-row items-center gap-2">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-5 w-48 rounded-md" />
        </View>
        <View className="w-full bg-surface rounded-3xl p-4 border border-border gap-3">
          <View className="gap-2">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-3 w-full rounded-md" />
            <Skeleton className="h-3 w-3/4 rounded-md" />
          </View>
          <View className="flex-row gap-3 mt-2">
            <View className="flex w-1/2 gap-2">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </View>
            <View className="flex w-1/2 gap-2">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </View>
          </View>
          <View className="gap-2 mt-2">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </View>
          <Skeleton className="h-9 w-full rounded-full mt-2" />
        </View>
      </View>

      {/* Maintenance Request */}
      <View className="flex gap-3">
        <View className="flex-row items-center gap-2">
          <Skeleton className="size-6 rounded-md" />
          <Skeleton className="h-5 w-52 rounded-md" />
        </View>
        <View className="border border-border rounded-3xl p-4 gap-3 bg-surface">
          <View className="flex-row justify-between items-start gap-3">
            <View className="flex-1 gap-2">
              <Skeleton className="h-4 w-32 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </View>
            <Skeleton className="h-6 w-20 rounded-full" />
          </View>
          <Skeleton className="h-3 w-40 rounded-md" />
          <Skeleton className="h-8 w-full rounded-xl" />
        </View>
        <View className="flex-row gap-3">
          <Skeleton className="h-9 flex-1 rounded-full" />
          <Skeleton className="h-9 flex-1 rounded-full" />
        </View>
      </View>
    </View>
  )
}
