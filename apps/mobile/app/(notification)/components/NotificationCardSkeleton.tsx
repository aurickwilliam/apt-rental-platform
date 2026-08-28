import { View } from 'react-native'
import { Card, SkeletonGroup } from 'heroui-native'

export default function NotificationCardSkeleton() {
  return (
    <SkeletonGroup isLoading isSkeletonOnly className="rounded-3xl overflow-hidden border border-border">
      <Card className="bg-surface rounded-3xl border-0 p-4 shadow-none">
        <Card.Header>
          <View className="flex-row items-center gap-2">
            <SkeletonGroup.Item className="h-5 w-5 rounded-full shrink-0" />
            <SkeletonGroup.Item className="h-4 w-32 rounded-md flex-1" />
            <SkeletonGroup.Item className="h-2.5 w-2.5 rounded-full shrink-0" />
          </View>
        </Card.Header>

        <Card.Body className="pt-2 gap-2">
          <SkeletonGroup.Item className="h-3 w-full rounded-md" />
          <SkeletonGroup.Item className="h-3 w-3/4 rounded-md" />
        </Card.Body>

        <Card.Footer className="pt-2">
          <SkeletonGroup.Item className="h-3 w-20 rounded-md" />
        </Card.Footer>
      </Card>
    </SkeletonGroup>
  )
}
