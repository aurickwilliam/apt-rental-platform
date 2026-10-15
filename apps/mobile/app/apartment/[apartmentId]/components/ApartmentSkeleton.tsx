import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SkeletonGroup } from "heroui-native";

import ScreenWrapper from "components/layout/ScreenWrapper";

export default function ApartmentSkeleton() {
  return (
    <View className="flex-1">
      <ScreenWrapper scrollable bottomPadding={100} noTopPadding>
        <SkeletonGroup isLoading>
          <View className="h-168 bg-surface-secondary p-5 justify-end">
            <View className="gap-3">
              <SkeletonGroup.Item className="h-8 w-3/4 rounded-xl" />
              <SkeletonGroup.Item className="h-5 w-11/12 rounded-xl" />
              <SkeletonGroup.Item className="h-5 w-40 mt-2 rounded-xl" />

              <View className="flex-row mt-3 gap-3">
                <SkeletonGroup.Item className="h-5 flex-1 rounded-xl" />
                <SkeletonGroup.Item className="h-5 flex-1 rounded-xl" />
                <SkeletonGroup.Item className="h-5 flex-1 rounded-xl" />
              </View>

              <View className="flex-row mt-3 gap-3">
                <SkeletonGroup.Item className="h-5 flex-1 rounded-xl" />
                <SkeletonGroup.Item className="h-5 flex-1 rounded-xl" />
              </View>
            </View>
          </View>

          <View className="mt-3 gap-3">
            <View className="px-5 flex-row flex-wrap">
              <View className="w-1/2 pr-2 mb-2">
                <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
              </View>
              <View className="w-1/2 pr-2 mb-2">
                <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
              </View>
              <View className="w-1/2 pr-2 mb-2">
                <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
              </View>
              <View className="w-1/2 pr-2 mb-2">
                <SkeletonGroup.Item className="h-12 w-full rounded-2xl" />
              </View>
            </View>

            <View className="mx-5 p-5 bg-surface rounded-3xl border border-border gap-3">
              <SkeletonGroup.Item className="h-6 w-2/3 rounded-xl" />
              <SkeletonGroup.Item className="h-4 w-full rounded-xl" />
              <SkeletonGroup.Item className="h-4 w-full rounded-xl" />
              <SkeletonGroup.Item className="h-4 w-5/6 rounded-xl" />
            </View>

            <View className="mx-5 p-5 bg-surface rounded-3xl border border-border gap-3">
              <SkeletonGroup.Item className="h-6 w-1/2 rounded-xl" />
              <View className="flex-row flex-wrap">
                <View className="w-1/2 pr-2 mb-3">
                  <SkeletonGroup.Item className="h-8 w-full rounded-xl" />
                </View>
                <View className="w-1/2 pl-2 mb-3">
                  <SkeletonGroup.Item className="h-8 w-full rounded-xl" />
                </View>
                <View className="w-1/2 pr-2">
                  <SkeletonGroup.Item className="h-8 w-full rounded-xl" />
                </View>
                <View className="w-1/2 pl-2">
                  <SkeletonGroup.Item className="h-8 w-full rounded-xl" />
                </View>
              </View>
            </View>

            <View className="mx-5 p-5 bg-surface rounded-3xl border border-border gap-3">
              <SkeletonGroup.Item className="h-6 w-1/3 rounded-xl" />
              <SkeletonGroup.Item className="h-56 w-full rounded-2xl" />
            </View>

            <SkeletonGroup.Item className="mx-5 h-20 rounded-3xl" />

            <View className="mx-5 p-5 bg-surface rounded-3xl border border-border gap-3">
              <SkeletonGroup.Item className="h-6 w-1/2 rounded-xl" />
              <SkeletonGroup.Item className="h-10 w-full rounded-xl" />
            </View>

            <View className="px-5 gap-3">
              <SkeletonGroup.Item className="h-6 w-1/3 rounded-xl" />
              <SkeletonGroup.Item className="h-24 w-full rounded-3xl" />
            </View>
          </View>

          <View className="h-20" />
        </SkeletonGroup>
      </ScreenWrapper>

      <View className="absolute bottom-0 left-0 right-0 bg-surface-secondary z-10 px-5 py-4 border-t border-border">
        <SafeAreaView
          className="flex items-start justify-between gap-3"
          edges={["bottom"]}
        >
          <SkeletonGroup isLoading>
            <View className="flex-1 flex-row gap-5 items-center w-full">
              <SkeletonGroup.Item className="h-9 w-36 rounded-xl" />
              <View className="flex-1">
                <SkeletonGroup.Item className="h-11 w-full rounded-full" />
              </View>
            </View>
          </SkeletonGroup>
        </SafeAreaView>
      </View>
    </View>
  );
}
