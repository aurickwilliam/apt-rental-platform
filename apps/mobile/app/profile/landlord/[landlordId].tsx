import {
  View,
  Text,
  FlatList,
  Pressable,
} from 'react-native'
import { useMemo, useState } from 'react'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import ApartmentCard from 'components/cards/ApartmentCard'
import ProfileStatsCard from 'components/cards/ProfileStatsCard'
import RatingCard from 'components/cards/RatingCard'
import RatingCardSkeleton from 'components/cards/RatingCardSkeleton'
import ProfileHeader from '@/app/(tabs)/components/profile/ProfileHeader'

import { Button, SkeletonGroup } from "heroui-native"

import { usePublicLandlordProfile } from 'hooks/profiles'
import { useColors } from 'hooks/useTheme'

import {
  IconFlag,
  IconMessageCircle,
  IconMapPin,
  IconPhone,
  IconCalendarMonth,
  IconBuildingSkyscraper,
  IconStar,
} from '@tabler/icons-react-native';

export default function PublicLandlordProfile() {
  const { landlordId, apartmentId } = useLocalSearchParams<{
    landlordId?: string | string[],
    apartmentId?: string | string[],
  }>();
  const router = useRouter();
  const { colors } = useColors();

  const resolvedLandlordId = useMemo(
    () => (Array.isArray(landlordId) ? landlordId[0] : landlordId),
    [landlordId]
  );

  const resolvedApartmentId = useMemo(
    () => (Array.isArray(apartmentId) ? apartmentId[0] : apartmentId),
    [apartmentId]
  );

  const {
    profile,
    listings,
    stats,
    reviews,
    totalReviews,
    loading,
    reviewsLoading,
  } = usePublicLandlordProfile(resolvedLandlordId);

  const fullName = useMemo(() => {
    const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim();
    return name || 'Landlord';
  }, [profile?.first_name, profile?.last_name]);

  const firstName = fullName.split(' ')[0] || 'Landlord';

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return '—';
    const parsed = new Date(profile.created_at);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('default', { month: 'long', year: 'numeric' });
  }, [profile?.created_at]);

  const location = [profile?.city, profile?.province].filter(Boolean).join(', ') || '—';

  const avatarInitials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase();

  const VISIBLE_LISTING_LIMIT = 5;
  const [showAllListings, setShowAllListings] = useState(false);
  const visibleListings = showAllListings
    ? listings
    : listings.slice(0, VISIBLE_LISTING_LIMIT);

  // TODO: Implement function to handle report landlord
  const handleReportLandlord = () => {
    console.log("Report Landlord Pressed");
  }

  const handleMessageLandlord = () => {
    if (!resolvedLandlordId) return;

    // Use the same ID format as ApartmentScreen when apartmentId is available,
    // otherwise fall back to the generic one
    const conversationId = resolvedApartmentId
      ? `inquiry-${resolvedApartmentId}-${resolvedLandlordId}`
      : `inquiry-${resolvedLandlordId}`;

    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId,
        otherUserId: resolvedLandlordId,
        otherUserName: fullName || 'Landlord',
        otherUserAvatar: profile?.avatar_url ?? '',
        otherUserPhoneNumber: profile?.mobile_number ?? '',
        ...(resolvedApartmentId ? { apartmentId: resolvedApartmentId } : {}),
      },
    });
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Landlord Profile" />}
    >
      <ProfileHeader
        backgroundPhotoUri={profile?.background_url}
        avatarUrl={profile?.avatar_url}
        firstName={profile?.first_name}
        lastName={profile?.last_name}
        email={profile?.email}
        avatarInitials={avatarInitials}
        loading={loading}
        accountStatus={profile?.account_status}
      />

      {/* Landlord Stats */}
      <View className="mx-5 mt-5">
        <ProfileStatsCard
          stats={[
            {
              label: 'Properties',
              value: String(stats.totalProperties),
              icon: IconBuildingSkyscraper,
              iconColor: colors.primary,
            },
            {
              label: 'Average Rating',
              value: `${stats.averageRating}/5`,
              valueColor: 'text-secondary',
            },
            {
              label: 'Reviews',
              value: String(totalReviews),
              icon: IconStar,
              iconColor: colors.secondary,
            },
          ]}
        />
      </View>

      {/* Personal Information */}
      <View className="mx-5 mt-5 bg-surface rounded-3xl border border-border shadow-none p-4 gap-4">
        <View className="flex-row items-center gap-3">
          <IconMapPin size={20} color={colors.textPrimary} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-inter">
              Location / Based In
            </Text>
            <Text className="text-base text-foreground font-interMedium">
              {location}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <IconPhone size={20} color={colors.textPrimary} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-inter">
              Contact Number
            </Text>
            <Text className="text-base text-foreground font-interMedium">
              {profile?.mobile_number ?? '—'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <IconCalendarMonth size={20} color={colors.textPrimary} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-inter">
              Member Since
            </Text>
            <Text className="text-base text-foreground font-interMedium">
              {memberSince}
            </Text>
          </View>
        </View>
      </View>

      {/* Message Action */}
      <View className="mx-5 mt-5">
        <Button
          size="md"
          className="w-full"
          onPress={handleMessageLandlord}
          isDisabled={!resolvedLandlordId}
        >
          <IconMessageCircle size={20} color="white" />
          <Button.Label>Message Landlord</Button.Label>
        </Button>
      </View>

      {/* Listings */}
      <View className="mt-8">
        <Text className="text-foreground text-xl font-interSemiBold mx-5">
          {firstName}&apos;s Listings
        </Text>

        {loading ? (
          <View className="mx-5 mt-3">
            <SkeletonGroup isLoading className="flex-row gap-3">
              <SkeletonGroup.Item className="flex-1 h-72 rounded-3xl" />
              <SkeletonGroup.Item className="flex-1 h-72 rounded-3xl" />
            </SkeletonGroup>
          </View>
        ) : listings.length === 0 ? (
          <View className="items-center py-12 px-8 gap-3">
            <IconBuildingSkyscraper size={64} color={colors.primary} />
            <Text className="text-foreground text-xl font-interSemiBold text-center">
              No listings yet
            </Text>
            <Text className="text-gray-400 text-base font-inter text-center">
              This landlord hasn&apos;t published any apartments yet.
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={visibleListings}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ paddingHorizontal: 16, gap: 8 }}
              contentContainerStyle={{
                paddingBottom: 16,
                gap: 16,
                marginTop: 12,
              }}
              renderItem={({ item }) => (
                <ApartmentCard
                  {...item}
                  isGrid={true}
                  onPress={() => router.push(`/apartment/${item.id}`)}
                />
              )}
            />

            {listings.length > VISIBLE_LISTING_LIMIT && (
              <Pressable
                onPress={() => setShowAllListings((prev) => !prev)}
                hitSlop={8}
                className="items-center py-1"
              >
                <Text className="text-accent text-sm font-interMedium">
                  {showAllListings
                    ? 'Show less'
                    : `See more (${listings.length - VISIBLE_LISTING_LIMIT} more)`}
                </Text>
              </Pressable>
            )}
          </>
        )}
      </View>

      {/* Reviews */}
      <View className="mt-8 mx-5">
        <Text className="text-foreground text-xl font-interSemiBold">
          Recent Reviews
        </Text>

        {reviewsLoading ? (
          <View className="mt-3 gap-4">
            <RatingCardSkeleton />
            <RatingCardSkeleton />
          </View>
        ) : totalReviews === 0 ? (
          <View className="items-center py-12 px-8 gap-3">
            <IconStar size={64} color={colors.primary} />
            <Text className="text-foreground text-xl font-interSemiBold text-center">
              No reviews yet
            </Text>
            <Text className="text-gray-400 text-base font-inter text-center">
              Reviews from tenants who rented this landlord&apos;s apartments will
              appear here.
            </Text>
          </View>
        ) : (
          <View className="mt-3 gap-3">
            {reviews.map((review) => (
              <RatingCard key={review.id} {...review} />
            ))}
          </View>
        )}
      </View>

      {/* Report Button */}
      <View className="mt-12 mb-4 mx-5 flex items-center justify-center">
        <Button variant="tertiary" size="md" onPress={handleReportLandlord}>
          <IconFlag size={20} color={colors.danger} />
          <Button.Label className="text-danger font-interMedium">
            Report {firstName}
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  );
}
