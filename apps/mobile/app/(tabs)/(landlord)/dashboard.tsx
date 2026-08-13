import { useEffect } from "react";
import { View, Text, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

import { IMAGES } from "@/constants/images";

import { IconBell } from "@tabler/icons-react-native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import RentDueCard from "@/app/(tabs)/components/dashboard/RentDueCard";
import ProfitTrendCard from "./../components/dashboard/ProfitTrendCard";
import ProfitByPropertyCard from "./../components/dashboard/ProfitByPropertyCard";

import { useDashboardStats } from "@/hooks/dashboard";
import { useColors } from "@/hooks/useTheme";

import { Button } from "heroui-native";

import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_BOTTOM_OFFSET,
} from "@/app/(tabs)/components/CustomTabBar";

export default function Dashboard() {
  const router = useRouter();
  const { colors } = useColors();
  const { stats, loading, error } = useDashboardStats();

  useEffect(() => {
    if (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }, [error]);

  const upcomingRentDue = [
    {
      id: 1,
      tenantName: "John Doe",
      propertyName: "Sunset Apartments - Unit 3B",
      dueDate: "2024-07-05",
      amount: 1_200.0,
    },
    {
      id: 2,
      tenantName: "Jane Smith",
      propertyName: "Maple Residences - Unit 2A",
      dueDate: "2024-07-10",
      amount: 1_500.0,
    },
    {
      id: 3,
      tenantName: "Michael Johnson",
      propertyName: "Oakwood Villas - Unit 1C",
      dueDate: "2024-07-15",
      amount: 1_000.0,
    },
  ];

  return (
    <ScreenWrapper
      scrollable
      className="p-5"
      bottomPadding={FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET}
    >
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row gap-3 items-center">
          <Image source={IMAGES.logo} className="size-9" resizeMode="contain" />
          <Text className="text-secondary text-3xl font-nunitoSemiBold mt-1">
            Dashboard
          </Text>
        </View>

        <Button
          onPress={() => router.push("/landlord-notif")}
          variant="ghost"
          isIconOnly
        >
          <IconBell size={26} color={colors.gray500} />
        </Button>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          className="my-6"
        />
      ) : (
        <View className="flex gap-3">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-primary rounded-3xl p-4 gap-1 justify-center">
              <Text className="text-sm text-gray-100 font-interMedium">
                Total Properties
              </Text>
              <Text className="text-3xl text-white font-interSemiBold">
                {stats.totalProperties}
              </Text>
            </View>

            <View className="flex-1 bg-surface rounded-3xl p-4 gap-1 border border-border justify-center">
              <Text className="text-sm text-muted font-interMedium">
                Units Occupied
              </Text>
              <Text className="text-3xl text-foreground font-interSemiBold">
                {stats.unitsOccupied}/{stats.totalProperties}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-3xl p-4 gap-1 border border-border justify-center">
              <Text className="text-sm text-muted font-interMedium">
                Pending Payments
              </Text>
              <Text className="text-3xl text-foreground font-interSemiBold">
                {stats.pendingPayments}
              </Text>
            </View>

            <View className="flex-1 bg-surface rounded-3xl p-4 gap-1 border border-border justify-center">
              <Text className="text-sm text-muted font-interMedium">
                Maintenance Requests
              </Text>
              <Text className="text-3xl text-foreground font-interSemiBold">
                {stats.maintenanceRequests}
              </Text>
            </View>
          </View>
        </View>
      )}

      <View className="flex gap-5 mt-5">
        <ProfitTrendCard />
        <ProfitByPropertyCard />
      </View>

      <View className="flex gap-5 mt-5">
        <Text className="text-foreground text-lg font-interSemiBold">
          Upcoming Rent Due
        </Text>
        <View className="flex gap-3">
          {upcomingRentDue.map((rent) => (
            <RentDueCard
              key={rent.id}
              {...rent}
              onPress={() => console.log("Rent due card pressed:", rent.id)}
            />
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}
