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

import {
  FileText,
  Home,
  Hammer,
  CirclePlus,
  ListFilter,
} from "lucide-react-native";

import {
  SearchField,
  Separator,
  BottomSheet,
  Chip,
  Button,
} from "heroui-native";

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

export default function Units() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  const { apartments, monthlyProfit, loading, fetchApartments } = useLandlordUnits();

  const [selectedStatus, setSelectedStatus] = useState<string>(statusOptions[0]);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationOptions[0]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const hasActiveFilters =
    selectedStatus !== statusOptions[0] || selectedLocation !== locationOptions[0];

  const handleClearFilters = () => {
    setSelectedStatus(statusOptions[0]);
    setSelectedLocation(locationOptions[0]);
  };

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

        {/* Search + Filter Row */}
        <View className="mt-3 flex-row items-center gap-2">
          <SearchField value={searchQuery} onChange={setSearchQuery} className="flex-1">
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search a Property" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          <BottomSheet isOpen={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <BottomSheet.Trigger asChild>
              <Button isIconOnly variant="secondary" className="relative">
                <ListFilter size={18} />
                {hasActiveFilters && (
                  <View className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border border-background" />
                )}
              </Button>
            </BottomSheet.Trigger>

            <BottomSheet.Portal>
              <BottomSheet.Overlay />
              <BottomSheet.Content>
                <BottomSheet.Title>Filter Properties</BottomSheet.Title>

                <View className="gap-5 mt-4 pb-6">
                  <View className="gap-2">
                    <Text className="text-foreground font-interMedium text-sm">
                      Status
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {statusOptions.map((status) => {
                        const isSelected = selectedStatus === status;
                        return (
                          <Chip
                            key={status}
                            variant={isSelected ? "soft" : "secondary"}
                            color={isSelected ? "accent" : "default"}
                            onPress={() => setSelectedStatus(status)}
                          >
                            <Chip.Label>{status}</Chip.Label>
                          </Chip>
                        );
                      })}
                    </View>
                  </View>
                
                  <Separator />
                
                  <View className="gap-2">
                    <Text className="text-foreground font-interMedium text-sm">Location</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {locationOptions.map((location) => {
                        const isSelected = selectedLocation === location;
                        return (
                          <Chip
                            key={location}
                            variant={isSelected ? "soft" : "secondary"}
                            color={isSelected ? "accent" : "default"}
                            onPress={() => setSelectedLocation(location)}
                          >
                            <Chip.Label>{location}</Chip.Label>
                          </Chip>
                        );
                      })}
                    </View>
                  </View>
                
                  <View className="flex-row gap-3 mt-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onPress={handleClearFilters}
                      isDisabled={!hasActiveFilters}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1"
                      onPress={() => setIsFilterOpen(false)}
                    >
                      Done
                    </Button>
                  </View>
                </View>
              </BottomSheet.Content>
            </BottomSheet.Portal>
          </BottomSheet>
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
              />
            ))}
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
