import type { ReactNode } from "react";
import { View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeletonGroup } from "heroui-native";

import ScreenWrapper from "components/layout/ScreenWrapper";

import { APARTMENT_HERO_HEIGHT } from "./sections/ApartmentHeroSection";

const FLOATING_BUTTON_ROW_TOP_OFFSET = 8;

// Icon + title row used by every section card (mirrors SectionHeader).
function HeaderRow({ titleWidth }: { titleWidth: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <SkeletonGroup.Item className="size-6 rounded-md" />
      <SkeletonGroup.Item className={`h-6 rounded-xl ${titleWidth}`} />
    </View>
  );
}

// Same shell as SectionCard.
function CardShell({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`mx-5 bg-surface rounded-3xl border border-border ${className}`}
    >
      {children}
    </View>
  );
}

export default function ApartmentSkeleton() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1">
      <ScreenWrapper scrollable bottomPadding={100} noTopPadding>
        <SkeletonGroup isLoading>
          {/* Hero */}
          <View
            className="bg-surface-secondary p-5 justify-end"
            style={{ height: APARTMENT_HERO_HEIGHT }}
          >
            <View
              className="absolute inset-x-4 flex-row justify-between"
              style={{ top: insets.top + FLOATING_BUTTON_ROW_TOP_OFFSET }}
            >
              <SkeletonGroup.Item className="size-12 rounded-full" />
              <View className="flex-row gap-2">
                <SkeletonGroup.Item className="size-12 rounded-full" />
                <SkeletonGroup.Item className="size-12 rounded-full" />
              </View>
            </View>

            <View className="gap-3">
              <SkeletonGroup.Item className="h-8 w-3/4 rounded-xl" />
              <SkeletonGroup.Item className="h-5 w-11/12 rounded-xl" />
              <SkeletonGroup.Item className="h-5 w-40 mt-2 rounded-xl" />

              <View className="flex-row mt-3 gap-6">
                <SkeletonGroup.Item className="h-5 flex-1 rounded-xl" />
                <SkeletonGroup.Item className="h-5 flex-1 rounded-xl" />
                <SkeletonGroup.Item className="h-5 flex-1 rounded-xl" />
              </View>

              <View className="items-center mt-2">
                <SkeletonGroup.Item className="h-2 w-16 rounded-full" />
              </View>
            </View>
          </View>

          <View className="mt-3 gap-3">
            {/* Detail chips */}
            <View className="px-5 flex-row flex-wrap">
              {[0, 1, 2, 3].map((chip) => (
                <View key={chip} className="w-1/2 pr-2 mb-2">
                  <SkeletonGroup.Item className="h-13 w-full rounded-2xl" />
                </View>
              ))}
            </View>

            {/* Description */}
            <CardShell className="p-5 gap-3">
              <HeaderRow titleWidth="w-3/4" />
              <SkeletonGroup.Item className="h-4 w-full rounded-xl" />
              <SkeletonGroup.Item className="h-4 w-full rounded-xl" />
              <SkeletonGroup.Item className="h-4 w-2/3 rounded-xl" />
            </CardShell>

            {/* Perks */}
            <CardShell className="p-5 gap-3">
              <HeaderRow titleWidth="w-1/2" />
              <SkeletonGroup.Item className="h-4 w-3/4 rounded-xl" />
              <View className="flex-row flex-wrap mt-2">
                {[0, 1, 2, 3, 4, 5].map((perk) => (
                  <View key={perk} className="w-1/2 mb-4 pr-2">
                    <View className="flex-row items-center gap-3">
                      <SkeletonGroup.Item className="size-7 rounded-lg" />
                      <SkeletonGroup.Item className="h-4 flex-1 rounded-xl" />
                    </View>
                  </View>
                ))}
              </View>
            </CardShell>

            {/* Map */}
            <CardShell>
              <View className="p-5 pb-3">
                <HeaderRow titleWidth="w-1/3" />
              </View>
              <SkeletonGroup.Item className="h-64 mx-2 mb-2 rounded-2xl" />
            </CardShell>

            {/* Landlord */}
            <CardShell className="p-4 flex-row items-center gap-3">
              <SkeletonGroup.Item className="size-12 rounded-full" />
              <View className="flex-1 gap-2">
                <SkeletonGroup.Item className="h-5 w-1/2 rounded-xl" />
                <SkeletonGroup.Item className="h-3 w-1/4 rounded-xl" />
              </View>
              <SkeletonGroup.Item className="size-12 rounded-full" />
            </CardShell>

            {/* Lease agreement */}
            <CardShell className="p-5 gap-3">
              <HeaderRow titleWidth="w-2/3" />
              <SkeletonGroup.Item className="h-4 w-full rounded-xl" />
              <SkeletonGroup.Item className="h-4 w-1/2 rounded-xl" />
              <SkeletonGroup.Item className="h-10 w-full rounded-full" />
            </CardShell>

            {/* Ratings */}
            <View className="px-5 gap-3">
              <HeaderRow titleWidth="w-1/3" />
              <View className="p-3 bg-surface rounded-3xl border border-border gap-3">
                <View className="flex-row items-center gap-2">
                  <SkeletonGroup.Item className="size-8 rounded-full" />
                  <View className="flex-1 gap-1">
                    <SkeletonGroup.Item className="h-4 w-1/3 rounded-xl" />
                    <SkeletonGroup.Item className="h-3 w-1/4 rounded-xl" />
                  </View>
                </View>
                <SkeletonGroup.Item className="h-4 w-full rounded-xl" />
                <SkeletonGroup.Item className="h-4 w-3/4 rounded-xl" />
              </View>
            </View>
          </View>

          <View className="h-20" />
        </SkeletonGroup>
      </ScreenWrapper>

      {/* Footer */}
      <View className="absolute bottom-0 left-0 right-0 bg-surface-secondary z-10 px-5 py-4 border-t border-border">
        <SafeAreaView
          className="flex items-start justify-between gap-3"
          edges={["bottom"]}
        >
          <SkeletonGroup isLoading>
            <View className="flex-1 flex-row gap-4 items-center w-full">
              <View className="gap-2">
                <SkeletonGroup.Item className="h-8 w-36 rounded-xl" />
                <SkeletonGroup.Item className="h-3 w-28 rounded-xl" />
              </View>
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
