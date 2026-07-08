import { View } from "react-native";
import { Card, SkeletonGroup } from "heroui-native";

export default function MaintenanceRequestCardSkeleton() {
  return (
    <View className="rounded-3xl overflow-hidden">
      <Card className="shadow-none border border-border p-0">
        <Card.Body className="p-4 flex-row gap-4">
          <SkeletonGroup className="flex-1 min-w-0 gap-3">
            <View className="flex-row items-center justify-between gap-3">
              <SkeletonGroup.Item className="size-8 rounded-full" />

              <View className="flex-1 gap-1.5">
                <SkeletonGroup.Item className="h-3.5 w-3/4 rounded-md" />
                <SkeletonGroup.Item className="h-3 w-1/2 rounded-md" />
              </View>

              <SkeletonGroup.Item className="h-6 w-16 rounded-full" />
            </View>

            <View className="flex-row items-center justify-between gap-3">
              <SkeletonGroup.Item className="h-3 w-24 rounded-md" />
              <SkeletonGroup.Item className="h-3 w-16 rounded-md" />
            </View>
          </SkeletonGroup>
        </Card.Body>
      </Card>
    </View>
  );
}
