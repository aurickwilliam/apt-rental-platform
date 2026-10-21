import { View } from 'react-native'
import { SkeletonGroup } from 'heroui-native'

export default function NotificationRowSkeleton() {
  return (
    <SkeletonGroup isLoading isSkeletonOnly>
      <View className="flex-row items-start gap-3 px-3 py-3">
        <SkeletonGroup.Item className="h-12 w-12 rounded-full shrink-0" />

        <View className="flex-1 gap-2">
          <SkeletonGroup.Item className="h-4 w-3/4 rounded-md" />
          <SkeletonGroup.Item className="h-3.5 w-1/2 rounded-md" />
          <SkeletonGroup.Item className="h-2.5 w-16 rounded-md" />
        </View>
      </View>
    </SkeletonGroup>
  )
}
