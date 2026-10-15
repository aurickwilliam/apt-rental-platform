import { useRef, useState } from "react";
import {
  View,
  Text,
  Share,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenWrapper, {
  type ScreenWrapperScrollRef,
} from "components/layout/ScreenWrapper";

import {
  IconHeart,
  IconHeartFilled,
  IconChevronLeft,
  IconShare,
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
import type { ApartmentDetails } from "@/hooks/apartments";
import { useFavorites, useFavoriteToggle } from "@/hooks/favorites";
import { useColors } from "@/hooks/useTheme";
import { useLightStatusBar } from "@/hooks/useLightStatusBar";
import { useReviewEligibility } from "@/hooks/ratings";
import { useCurrentUserId } from "@/hooks/auth";
import { getInquiryConversationId } from "@/service/chat/chatRoutes";
import { buildApartmentShareMessage } from "@/service/apartments/apartmentShare";

import { Button } from "heroui-native";

function getApplyDisabledReason(
  apartment: ApartmentDetails | null,
  currentUserId: string | null,
): string | null {
  if (!apartment) return null;
  if (currentUserId && apartment.landlord?.id === currentUserId) {
    return "Your Listing";
  }
  if (apartment.status === "occupied" || apartment.status === "under_maintenance") {
    return "Not Available";
  }
  return null;
}

// Matches the hero's `h-168` (672px) and the floating button row below the status bar.
const HERO_HEIGHT = 672;
const FLOATING_BUTTONS_HEIGHT = 56;

export default function ApartmentScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useColors();

  const {
    apartment,
    reviews,
    loading,
    reviewsLoading,
    error,
    reviewsError,
    refetch,
    refetchReviews,
  } = useApartmentDetails(apartmentId);
  const currentUserId = useCurrentUserId();
  const scrollRef = useRef<ScreenWrapperScrollRef>(null);
  const ratingsOffsetY = useRef(0);
  const [isPastHero, setIsPastHero] = useState(false);
  const { isFavorite } = useFavorites();
  const { toggleFavoriteWithToast } = useFavoriteToggle();
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
    await toggleFavoriteWithToast(apartmentId);
  };

  const applyDisabledReason = getApplyDisabledReason(
    apartment,
    currentUserId,
  );

  // White status-bar icons while the hero photo sits behind them.
  useLightStatusBar(!isPastHero);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pastHero =
      event.nativeEvent.contentOffset.y >
      HERO_HEIGHT - insets.top - FLOATING_BUTTONS_HEIGHT;
    setIsPastHero((current) => (current === pastHero ? current : pastHero));
  };

  const handleJumpToRatings = () => {
    scrollRef.current?.scrollTo({ y: ratingsOffsetY.current, animated: true });
  };

  const handleShare = async () => {
    if (!apartment) return;

    try {
      await Share.share({
        message: buildApartmentShareMessage(
          apartment,
          process.env.EXPO_PUBLIC_WEB_URL,
        ),
      });
    } catch (shareError) {
      console.error("Failed to share apartment", shareError);
    }
  };

  const handleApplyNow = () => {
    if (applyDisabledReason) return;
    router.push(`/apartment/${apartmentId}/apply/apartment-summary`);
  };

  const handleMessageLandlord = () => {
    if (!apartment?.landlord?.id || !apartmentId) return;

    const landlord = apartment.landlord;
    const fullName =
      `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim();
    const conversationId = getInquiryConversationId(landlord.id, apartmentId);

    router.push({
      pathname: "/chat/[conversationId]",
      params: {
        conversationId,
        otherUserId: landlord.id,
        otherUserName: fullName || "Landlord",
        otherUserAvatar: landlord.avatar_url ?? "",
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
        <View className="mt-6 flex-row gap-3">
          <Button size="sm" variant="tertiary" onPress={() => router.back()}>
            <Button.Label>Go Back</Button.Label>
          </Button>
          <Button size="sm" onPress={() => void refetch()}>
            <Button.Label>Try Again</Button.Label>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScreenWrapper
        ref={scrollRef}
        scrollable
        bottomPadding={100}
        noTopPadding
        onScroll={handleScroll}
      >
        <ApartmentHeroSection
          apartment={apartment}
          images={apartmentImages}
          onRatingPress={handleJumpToRatings}
        />

        <ApartmentDetailsSection apartment={apartment} />

        <ApartmentDescriptionSection description={apartment?.description} />

        <PerksSection apartmentId={apartmentId} amenities={apartment?.amenities} />

        <MapPreviewSection
          apartmentName={apartment?.name}
          latitude={apartment?.latitude}
          longitude={apartment?.longitude}
          onOpenMap={handleMapViewNavigation}
        />

        <LandlordSection
          landlord={apartment?.landlord ?? null}
          onPress={handleLandlordProfileNavigation}
          onMessagePress={handleMessageLandlord}
        />

        <LeaseAgreementSection
          leaseAgreementUrl={apartment?.lease_agreement_url}
        />

        <View
          onLayout={(event) => {
            ratingsOffsetY.current = event.nativeEvent.layout.y;
          }}
        >
        <RatingsSection
          reviews={reviews}
          isLoading={reviewsLoading}
          error={reviewsError}
          onRetry={() => void refetchReviews()}
          onSeeAll={() => router.push(`/apartment/${apartmentId}/ratings`)}
          canReview={canReview}
          checkingEligibility={checkingEligibility}
          onWriteReview={handleWriteReview}
        />
        </View>

      </ScreenWrapper>

      <MoveInCostFooter
        monthlyRent={apartment?.monthly_rent ?? 0}
        securityDeposit={apartment?.security_deposit}
        advanceRent={apartment?.advance_rent}
        onApplyNow={handleApplyNow}
        applyDisabledReason={applyDisabledReason}
      />

      <View className="absolute left-4" style={{ top: insets.top + 8 }}>
        <Button
          onPress={() => router.back()}
          variant="tertiary"
          isIconOnly
          className="bg-black/35"
          accessibilityLabel="Go back"
        >
          <IconChevronLeft size={24} color={colors.secondaryForeground} />
        </Button>
      </View>

      <View
        className="absolute right-4 flex-row gap-2"
        style={{ top: insets.top + 8 }}
      >
        <Button
          onPress={() => void handleShare()}
          variant="tertiary"
          isIconOnly
          className="bg-black/35"
          isDisabled={!apartment}
          accessibilityLabel="Share apartment"
        >
          <IconShare size={24} color={colors.secondaryForeground} />
        </Button>
        <Button
          onPress={() => void handleFavoriteToggle()}
          variant="tertiary"
          isIconOnly
          className="bg-black/35"
          accessibilityLabel={
            isFavorite(apartmentId) ? "Remove from favorites" : "Add to favorites"
          }
          accessibilityState={{ selected: isFavorite(apartmentId) }}
        >
          {isFavorite(apartmentId) ? (
            <IconHeartFilled size={24} color={colors.danger} />
          ) : (
            <IconHeart size={24} color={colors.secondaryForeground} />
          )}
        </Button>
      </View>
    </View>
  );
}
