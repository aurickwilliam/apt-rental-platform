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
  IconShare2,
} from "@tabler/icons-react-native";

import ApartmentHeroSection, {
  APARTMENT_HERO_HEIGHT,
} from "./components/sections/ApartmentHeroSection";
import ApartmentDescriptionSection from "./components/sections/ApartmentDescriptionSection";
import PerksSection from "./components/sections/PerksSection";
import MapPreviewSection from "./components/sections/MapPreviewSection";
import RatingsSection from "./components/sections/RatingsSection";
import LandlordSection from "./components/sections/LandlordSection";
import LeaseAgreementSection from "./components/sections/LeaseAgreementSection";
import MoveInCostFooter from "./components/sections/MoveInCostFooterSection";
import ApartmentSkeleton from "./components/ApartmentSkeleton";
import ApartmentDetailsSection from "./components/sections/ApartmentDetailsSection";

import { useApartmentDetails } from "@/hooks/apartments";
import { useFavorites, useFavoriteToggle } from "@/hooks/favorites";
import { useColors } from "@/hooks/useTheme";
import { useLightStatusBar } from "@/hooks/useLightStatusBar";
import { useReviewEligibility } from "@/hooks/ratings";
import { useCurrentUserId } from "@/hooks/auth";
import { getInquiryConversationId } from "@/service/chat/chatRoutes";
import { buildApartmentShareMessage } from "@/service/apartments/apartmentShare";
import { getApplyDisabledReason } from "@/service/apartments/applyEligibility";

import { Button } from "heroui-native";

// Height of the floating back/share/favorite row below the status bar.
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
  const sectionsOffsetY = useRef(0);
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
    apartment && { status: apartment.status, landlordId: apartment.landlord?.id },
    currentUserId,
  );

  // White status-bar icons only while a hero photo sits behind them; the
  // skeleton, error screen and photo-less hero have light backgrounds.
  useLightStatusBar(apartmentImages.length > 0 && !isPastHero);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const pastHero =
      event.nativeEvent.contentOffset.y >
      APARTMENT_HERO_HEIGHT - insets.top - FLOATING_BUTTONS_HEIGHT;
    setIsPastHero((current) => (current === pastHero ? current : pastHero));
  };

  const handleJumpToRatings = () => {
    // Leave the section header clear of the status bar and floating buttons.
    const y = Math.max(
      0,
      ratingsOffsetY.current - insets.top - FLOATING_BUTTONS_HEIGHT,
    );
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  const handleShare = async () => {
    if (!apartment) return;

    try {
      await Share.share({
        message: buildApartmentShareMessage(apartment),
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

        <View
          className="gap-3 mt-3"
          onLayout={(event) => {
            sectionsOffsetY.current = event.nativeEvent.layout.y;
          }}
        >
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
              ratingsOffsetY.current =
                sectionsOffsetY.current + event.nativeEvent.layout.y;
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
          <IconShare2 size={24} color={colors.secondaryForeground} />
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
