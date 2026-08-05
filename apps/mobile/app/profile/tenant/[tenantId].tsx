import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import ProfileStatsCard from 'components/cards/ProfileStatsCard'
import PastApartmentCard from 'components/cards/PastApartmentCard'
import ProfileHeader from '@/app/(tabs)/components/profile/ProfileHeader'

import { Button, SkeletonGroup } from 'heroui-native'

import { supabase } from '@repo/supabase'

import { usePublicTenantProfile } from 'hooks/profiles'
import { useColors } from 'hooks/useTheme'

import {
  IconShieldCheck,
  IconCalendarMonth,
  IconStar,
  IconMapPin,
  IconPhone,
  IconMail,
  IconMessageCircle,
  IconHomeSearch,
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

  const { profile, pastApartments, loading, refetch } = usePublicTenantProfile(resolvedTenantId);

  const firstName = profile?.fullName.split(' ')[0] ?? 'Tenant';

  const avatarInitials = useMemo(
    () =>
      profile?.fullName
        .split(' ')
        .map((name) => name[0])
        .join('')
        .toUpperCase() ?? 'U',
    [profile?.fullName]
  );

  const handleMessageTenant = async () => {
    if (!profile || !resolvedTenantId || !resolvedApartmentId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: landlord } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!landlord) return

    const landlordId = landlord.id
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
        otherUserPhoneNumber: profile.phoneNumber,
        apartmentId: resolvedApartmentId,
      },
    })
  }

  return (
    <ScreenWrapper
      bottomPadding={50}
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
        role="tenant"
        accountStatus={profile?.isVerified ? 'verified' : (profile ? 'unverified' : null)}
      />

      {/* Stats */}
      <View className="mx-5 mt-5">
        <ProfileStatsCard
          stats={[
            {
              label: 'Reviews',
              value: String(profile?.reviewsCount ?? 0),
              icon: IconStar,
              iconColor: colors.secondary,
            },
            {
              label: 'Member Since',
              value: profile?.memberSinceYear ?? '—',
              icon: IconCalendarMonth,
              iconColor: colors.textPrimary,
            },
            {
              label: 'Identity',
              value: profile?.isVerified ? 'Verified' : 'Unverified',
              icon: IconShieldCheck,
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
            <Text className="text-base text-foreground font-interMedium">
              {profile?.phoneNumber ?? '—'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <IconMapPin size={20} color={colors.textPrimary} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-inter">
              Location / Based In
            </Text>
            <Text className="text-base text-foreground font-interMedium">
              {profile?.location ?? '—'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3">
          <IconMail size={20} color={colors.textPrimary} />
          <View className="flex-1">
            <Text className="text-xs text-muted font-inter">
              Email
            </Text>
            <Text className="text-base text-foreground font-interMedium">
              {profile?.email ?? '—'}
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
        <Text className="text-foreground text-xl font-interSemiBold">
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
            <Text className="text-foreground text-xl font-interSemiBold text-center">
              No rental history yet
            </Text>
            <Text className="text-gray-400 text-base font-inter text-center">
              This tenant has no completed leases on the platform yet.
            </Text>
          </View>
        ) : (
          <View className="mt-3 gap-3">
            {pastApartments.map((apartment) => (
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
              />
            ))}
          </View>
        )}
      </View>

      {/* Error / not found state */}
      {!loading && !profile && (
        <View className="items-center justify-center py-24 gap-3">
          <Text className="text-muted font-interSemiBold text-center">
            Could not load tenant profile.
          </Text>
          <Button size="sm" variant="outline" onPress={() => refetch()}>
            <Button.Label>Retry</Button.Label>
          </Button>
        </View>
      )}
    </ScreenWrapper>
  );
}