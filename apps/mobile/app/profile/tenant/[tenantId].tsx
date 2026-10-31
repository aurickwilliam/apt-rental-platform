import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import ProfileStatsCard from 'components/cards/ProfileStatsCard'
import PastApartmentCard from 'components/cards/PastApartmentCard'
import RateTenantSheet, { type RateTenantStay } from 'components/ratings/RateTenantSheet'
import StayRatingFooter from 'components/ratings/StayRatingFooter'
import RatingCard from 'components/cards/RatingCard'
import ProfileHeader from '@/app/(tabs)/components/profile/ProfileHeader'

import { Button, SkeletonGroup, useToast } from 'heroui-native'

import { usePublicTenantProfile } from 'hooks/profiles'
import { useCurrentUser } from 'hooks/auth'
import { useTenantReviews } from '@/hooks/ratings'
import { useColors } from 'hooks/useTheme'

import {
  IconShieldCheckFilled,
  IconShieldX,
  IconCalendarMonth,
  IconStar,
  IconMapPin,
  IconPhone,
  IconMail,
  IconMessageCircle,
  IconHomeSearch,
  IconFlag,
  IconStarFilled,
} from '@tabler/icons-react-native';

export default function PublicTenantProfile() {
  const { tenantId, apartmentId } = useLocalSearchParams<{
    tenantId?: string | string[],
    apartmentId?: string | string[],
  }>();

  const router = useRouter();
  const { colors } = useColors();

  const resolvedTenantId = useMemo(
    () => (Array.isArray(tenantId) ? tenantId[0] : tenantId),
    [tenantId]
  );

  const resolvedApartmentId = useMemo(
    () => (Array.isArray(apartmentId) ? apartmentId[0] : apartmentId),
    [apartmentId]
  );

  const { profile, pastApartments, loading } = usePublicTenantProfile(resolvedTenantId);
  const currentUserQuery = useCurrentUser();
  const {
    reviews: landlordReviews,
    average: landlordRating,
    count: landlordRatingCount,
    loading: reviewsLoading,
    isError: reviewsFailed,
    refetch: refetchReviews,
  } = useTenantReviews(resolvedTenantId);
  const viewerId = currentUserQuery.data?.id;
  const { toast } = useToast();
  // The stay being rated in the sheet; kept after closing so the sheet can animate out.
  const [ratingStay, setRatingStay] = useState<RateTenantStay | null>(null);
  const [isRatingOpen, setIsRatingOpen] = useState(false);
  const savedRating = landlordReviews.find((review) => review.tenancyId === ratingStay?.tenancyId && review.isMine);

  const openRatingSheet = (stay: RateTenantStay) => {
    setRatingStay(stay);
    setIsRatingOpen(true);
  };

  const firstName = profile?.fullName.split(' ')[0] ?? 'Tenant';

  const avatarInitials = useMemo(
    () =>
      profile?.fullName
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase() ?? '',
    [profile?.fullName]
  );

  const handleMessageTenant = async () => {
    if (!profile || !resolvedTenantId || !resolvedApartmentId) return

    const landlordId = currentUserQuery.data?.id
    if (!landlordId) return

    const userA = landlordId < resolvedTenantId ? landlordId : resolvedTenantId
    const userB = landlordId < resolvedTenantId ? resolvedTenantId : landlordId
    const conversationId = `${userA}-${userB}-${resolvedApartmentId}`

    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId,
        otherUserId: resolvedTenantId,
        otherUserName: profile.fullName,
        otherUserAvatar: profile.avatarUrl ?? '',
        apartmentId: resolvedApartmentId,
      },
    })
  }

  // Entry point for reporting one landlord rating; replace the toast once the report flow exists.
  const handleReportRating = (_reviewId: string) => {
    toast.show({ variant: 'default', label: 'Reporting ratings is coming soon' })
  }

  // TODO: Implement function to handle report tenant
  const handleReportTenant = () => {
    console.log("Report Tenant Pressed");
  }

  return (
    <ScreenWrapper
      scrollable
      header={<StandardHeader title="Tenant Profile" />}
    >
      <ProfileHeader
        backgroundPhotoUri={null}
        avatarUrl={profile?.avatarUrl}
        firstName={profile?.fullName.split(' ')[0]}
        lastName={profile?.fullName.split(' ').slice(1).join(' ') || null}
        email={profile?.email}
        avatarInitials={avatarInitials}
        loading={loading}
        accountStatus={profile?.isVerified ? 'verified' : (profile ? 'unverified' : null)}
      />

      {/* Stats */}
      <View className="mx-5 mt-5">
        <ProfileStatsCard
          stats={[
            {
              label: 'Rating',
              value: landlordRatingCount > 0 ? landlordRating.toFixed(1) : '—',
              icon: IconStarFilled,
              iconColor: colors.rating,
            },
            {
              label: 'Reviews',
              value: String(profile?.reviewsCount ?? 0),
              icon: IconStar,
              iconColor: colors.rating,
            },
            {
              // Four stats leave no room for a two-line label beside its icon.
              label: 'Joined',
              value: profile?.memberSinceYear ?? '—',
              icon: IconCalendarMonth,
            },
            {
              label: profile?.isVerified ? 'Verified' : 'Unverified',
              variant: 'icon',
              icon: profile?.isVerified ? IconShieldCheckFilled : IconShieldX,
              iconColor: profile?.isVerified ? colors.success : colors.gray500,
            },
          ]}
        />
      </View>

      {/* Personal Information */}
      <View className="mx-5 mt-5 bg-surface rounded-3xl border border-border shadow-none p-4 gap-4">
        <View className="flex-row items-center gap-3">
          <IconPhone size={20} color={colors.textPrimary} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-inter">
              Contact Number
            </Text>
            <Text className="text-base text-foreground font-nunitoSemiBold">
              {profile?.phoneNumber ?? '—'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <IconMail size={20} color={colors.textPrimary} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-inter">
              Email
            </Text>
            <Text className="text-base text-foreground font-nunitoSemiBold">
              {profile?.email ?? '—'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <IconMapPin size={20} color={colors.textPrimary} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-inter">
              Location / Based In
            </Text>
            <Text className="text-base text-foreground font-nunitoSemiBold">
              {profile?.location ?? '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* Message Action */}
      {resolvedApartmentId && profile && (
        <View className="mx-5 mt-5">
          <Button size="md" className="w-full" onPress={handleMessageTenant}>
            <IconMessageCircle size={20} color="white" />
            <Button.Label>Message Tenant</Button.Label>
          </Button>
        </View>
      )}

      {/* Past Apartments */}
      <View className="mx-5 mt-8">
        <Text className="text-foreground text-xl font-nunitoBold">
          {firstName}&apos;s Past Listings
        </Text>

        {loading ? (
          <View className="mt-3 gap-3">
            <SkeletonGroup isLoading>
              <View className="flex-row gap-3">
                <SkeletonGroup.Item className="size-30 rounded-3xl" />
                <View className="flex-1 gap-2 py-1">
                  <SkeletonGroup.Item className="h-5 w-3/4 rounded-md" />
                  <SkeletonGroup.Item className="h-4 w-1/2 rounded-md" />
                  <SkeletonGroup.Item className="h-4 w-2/3 rounded-md mt-auto" />
                </View>
              </View>
            </SkeletonGroup>
          </View>
        ) : pastApartments.length === 0 ? (
          <View className="items-center py-12 px-8 gap-3">
            <IconHomeSearch size={64} color={colors.primary} />
            <Text className="text-foreground text-xl font-nunitoBold text-center">
              No rental history yet
            </Text>
            <Text className="text-gray-400 text-base font-inter text-center">
              This tenant has no completed leases on the platform yet.
            </Text>
          </View>
        ) : (
          <View className="mt-3 gap-3">
            {pastApartments.map((apartment) => {
              const myReview = landlordReviews.find(
                (review) => review.tenancyId === apartment.id && review.isMine,
              )
              const canRate = Boolean(viewerId) && apartment.landlordId === viewerId

              return (
                <PastApartmentCard
                  key={apartment.id}
                  apartmentName={apartment.name}
                  barangay={apartment.barangay}
                  city={apartment.city}
                  leaseStartMonth={apartment.leaseStartMonth}
                  leaseStartYear={apartment.leaseStartYear}
                  leaseEndMonth={apartment.leaseEndMonth}
                  leaseEndYear={apartment.leaseEndYear}
                  thumbnailUrl={apartment.thumbnailUrl}
                  onPress={() =>
                    console.log(`Pressed on apartment ${apartment.name}`)
                  }
                  footer={
                    canRate ? (
                      <StayRatingFooter
                        rating={myReview?.rating ?? null}
                        onPress={() => openRatingSheet({ tenancyId: apartment.id, apartmentName: apartment.name })}
                      />
                    ) : undefined
                  }
                />
              )
            })}
          </View>
        )}
      </View>

      {/* Landlord ratings */}
      <View className="mx-5 mt-8">
        <Text className="text-foreground text-xl font-nunitoBold">
          What landlords say about {firstName}
        </Text>

        {landlordReviews.length === 0 ? (
          <View className="items-center py-10 px-8 gap-3">
            <IconStar size={48} color={colors.primary} />
            <Text className="text-foreground text-lg font-nunitoBold text-center">
              No landlord ratings yet
            </Text>
            <Text className="text-gray-400 text-base font-inter text-center">
              Landlords can rate a tenant once their lease has ended.
            </Text>
          </View>
        ) : (
          <View className="mt-3 gap-3">
            {landlordReviews.map((review) => (
              <RatingCard
                key={review.id}
                name={review.landlordName}
                date={review.createdAt}
                rating={review.rating}
                review={review.comment}
                profilePictureUrl={review.landlordAvatarUrl ?? undefined}
                apartmentName={review.apartmentName ?? undefined}
                footer={
                  review.isMine ? undefined : (
                    <Button
                      size="sm"
                      variant="tertiary"
                      className="self-start"
                      accessibilityLabel="Report this rating"
                      onPress={() => handleReportRating(review.id)}
                    >
                      <IconFlag size={14} color={colors.danger} />
                      <Button.Label className="text-danger font-nunitoSemiBold">Report</Button.Label>
                    </Button>
                  )
                }
              />
            ))}
          </View>
        )}
      </View>

      {/* Report Button */}
      <View className="mt-12 mb-4 mx-5 flex items-center justify-center">
        <Button variant="tertiary" size="md" onPress={handleReportTenant}>
          <IconFlag size={20} color={colors.danger} />
          <Button.Label className="text-danger font-nunitoSemiBold">
            Report {firstName}
          </Button.Label>
        </Button>
      </View>

      {resolvedTenantId && (
        <RateTenantSheet
          isOpen={isRatingOpen}
          onClose={() => setIsRatingOpen(false)}
          tenantId={resolvedTenantId}
          tenantName={profile?.fullName ?? 'this tenant'}
          stay={ratingStay}
          savedRating={savedRating ? { rating: savedRating.rating, comment: savedRating.comment } : null}
          isLoadingSaved={reviewsLoading}
          loadFailed={reviewsFailed}
          onRetry={() => void refetchReviews()}
        />
      )}
    </ScreenWrapper>
  );
}
