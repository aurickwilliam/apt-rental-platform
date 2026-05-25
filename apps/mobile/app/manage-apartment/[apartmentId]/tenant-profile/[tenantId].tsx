import { View, Text, Image } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { COLORS } from '@repo/constants'
import { DEFAULT_IMAGES } from '@/constants/images'
import { supabase } from '@repo/supabase'

import { IconMessage, IconRosetteDiscountCheckFilled } from '@tabler/icons-react-native'
import { Button, Avatar } from 'heroui-native'
import PastApartmentCard from './components/PastApartmentCard'

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
      <View className="w-full h-40 bg-gray-200 rounded-xl" />
      <View className="items-center gap-2">
        <View className="size-24 rounded-full bg-gray-200" />
        <View className="h-6 w-40 bg-gray-200 rounded-full" />
        <View className="h-4 w-56 bg-gray-100 rounded-full" />
      </View>
      <View className="flex-row justify-around mt-3">
        {[1, 2, 3].map((i) => (
          <View key={i} className="items-center gap-2">
            <View className="h-4 w-16 bg-gray-100 rounded-full" />
            <View className="h-8 w-10 bg-gray-200 rounded-full" />
            <View className="h-4 w-12 bg-gray-100 rounded-full" />
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
  }>()

  const router = useRouter()

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
      backgroundColor={COLORS.darkerWhite}
    >
      {loading ? (
        <ProfileSkeleton />
      ) : tenantData ? (
        <>
          {/* ── Header: background + avatar + name ── */}
          <View className="relative h-80">
            {/* Background band */}
            <View className="w-full h-40 bg-primary" />

            {/* Avatar + name block */}
            <View className="absolute top-8 left-0 right-0 items-center">
              <Avatar
                size="lg"
                color="accent"
                className="size-50 border-[6px] border-primary mb-5"
                alt={tenantData.fullName}
              >
                {tenantData.avatarUrl ? (
                  <Avatar.Image source={{ uri: tenantData.avatarUrl }} />
                ) : null}
                <Avatar.Fallback delayMs={200}>
                  <Text className="text-primary text-3xl font-interMedium">
                    {avatarInitials}
                  </Text>
                </Avatar.Fallback>
              </Avatar>

              <View className="flex items-center justify-center">
                <Text className="text-text text-2xl font-interSemiBold">
                  {tenantData.fullName}
                </Text>
                <Text className="text-grey-500 text-lg font-inter">
                  {tenantData.email}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Stats row ── */}
          <View className="mx-5 mt-5 p-4 border-t border-b border-grey-300 flex-row items-center justify-between">
            <View className="flex items-center gap-1 w-1/3">
              <Text className="text-base text-grey-500 font-inter">Reviews</Text>
              <Text className="text-3xl text-text font-interMedium">
                {tenantData.noReviews}
              </Text>
              <Text className="text-base text-grey-500 font-inter">Total</Text>
            </View>

            <View className="w-px h-full bg-grey-300" />

            <View className="flex items-center gap-1 w-1/3">
              <Text className="text-base text-grey-500 font-inter">Member</Text>
              <Text className="text-2xl text-text font-interMedium">
                {tenantData.memberSinceYear}
              </Text>
              <Text className="text-base text-grey-500 font-interMedium">Since</Text>
            </View>

            <View className="w-px h-full bg-grey-300" />

            <View className="flex items-center gap-1 w-1/3">
              <Text className="text-base text-grey-500 font-inter">Identity</Text>
              <IconRosetteDiscountCheckFilled
                size={32}
                color={tenantData.isVerified ? COLORS.primary : COLORS.grey}
              />
              <Text className="text-base text-grey-500 font-interMedium">
                {tenantData.isVerified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>

          {/* ── Personal info + message button ── */}
          <View className="mt-8 mx-5">
            <View className="flex-row items-center">
              <View className="flex w-1/2">
                <Text className="text-xs text-grey-500 font-inter">Contact Number</Text>
                <Text className="text-base text-text font-interMedium">
                  {tenantData.phoneNumber}
                </Text>
              </View>

              <View className="flex w-1/2">
                <Text className="text-xs text-grey-500 font-inter">Location / Based In</Text>
                <Text className="text-base text-text font-interMedium">
                  {tenantData.location}
                </Text>
              </View>
            </View>

            <View className="mt-5">
              <Button
                size="sm"
                variant="outline"
                onPress={handleMessageTenant}
              >
                <IconMessage size={20} color={COLORS.grey} />
                <Button.Label>Message</Button.Label>
              </Button>
            </View>
          </View>

          {/* ── Past apartments ── */}
          <View className="m-5">
            <Text className="text-text text-xl font-interSemiBold">
              {getFirstName(tenantData.fullName)}&apos;s Past Listings
            </Text>

            {pastApartments.length === 0 ? (
              <Text className="text-grey-500 font-inter mt-3">
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
                    onPress={() => console.log(`Pressed on apartment ${apartment.name}`)}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      ) : (
        /* ── Error / not found state ── */
        <View className="flex-1 items-center justify-center py-24 gap-3">
          <Text className="text-grey-500 font-interSemiBold text-center">
            Could not load tenant profile.
          </Text>
          <Button size="sm" variant="outline" onPress={fetchTenantProfile}>
            <Button.Label>Retry</Button.Label>
          </Button>
        </View>
      )}
    </ScreenWrapper>
  )
}