import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenWrapper from "components/layout/ScreenWrapper";

import { Heart, ChevronLeft } from "lucide-react-native";

import {
  ApartmentHeroSection,
  ApartmentDescriptionSection,
  PerksSection,
  MapPreviewSection,
  RatingsSection,
  LandlordSection,
  LeaseAgreementSection,
  MoveInCostFooter,
  ApartmentSkeleton,
  ApartmentDetailsSection,
} from "./components";

import { useApartmentDetails } from "@/hooks/apartments";
import { useFavorites } from "@/hooks/favorites";
import { useColors } from "@/hooks/useTheme";

import { Button } from "heroui-native";

export default function ApartmentScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { colors } = useColors();
  const { apartment, reviews, loading, error } =
    useApartmentDetails(apartmentId);
  const { isFavorite, toggleFavorite } = useFavorites();

  const apartmentImages =
    apartment?.apartment_images.map((img) => ({
      id: img.id,
      image: { uri: img.url },
    })) ?? [];

  // Handlers for User Navigation and Actions
  const handleFavoriteToggle = async () => {
    if (!apartmentId) return;

    try {
      await toggleFavorite(apartmentId);
    } catch (err) {
      console.error("Error toggling favorite:", err);
    }
  };

  const handleApplyNow = () => {
    router.push(`/apartment/${apartmentId}/apply/apartment-summary`);
  };

  const handleMessageLandlord = () => {
    if (!apartment?.landlord?.id || !apartmentId) return;

    const landlord = apartment.landlord;
    const fullName =
      `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim();
    const conversationId = `inquiry-${apartmentId}-${landlord.id}`;

    console.log("Navigating to chat with landlord:", conversationId);

    router.push({
      pathname: "/chat/[conversationId]",
      params: {
        conversationId,
        otherUserId: landlord.id,
        otherUserName: fullName || "Landlord",
        otherUserAvatar: landlord.avatar_url ?? "",
        otherUserPhoneNumber: landlord.mobile_number ?? "",
        apartmentId,
      },
    });
  };

  const handleLandlordProfileNavigation = () => {
    if (apartment?.landlord) {
      router.push({
        pathname: "/profile/landlord/[landlordId]",
        params: {
          landlordId: apartment.landlord.id,
          apartmentId,
        },
      });
    }
  };

  const handleSeeAllRatings = () => {
    router.push(`/apartment/${apartmentId}/ratings`);
  };

  const handleMapViewNavigation = () => {
    router.push(`/apartment/${apartmentId}/map-view`);
  };

  // Loading State
  if (loading) {
    return <ApartmentSkeleton />;
  }

  // Error State
  if (error && !apartment) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-foreground font-interSemiBold text-lg text-center">
          Unable to load apartment details
        </Text>
        <Text className="text-gray-500 font-inter text-center mt-2">
          Please try again in a moment.
        </Text>
        <View className="mt-6">
          <Button size={"sm"} onPress={() => router.back()}>
            <Button.Label>Go Back</Button.Label>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScreenWrapper scrollable bottomPadding={100} noTopPadding>
        <ApartmentHeroSection apartment={apartment} images={apartmentImages} />

        <ApartmentDetailsSection apartment={apartment} />

        <ApartmentDescriptionSection description={apartment?.description} />

        <PerksSection amenities={apartment?.amenities} />

        <MapPreviewSection
          apartmentName={apartment?.name}
          latitude={apartment?.latitude}
          longitude={apartment?.longitude}
          onOpenMap={handleMapViewNavigation}
        />

        <RatingsSection
          reviews={reviews}
          onSeeAll={handleSeeAllRatings}
        />

        <LandlordSection
          landlord={apartment?.landlord ?? null}
          totalRentals={apartment?.no_ratings}
          onPress={handleLandlordProfileNavigation}
          onMessagePress={handleMessageLandlord}
        />

        <LeaseAgreementSection
          leaseAgreementUrl={apartment?.lease_agreement_url}
        />

        {/* Spacer */}
        <View className="h-20" />
      </ScreenWrapper>

      <MoveInCostFooter
        monthlyRent={apartment?.monthly_rent ?? 0}
        securityDeposit={apartment?.security_deposit}
        advanceRent={apartment?.advance_rent}
        onApplyNow={handleApplyNow}
      />

      {/* Fixed Icon Buttons */}
      {/* Back Button */}
      <View className="absolute left-4" style={{ top: insets.top + 8 }}>
        <Button onPress={() => router.back()} variant="tertiary" isIconOnly>
          <ChevronLeft size={24} color={colors.textPrimary} />
        </Button>
      </View>

      {/* Favorite Button */}
      <View className="absolute right-4" style={{ top: insets.top + 8 }}>
        <Button
          onPress={() => void handleFavoriteToggle()}
          variant="tertiary"
          isIconOnly
        >
          {isFavorite(apartmentId) ? (
            <Heart size={24} color={colors.danger} fill={colors.danger} />
          ) : (
            <Heart size={24} color={colors.gray400} />
          )}
        </Button>
      </View>
    </View>
  );
}
