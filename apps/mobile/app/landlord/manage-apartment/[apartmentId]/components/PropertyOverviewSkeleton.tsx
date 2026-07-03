import { View } from 'react-native'
import { SkeletonGroup } from 'heroui-native'

export default function PropertyOverviewSkeleton() {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="flex gap-5 mt-3">
      {/* Image strip */}
      <View className="flex-row gap-3">
        <SkeletonGroup.Item className="rounded-2xl w-36 h-52" />
        <SkeletonGroup.Item className="rounded-2xl w-36 h-52" />
        <SkeletonGroup.Item className="rounded-2xl w-36 h-52" />
      </View>

      {/* Name */}
      <SkeletonGroup.Item className="h-8 rounded-full w-2/3" />

      {/* Address */}
      <SkeletonGroup.Item className="h-4 rounded-full w-full" />
      <SkeletonGroup.Item className="h-4 rounded-full w-3/4" />

      {/* Rent */}
      <SkeletonGroup.Item className="h-6 rounded-full w-1/3" />

      {/* Spec rows */}
      <View className="flex-row gap-3">
        <SkeletonGroup.Item className="h-4 rounded-full w-1/3" />
        <SkeletonGroup.Item className="h-4 rounded-full w-1/3" />
      </View>
      <View className="flex-row gap-3">
        <SkeletonGroup.Item className="h-4 rounded-full w-1/3" />
        <SkeletonGroup.Item className="h-4 rounded-full w-1/3" />
      </View>
      <View className="flex-row gap-3">
        <SkeletonGroup.Item className="h-4 rounded-full w-1/3" />
        <SkeletonGroup.Item className="h-4 rounded-full w-1/3" />
      </View>
      <View className="flex-row gap-3">
        <SkeletonGroup.Item className="h-4 rounded-full w-1/3" />
        <SkeletonGroup.Item className="h-4 rounded-full w-1/3" />
      </View>
    </SkeletonGroup>
  )
}
