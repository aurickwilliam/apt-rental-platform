import { View } from 'react-native';
import { Card, SkeletonGroup } from 'heroui-native';

export default function TenantApplicationCardSkeleton() {
  return (
    <SkeletonGroup
      isLoading
      isSkeletonOnly
      className="rounded-3xl overflow-hidden border border-border"
    >
      <Card className="shadow-none p-0">
        <Card.Body className="p-3 flex-row items-center gap-3">
          {/* Avatar */}
          <SkeletonGroup.Item className="h-14 w-14 rounded-full shrink-0" />

          {/* Content */}
          <View className="flex-1 flex-row items-start justify-between gap-3">
            {/* Left: name + apartment */}
            <View className="flex-1 gap-2">
              <SkeletonGroup.Item className="h-3.5 w-32 rounded-md" />
              <SkeletonGroup.Item className="h-3 w-24 rounded-md" />
            </View>

            {/* Right: chip + date */}
            <View className="items-end gap-3">
              <SkeletonGroup.Item className="h-6 w-20 rounded-full" />
              <SkeletonGroup.Item className="h-3 w-16 rounded-md" />
            </View>
          </View>
        </Card.Body>
      </Card>
    </SkeletonGroup>
  );
}