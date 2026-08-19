import { View, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenWrapper from "components/layout/ScreenWrapper";

import {
  IconHeart,
  IconHeartFilled,
  IconChevronLeft,
} from "@tabler/icons-react-native";

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
import { useReviewEligibility } from "@/hooks/ratings";

import { Button, useToast } from "heroui-native";

export default function ApartmentScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useColors();
  const { toast } = useToast();

  const { apartment, reviews, loading, error } =
    useApartmentDetails(apartmentId);
  const { isFavorite, toggleFavorite } = useFavorites();
  const {
    canReview,
    checkingEligibility,
    reviewableTenancyId,
  } = useReviewEligibility(apartmentId);

  const apartmentImages =
    apartment?.apartment_images.map((image) => ({
      id: image.id,
      image: { uri: image.url },
    })) ?? [];

  const handleFavoriteToggle = async () => {
    if (!apartmentId) return;

    try {
      const { wasFavorite } = await toggleFavorite(apartmentId);
      toast.show({
        variant: wasFavorite ? "default" : "success",
        label: wasFavorite ? "Removed from favorites" : "Added to favorites",
      });
    } catch (toggleError) {
      console.error("Error toggling favorite:", toggleError);
      toast.show({ variant: "danger", label: "Something went wrong" });
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
        apartmentTitle: apartment?.name,
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

  const handleMapViewNavigation = () => {
    router.push(`/apartment/${apartmentId}/map-view`);
  };

  const handleWriteReview = () => {
    router.push({
      pathname: "/apartment/[apartmentId]/rate-apartment",
      params: {
        apartmentId,
        tenancyId: reviewableTenancyId,
      },
    });
  };

  if (loading) {
    return <ApartmentSkeleton />;
  }

  if (error && !apartment) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8">
        <Text className="text-foreground font-nunitoSemiBold text-lg text-center">
          Unable to load apartment details
        </Text>
        <Text className="text-gray-500 font-inter text-center mt-2">
          Please try again in a moment.
        </Text>
        <View className="mt-6">
          <Button size="sm" onPress={() => router.back()}>
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

        <PerksSection apartmentId={apartmentId} amenities={apartment?.amenities} />

        <MapPreviewSection
          apartmentName={apartment?.name}
          latitude={apartment?.latitude}
          longitude={apartment?.longitude}
          onOpenMap={handleMapViewNavigation}
        />

        <RatingsSection
          reviews={reviews}
          onSeeAll={() => router.push(`/apartment/${apartmentId}/ratings`)}
          canReview={canReview}
          checkingEligibility={checkingEligibility}
          onWriteReview={handleWriteReview}
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

        <View className="h-20" />
      </ScreenWrapper>

      <MoveInCostFooter
        monthlyRent={apartment?.monthly_rent ?? 0}
        securityDeposit={apartment?.security_deposit}
        advanceRent={apartment?.advance_rent}
        onApplyNow={handleApplyNow}
      />

      <View className="absolute left-4" style={{ top: insets.top + 8 }}>
        <Button onPress={() => router.back()} variant="tertiary" isIconOnly>
          <IconChevronLeft size={24} color={colors.textPrimary} />
        </Button>
      </View>

      <View className="absolute right-4" style={{ top: insets.top + 8 }}>
        <Button
          onPress={() => void handleFavoriteToggle()}
          variant="tertiary"
          isIconOnly
        >
          {isFavorite(apartmentId) ? (
            <IconHeartFilled size={24} color={colors.danger} />
          ) : (
            <IconHeart size={24} color={colors.gray400} />
          )}
        </Button>
      </View>
    </View>
  );
}
