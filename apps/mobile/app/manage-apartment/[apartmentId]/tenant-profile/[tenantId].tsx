import { View, Text, Image } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PastApartmentCard from './components/PastApartmentCard'

import { DEFAULT_IMAGES } from '@/constants/images'

import { supabase } from '@repo/supabase'

import { IconMessage, IconRosetteDiscountCheckFilled } from '@tabler/icons-react-native'

import { Button, Avatar } from 'heroui-native'

import { useColors } from '@/hooks/useTheme'

type TenantData = {
  fullName: string
  email: string
  phoneNumber: string
  location: string
  memberSinceYear: string
  isVerified: boolean
  avatarUrl: string | null
  noReviews: number
}

type PastApartment = {
  id: string
  name: string
  city: string
  barangay: string
  leaseStartMonth: string
  leaseStartYear: string
  leaseEndMonth: string
  leaseEndYear: string
  thumbnailUrl: string
}

function formatMonth(isoDate: string | null): string {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleString('default', { month: 'long' })
}

function formatYear(isoDate: string | null): string {
  if (!isoDate) return '—'
  return String(new Date(isoDate).getFullYear())
}

function ProfileSkeleton() {
  return (
    <View className="flex gap-5 mt-3">
      <View className="w-full h-40 bg-surface rounded-xl" />
      <View className="items-center gap-2">
        <View className="size-24 rounded-full bg-surface" />
        <View className="h-6 w-40 bg-surface rounded-full" />
        <View className="h-4 w-56 bg-surface rounded-full" />
      </View>
      <View className="flex-row justify-around mt-3">
        {[1, 2, 3].map((i) => (
          <View key={i} className="items-center gap-2">
            <View className="h-4 w-16 bg-surface rounded-full" />
            <View className="h-8 w-10 bg-surface rounded-full" />
            <View className="h-4 w-12 bg-surface rounded-full" />
          </View>
        ))}
      </View>
    </View>
  )
}

export default function TenantProfile() {
  const { tenantId, apartmentId } = useLocalSearchParams<{
    tenantId: string,
    apartmentId: string
  }>();

  const router = useRouter();
  const { colors } = useColors();

  const [loading, setLoading] = useState(true)
  const [tenantData, setTenantData] = useState<TenantData | null>(null)
  const [pastApartments, setPastApartments] = useState<PastApartment[]>([])

  const fetchTenantProfile = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)

    try {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          first_name,
          last_name,
          email,
          mobile_number,
          avatar_url,
          created_at,
          city,
          province,
          account_status
        `)
        .eq('id', tenantId)
        .single()

      if (userError) throw userError

      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      const location = [user.city, user.province].filter(Boolean).join(', ') || '—'

      setTenantData({
        fullName: `${user.first_name} ${user.last_name}`,
        email: user.email ?? '—',
        phoneNumber: user.mobile_number ?? '—',
        location,
        memberSinceYear: user.created_at
          ? String(new Date(user.created_at).getFullYear())
          : '—',
        isVerified: user.account_status === 'verified',    
        avatarUrl: user.avatar_url ?? null,
        noReviews: reviewCount ?? 0,
      })

      const { data: tenancies } = await supabase
        .from('tenancies')
        .select(`
          id,
          lease_start,
          lease_end,
          apartment:apartments!tenancies_apartment_id_fkey (
            id,
            name,
            barangay,
            city,
            apartment_images (url, is_cover)
          )
        `)
        .eq('tenant_id', tenantId)
        .in('status', ['ended'])
        .order('lease_end', { ascending: false })

      const mapped: PastApartment[] = (tenancies ?? []).map((t) => {
        const apt = t.apartment as {
          id: string
          name: string
          barangay: string
          city: string
          apartment_images: { url: string; is_cover: boolean | null }[]
        }

        // Pick cover image, then first image, then fall back to default
        const images = apt.apartment_images ?? []
        const cover = images.find((img) => img.is_cover) ?? images[0]
        const thumbnailUrl =
          cover?.url ??
          Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail).uri

        return {
          id: t.id,
          name: apt.name,
          city: apt.city,
          barangay: apt.barangay,
          leaseStartMonth: formatMonth(t.lease_start),
          leaseStartYear: formatYear(t.lease_start),
          leaseEndMonth: formatMonth(t.lease_end),
          leaseEndYear: formatYear(t.lease_end),
          thumbnailUrl,
        }
      })

      setPastApartments(mapped)
    } catch (err) {
      console.error('Error fetching tenant profile:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  const handleMessageTenant = async () => {
    if (!tenantData || !tenantId || !apartmentId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const landlordId = profile.id
    const userA = landlordId < tenantId ? landlordId : tenantId
    const userB = landlordId < tenantId ? tenantId : landlordId
    const conversationId = `${userA}-${userB}-${apartmentId}`

    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId,
        otherUserId: tenantId,
        otherUserName: tenantData.fullName,
        otherUserAvatar: tenantData.avatarUrl ?? '',
        otherUserPhoneNumber: tenantData.phoneNumber,
        apartmentId,
      },
    })
  }

  useFocusEffect(
    useCallback(() => {
      fetchTenantProfile()
    }, [fetchTenantProfile])
  )

  const avatarInitials = tenantData?.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? 'U'

  const getFirstName = (fullName: string) => fullName.split(' ')[0]

  return (
    <ScreenWrapper
      bottomPadding={50}
      scrollable
      header={<StandardHeader title="Tenant Profile" />}
    >
      {loading ? (
        <ProfileSkeleton />
      ) : tenantData ? (
        <>
          {/* ── Header: background + avatar + name ── */}
          <View className="relative h-80">
            {/* Background band */}
            <View className="w-full h-45 bg-surface-tertiary rounded-b-3xl" />

            {/* Avatar + name block */}
            <View className="absolute top-18 left-0 right-0 items-center">
              <Avatar
                size="lg"
                color="accent"
                className="size-36 border-4 border-surface mb-1"
                alt={tenantData.fullName}
              >
                {tenantData.avatarUrl && (
                  <Avatar.Image source={{ uri: tenantData.avatarUrl }} />
                )}

                <Avatar.Fallback
                  delayMs={200}
                  className="justify-center items-center"
                >
                  <Text className="text-accent text-4xl font-interMedium leading-none mt-3">
                    {/* mt-3 compensates for font-interMedium's vertical metrics 
                    so the initials sit centered in the circle */}
                    {avatarInitials ?? ""}
                  </Text>
                </Avatar.Fallback>
              </Avatar>

              <View className="flex items-center justify-center">
                <Text className="text-foreground text-xl font-interSemiBold">
                  {tenantData.fullName}
                </Text>
                <Text className="text-muted text-base font-inter">
                  {tenantData.email}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Stats row ── */}
          <View className="mx-5 p-4 border-t border-b border-border flex-row items-center justify-between">
            <View className="flex items-center gap-1 w-1/3">
              <Text className="text-base text-muted font-inter">
                Reviews
              </Text>

              <Text className="text-3xl text-foreground font-interMedium">
                {tenantData.noReviews}
              </Text>

              <Text className="text-base text-muted font-inter">
                Total
              </Text>
            </View>

            <View className="w-px h-full bg-border" />

            <View className="flex items-center gap-1 w-1/3">
              <Text className="text-base text-muted font-inter">
                Member
              </Text>

              <Text className="text-2xl text-foreground font-interMedium">
                {tenantData.memberSinceYear}
              </Text>

              <Text className="text-base text-muted font-interMedium">
                Since
              </Text>
            </View>

            <View className="w-px h-full bg-border" />

            <View className="flex items-center gap-1 w-1/3">
              <Text className="text-base text-muted font-inter">
                Identity
              </Text>

              <IconRosetteDiscountCheckFilled
                size={32}
                color={tenantData.isVerified ? colors.primary : colors.gray500}
              />

              <Text className="text-base text-muted font-inter">
                {tenantData.isVerified ? "Verified" : "Unverified"}
              </Text>
            </View>
          </View>

          {/* ── Personal info + message button ── */}
          <View className="mt-8 mx-5">
            <View className="flex-row items-center">
              <View className="flex w-1/2">
                <Text className="text-xs text-muted font-inter">
                  Contact Number
                </Text>
                <Text className="text-base text-foreground font-interMedium">
                  {tenantData.phoneNumber}
                </Text>
              </View>

              <View className="flex w-1/2">
                <Text className="text-xs text-muted font-inter">
                  Location / Based In
                </Text>
                <Text className="text-base text-foreground font-interMedium">
                  {tenantData.location}
                </Text>
              </View>
            </View>

            <View className="mt-5">
              <Button
                size="sm"
                variant="tertiary"
                onPress={handleMessageTenant}
              >
                <IconMessage size={20} color={colors.textPrimary} />
                <Button.Label>Message</Button.Label>
              </Button>
            </View>
          </View>

          {/* Past apartments */}
          <View className="m-5">
            <Text className="text-foreground text-lg font-interSemiBold">
              {getFirstName(tenantData.fullName)}&apos;s Past Listings
            </Text>

            {pastApartments.length === 0 ? (
              <Text className="text-muted font-inter mt-3">
                No past apartments found.
              </Text>
            ) : (
              <View className="flex mt-3 gap-3">
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
        </>
      ) : (
        /* ── Error / not found state ── */
        <View className="flex-1 items-center justify-center py-24 gap-3">
          <Text className="text-muted font-interSemiBold text-center">
            Could not load tenant profile.
          </Text>
          <Button size="sm" variant="outline" onPress={fetchTenantProfile}>
            <Button.Label>Retry</Button.Label>
          </Button>
        </View>
      )}
    </ScreenWrapper>
  );
}