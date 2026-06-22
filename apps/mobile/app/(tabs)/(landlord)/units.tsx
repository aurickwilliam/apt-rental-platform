import { View, Text } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import QuickActionButton from "@/app/(tabs)/components/QuickActionButton";
import PropertyCard from "./../components/units/PropertyCard";
import EmptyProperties from "../components/units/EmptyProperties";
import PropertyCardSkeleton from "../components/units/PropertyCardSkeleton";

import {
  FileText,
  Home,
  Hammer,
  ChartPie,
  CirclePlus,
} from "lucide-react-native";

import { formatCurrency } from "@repo/utils";

import { Button, SearchField, Separator } from "heroui-native";

import { useColors } from "@/hooks/useTheme";
import { useLandlordUnits } from "@/hooks/useLandlordUnits";

const statusOptions = [
  "All",
  "Occupied",
  "Available",
  "Under Maintenance",
  "Unverified",
];

const locationOptions = [
  "All",
  "Caloocan",
  "Malabon",
  "Navotas",
  "Valenzuela",
];

// Current Month Label (e.g. "November 2024")
const currentMonthLabel = new Date().toLocaleString("default", {
  month: "long",
  year: "numeric",
});

export default function Units() {
  const router = useRouter();
  const { colors } = useColors();

  const [searchQuery, setSearchQuery] = useState("");

  const { apartments, monthlyProfit, loading, fetchApartments } = useLandlordUnits();

  const [selectedStatus, setSelectedStatus] = useState<string>(statusOptions[0]);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationOptions[0]);

  // Re-fetch whenever tab is focused (e.g. after adding a new apartment)
  useFocusEffect(
    useCallback(() => {
      fetchApartments();
    }, [fetchApartments]),
  );

  const filteredApartments = useMemo(() => {
    let result = apartments;
    if (selectedStatus !== "All") result = result.filter((a) => a.status === selectedStatus);
    if (selectedLocation !== "All") result = result.filter((a) => a.city === selectedLocation);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.barangay.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q),
      );
    }
    return result;
  }, [searchQuery, selectedStatus, selectedLocation, apartments]);

  const totalProperties = apartments.length;
  const occupiedCount = apartments.filter(
    (a) => a.status === "Occupied",
  ).length;

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/landlord/manage-apartment/${propertyId}`);
  };

  return (
    <ScreenWrapper className="p-5" scrollable bottomPadding={50}>
      {/* Header */}
      <Text className="text-secondary text-3xl font-nunitoSemiBold">
        My Properties
      </Text>

      {/* Property Stats */}
      <View className="flex gap-3 mt-5">
        <View className="bg-accent p-4 rounded-3xl flex gap-2">
          <Text className="text-gray-100 text-base font-interSemiBold">
            {currentMonthLabel} Total Profit
          </Text>
          <Text className="text-accent-foreground text-4xl font-interSemiBold">
            {loading
              ? "—"
              : monthlyProfit === null
                ? "N/A"
                : `₱ ${formatCurrency(monthlyProfit)}`}
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 bg-surface-secondary rounded-3xl p-4 gap-1 border border-border justify-center">
            <Text className="text-sm text-gray-500 font-interMedium">
              Total Properties
            </Text>
            <Text className="text-3xl text-foreground font-interSemiBold">
              {loading ? "—" : totalProperties}
            </Text>
          </View>

          <View className="flex-1 bg-surface-secondary rounded-3xl p-4 gap-1 border border-border justify-center">
            <Text className="text-sm text-gray-500 font-interMedium">
              Units Occupied
            </Text>
            <Text className="text-3xl text-foreground font-interSemiBold">
              {loading ? "—" : occupiedCount}
            </Text>
          </View>
        </View>

        <Button onPress={() => router.push("/landlord/analytics")}>
          <ChartPie size={20} color={colors.secondaryForeground} />
          <Button.Label>
            Budget Analytics
          </Button.Label>
        </Button>
      </View>

      <Separator className="my-4" />

      {/* Property Actions */}
      <View className="flex gap-5">
        <Text className="text-foreground text-base font-interMedium">
          Property
        </Text>

        <View className="flex-row flex-wrap">
          <QuickActionButton
            label={"Add Property"}
            icon={CirclePlus}
            onPress={() => router.push("/landlord/manage-apartment/add-apartment/")}
          />
          <QuickActionButton
            label={"Maintenance Request"}
            icon={Hammer}
            onPress={() => router.push("/landlord/maintenance-requests")}
          />
          <QuickActionButton
            label={"Visit Request"}
            icon={Home}
            onPress={() => router.push("/landlord/visit-requests")}
          />
          <QuickActionButton
            label={"Tenant Applications"}
            icon={FileText}
            onPress={() => router.push("/landlord/tenant-applications")}
          />
        </View>
      </View>

      {/* List of Properties */}
      <View className="mt-5">
        <Text className="text-accent text-lg font-interMedium">
          List of Properties
        </Text>

        <View className="mt-3">
          <SearchField value={searchQuery} onChange={setSearchQuery}>
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search a Property" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
        </View>

        <Separator className="my-4" />

        {loading ? (
          // Skeleton loading state
          <View className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </View>
        ) : filteredApartments.length === 0 ? (
          // Empty / no results state
          apartments.length === 0 ? (
            <EmptyProperties
              onAdd={() => router.push("/landlord/manage-apartment/add-apartment/")}
            />
          ) : (
            <View className="items-center py-12 gap-2">
              <Text className="text-gray-400 font-interSemiBold">
                No properties match your search.
              </Text>
            </View>
          )
        ) : (
          // Apartment list
          <View className="flex gap-3">
            {filteredApartments.map((apt) => (
              <PropertyCard
                key={apt.id}
                apartmentName={apt.name}
                barangay={apt.barangay}
                city={apt.city}
                status={apt.status}
                thumbnailUrl={apt.coverUrl ?? undefined}
                onPress={() => handlePropertyPress(apt.id)}
              />
            ))}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
