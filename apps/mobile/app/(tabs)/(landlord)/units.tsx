import { View, Text } from "react-native";
import { useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import ScreenWrapper from "@/components/layout/ScreenWrapper";
import QuickActionButton from "@/app/(tabs)/components/QuickActionButton";
import PropertyCard from "../components/units/PropertyCard";
import PropertyStats from "../components/units/PropertyStats";
import EmptyProperties from "../components/units/EmptyProperties";
import PropertyCardSkeleton from "../components/units/PropertyCardSkeleton";
import PropertyFilterSheet, {
  type SortOption,
} from "../components/units/PropertyFilterSheet";

import {
  IconFileText,
  IconHome,
  IconHammer,
  IconCirclePlus,
} from "@tabler/icons-react-native";

import {
  SearchField,
  Separator,
} from "heroui-native";

import { useLandlordUnits, useLandlordActionBadges } from "@/hooks/apartments";
import { VALID_APARTMENT_STATUSES } from "@repo/constants";
import { FLOATING_TAB_BAR_HEIGHT, FLOATING_TAB_BAR_BOTTOM_OFFSET } from "@/app/(tabs)/components/CustomTabBar";

const statusOptions = ["All", ...VALID_APARTMENT_STATUSES];

const locationOptions = [
  "All",
  "Caloocan",
  "Malabon",
  "Navotas",
  "Valenzuela",
];

export default function Units() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const { apartments, monthlyProfit, loading, fetchApartments } = useLandlordUnits();
  const { counts, fetchCounts } = useLandlordActionBadges();

  const [selectedStatus, setSelectedStatus] = useState<string>(statusOptions[0]);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationOptions[0]);
  const [selectedSort, setSelectedSort] = useState<SortOption>("none");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilterCount = [
    selectedStatus !== statusOptions[0],
    selectedLocation !== locationOptions[0],
    selectedSort !== "none",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const handleClearFilters = () => {
    setSelectedStatus(statusOptions[0]);
    setSelectedLocation(locationOptions[0]);
    setSelectedSort("none");
  };

  // Re-fetch whenever tab is focused
  useFocusEffect(
    useCallback(() => {
      fetchApartments();
      fetchCounts();
    }, [fetchApartments, fetchCounts]),
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

    if (selectedSort === "price_asc") {
        result = [...result].sort((a, b) => (a.monthlyRent ?? 0) - (b.monthlyRent ?? 0));
      } else if (selectedSort === "price_desc") {
        result = [...result].sort((a, b) => (b.monthlyRent ?? 0) - (a.monthlyRent ?? 0));
      }
    return result;
  }, [searchQuery, selectedStatus, selectedLocation, selectedSort, apartments]);

  const totalProperties = apartments.length;
  const occupiedCount = apartments.filter(
    (a) => a.status === "occupied",
  ).length;

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/landlord/manage-apartment/${propertyId}`);
  };

  return (
    <ScreenWrapper className="p-5" scrollable bottomPadding={FLOATING_TAB_BAR_HEIGHT + FLOATING_TAB_BAR_BOTTOM_OFFSET}>
      {/* Header */}
      <Text className="text-secondary text-3xl font-nunitoSemiBold">
        My Properties
      </Text>

      {/* Property Stats */}
      <PropertyStats
        loading={loading}
        monthlyProfit={monthlyProfit}
        totalProperties={totalProperties}
        occupiedCount={occupiedCount}
        onAnalyticsPress={() => router.push("/landlord/analytics")}
      />

      <Separator className="my-4" />

      {/* Property Actions */}
      <View className="flex gap-5">
        <Text className="text-foreground text-base font-interMedium">
          Property Actions
        </Text>

        <View className="flex-row flex-wrap">
          <QuickActionButton
            label={"Add Property"}
            icon={IconCirclePlus}
            onPress={() => router.push("/landlord/manage-apartment/add-apartment/")}
          />
          <QuickActionButton
            label={"Maintenance Request"}
            icon={IconHammer}
            badgeCount={counts.maintenance}
            onPress={() => router.push("/landlord/maintenance-requests")}
          />
          <QuickActionButton
            label={"Visit Request"}
            icon={IconHome}
            badgeCount={counts.visits}
            onPress={() => router.push("/landlord/visit-requests")}
          />
          <QuickActionButton
            label={"Tenant Applications"}
            icon={IconFileText}
            badgeCount={counts.applications}
            onPress={() => router.push("/landlord/tenant-applications")}
          />
        </View>
      </View>

      {/* List of Properties */}
      <View className="mt-5">
        <Text className="text-accent text-lg font-interMedium">
          List of Properties
        </Text>

        {/* Search + Filter Row */}
        <View className="mt-3 flex-row items-center gap-2">
          <SearchField value={searchQuery} onChange={setSearchQuery} className="flex-1">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search a Property" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <PropertyFilterSheet
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
            statusOptions={statusOptions}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            locationOptions={locationOptions}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
            activeFilterCount={activeFilterCount}
            hasActiveFilters={hasActiveFilters}
            onClear={handleClearFilters}
          />
        </View>

        <Separator className="my-4" />

        {/* Generate all the Properties */}
        {loading ? (
          <View className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </View>
        ) : filteredApartments.length === 0 ? (
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
                isVerified={apt.isVerified}
                monthlyRent={apt.monthlyRent}
              />
            ))}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
