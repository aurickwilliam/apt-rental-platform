import { View, Text, Image, TouchableOpacity, FlatList } from 'react-native'
import ImageViewing from 'react-native-image-viewing'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState, useCallback } from 'react'
import { useFocusEffect } from '@react-navigation/native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PillButton from '@/components/buttons/PillButton'
import TenantCard from './components/TenantCard'
import PaymentHistoryCard from './components/PaymentHistoryCard'
import MaintenanceRequestCard from './components/MaintenanceRequestCard'

import { Button, Menu, Dialog } from 'heroui-native'

import {
  IconBath,
  IconBed,
  IconHome,
  IconMaximize,
  IconUser,
  IconCircleCheckFilled,
  IconLogout2,
  IconCircleX,
  IconDotsVertical,
  IconBuildingOff,
  IconArmchair,
  IconCalendar,
  IconUsers,
  IconBuildingCommunity,
} from '@tabler/icons-react-native'

import { IMAGES } from '@/constants/images'

import { supabase } from '@repo/supabase'

import { useColors } from '@/hooks/useTheme'

type ApartmentStatus = 'Available' | 'Occupied' | 'Under Maintenance' | 'Unverified' | 'Verified'

type ApartmentImage = {
  id: string
  url: string
}

type Tenant = {
  id: string
  fullName: string
  email: string
  mobileNumber: string
  avatarUrl: string | null
  leaseStartMonthYear: string
  leaseEndMonthYear: string
}

type MaintenanceRequest = {
  id: string
  title: string
  reportedDate: string
}

type PaymentRecord = {
  id: string
  month: string
  year: string
  amount: number
  paidDate: string
  status: 'paid' | 'partial'
}

type ApartmentDetail = {
  name: string
  street_address: string
  barangay: string
  city: string
  province: string
  zip_code: number | null
  status: ApartmentStatus
  monthlyRent: number
  type: string
  noBedrooms: number
  noBathrooms: number
  areaSqm: number
  averageRating: number | null
  noRatings: number
  furnishedType: string
  floorLevel: string
  maxOccupants: number
  leaseDuration: string
}

function formatMonthYear(isoDate: string | null): string {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  return d.toLocaleString('default', { month: 'short', year: 'numeric' })
}

function formatPaymentDate(isoDate: string): string {
  const d = new Date(isoDate)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

function DetailSkeleton() {
  return (
    <View className="flex gap-5 mt-3">
      <View className="flex-row gap-3 mb-3">
        {[1, 2].map((i) => (
          <View key={i} className="rounded-2xl w-48 h-60 bg-surface" />
        ))}
      </View>
      <View className="h-8 bg-surface rounded-full w-2/3" />
      <View className="h-4 bg-surface rounded-full w-1/2" />
      <View className="h-5 bg-surface rounded-full w-1/3" />
      <View className="flex-row gap-3">
        {[1, 2, 3].map((i) => (
          <View key={i} className="h-4 bg-surface-secondary rounded-full w-1/4" />
        ))}
      </View>
    </View>
  )
}

export default function Index() {
  const router = useRouter()
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()
  const { colors } = useColors();

  const [imageIndex, setImageIndex] = useState(0)
  const [isImageViewVisible, setIsImageViewVisible] = useState(false)
  const [open, setOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [apartment, setApartment] = useState<ApartmentDetail | null>(null)
  const [images, setImages] = useState<ApartmentImage[]>([])
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequest | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])

  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [isVacateDialogOpen, setIsVacateDialogOpen] = useState(false)

  const fetchApartmentDetail = useCallback(async () => {
    if (!apartmentId) return
    setLoading(true)

    try {
      // Get the full information of the apartment
      const { data: aptData, error: aptError } = await supabase
        .from('apartments')
        .select(`
          name,
          street_address,
          barangay,
          city,
          province,
          zip_code,
          status,
          monthly_rent,
          type,
          no_bedrooms,
          no_bathrooms,
          area_sqm,
          average_rating,
          no_ratings,
          apartment_images (id, url, is_cover),
          furnished_type,
          floor_level,
          max_occupants,
          lease_duration
        `)
        .eq('id', apartmentId)
        .is('deleted_at', null)
        .single()

      if (aptError) throw aptError

      const rawStatus = aptData.status
        ? aptData.status.charAt(0).toUpperCase() + aptData.status.slice(1)
        : 'Unverified'

      const validStatuses: ApartmentStatus[] = ['Available', 'Occupied', 'Under Maintenance', 'Unverified', 'Verified']
      const status = validStatuses.includes(rawStatus as ApartmentStatus)
        ? (rawStatus as ApartmentStatus)
        : 'Unverified'

      setApartment({
        name: aptData.name,
        street_address: aptData.street_address,
        barangay: aptData.barangay,
        city: aptData.city,
        province: aptData.province,
        zip_code: aptData.zip_code ?? null,
        status,
        monthlyRent: Number(aptData.monthly_rent ?? 0),
        type: aptData.type ?? '—',
        noBedrooms: aptData.no_bedrooms ?? 0,
        noBathrooms: aptData.no_bathrooms ?? 0,
        areaSqm: Number(aptData.area_sqm ?? 0),
        averageRating: aptData.average_rating ? Number(aptData.average_rating) : null,
        noRatings: aptData.no_ratings ?? 0,
        furnishedType: aptData.furnished_type ?? '—',
        floorLevel: aptData.floor_level ?? '—',
        maxOccupants: aptData.max_occupants ?? 0,
        leaseDuration: aptData.lease_duration ?? '—',
      })

      // Get the images and sort by cover first
      const rawImages: { id: string; url: string; is_cover: boolean | null }[] =
        aptData.apartment_images ?? []
      const sorted = [...rawImages].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0))
      setImages(sorted.map((img) => ({ id: img.id, url: img.url })))

      // Get the active tenant of the apt
      const { data: tenancyData } = await supabase
        .from('tenancies')
        .select(`
          id,
          lease_start,
          lease_end,
          tenant:users!tenancies_tenant_id_fkey (
            id,
            first_name,
            last_name,
            mobile_number,
            email,
            avatar_url
          )
        `)
        .eq('apartment_id', apartmentId)
        .eq('status', 'active')
        .maybeSingle()

      if (tenancyData?.tenant) {
        const t = tenancyData.tenant as {
          id: string
          first_name: string
          last_name: string
          mobile_number: string
          email: string | null
          avatar_url: string | null
        }
        setTenant({
          id: t.id,
          fullName: `${t.first_name} ${t.last_name}`,
          email: t.email ?? '—',
          mobileNumber: t.mobile_number,
          avatarUrl: t.avatar_url,
          leaseStartMonthYear: formatMonthYear(tenancyData.lease_start),
          leaseEndMonthYear: formatMonthYear(tenancyData.lease_end),
        })
      } else {
        setTenant(null)
      }

      // Get the most recent pending/in_progress maintenance request, if any
      const { data: maintData } = await supabase
        .from('maintenance_request')
        .select('id, title, created_at')
        .eq('apartment_id', apartmentId)
        .in('status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (maintData) {
        setMaintenanceRequest({
          id: maintData.id,
          title: maintData.title,
          reportedDate: new Date(maintData.created_at).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          }),
        })
      } else {
        setMaintenanceRequest(null)
      }

      // Get the 4 most recent paid/partial rent payments for this apartment
      const { data: payments } = await supabase
        .from('payment')
        .select('id, amount, date, status')
        .eq('apartment_id', apartmentId)
        .in('status', ['paid', 'partial'])
        .order('date', { ascending: false })
        .limit(4)

      const mapped: PaymentRecord[] = (payments ?? []).map((p) => {
        const d = new Date(p.date)
        return {
          id: p.id,
          month: d.toLocaleString('default', { month: 'long' }),
          year: String(d.getFullYear()),
          amount: Number(p.amount ?? 0),
          paidDate: formatPaymentDate(p.date),
          status: p.status as 'paid' | 'partial',
        }
      })
      setPaymentHistory(mapped)
    } catch (err) {
      console.error('Error fetching apartment detail:', err)
    } finally {
      setLoading(false)
    }
  }, [apartmentId])

  useFocusEffect(
    useCallback(() => {
      fetchApartmentDetail()
    }, [fetchApartmentDetail])
  )

  const handleImagePress = (index: number) => {
    setImageIndex(index)
    setIsImageViewVisible(true)
  }

  const handleVacateUnit = () => {
    setOpen(false)
    setIsVacateDialogOpen(true)
  }

  const handleConfirmVacate = async () => {
    if (!apartmentId) return
    try {
      const { error } = await supabase
        .from('tenancies')
        .update({ status: 'inactive' })
        .eq('apartment_id', apartmentId)
        .eq('status', 'active')

      if (error) throw error

      await supabase
        .from('apartments')
        .update({ status: 'available' })
        .eq('id', apartmentId)

      setIsVacateDialogOpen(false)
      fetchApartmentDetail()
    } catch (err) {
      console.error('Error vacating unit:', err)
      setIsVacateDialogOpen(false)
    }
  }

  const handleRemoveUnit = async () => {
    if (!apartmentId) return

    try {
      const { error } = await supabase
        .from('apartments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', apartmentId)

      if (error) throw error

      setIsRemoveDialogOpen(false)
      router.back()
    } catch (err) {
      console.error('Error removing unit:', err)
      setIsRemoveDialogOpen(false)
    }
  }

  const handleTenantProfilePress = (tenantId: string) => {
    router.push(`/manage-apartment/${apartmentId}/tenant-profile/${tenantId}`)
  }

  const handleMessageTenant = async () => {
    if (!tenant || !apartmentId) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return

    const landlordId = profile.id
    const tenantId = tenant.id

    // Mirror the LEAST/GREATEST logic from get_conversations
    const userA = landlordId < tenantId ? landlordId : tenantId
    const userB = landlordId < tenantId ? tenantId : landlordId
    const conversationId = `${userA}-${userB}-${apartmentId}`

    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId,
        otherUserId: tenantId,
        otherUserName: tenant.fullName,
        otherUserAvatar: tenant.avatarUrl ?? '',
        otherUserPhoneNumber: tenant.mobileNumber,
        apartmentId,
      },
    })
  }

  const isOccupied = apartment?.status === 'Occupied'

  return (
    <View style={{ flex: 1 }}>
      <ScreenWrapper
        className="p-5"
        header={
          <StandardHeader 
            title="Property" 
            onBackPress={() => router.replace('/(tabs)/(landlord)/units')}
          />
        }
        scrollable
        bottomPadding={50}
      >
        {loading ? (
          <DetailSkeleton />
        ) : apartment ? (
          <>
            {/* Image Carousel */}
            {images.length > 0 && (
              <View>
                <FlatList
                  data={images}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  contentContainerClassName="gap-3 mb-3"
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      className="rounded-2xl overflow-hidden w-48 h-60"
                      activeOpacity={0.7}
                      onPress={() => handleImagePress(index)}
                    >
                      <Image
                        source={{ uri: item.url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            {/* Property Details */}
            <View className="flex gap-5">
              <View className="flex gap-1">
                <Text className="text-accent text-2xl font-nunito">
                  {apartment.name}
                </Text>
                <Text className="text-foreground font-inter">
                  {apartment.street_address}, {apartment.barangay}, {apartment.city}
                  {apartment.province ? `, ${apartment.province}` : ''} {apartment.zip_code ? `, ${apartment.zip_code}` : ''}
                </Text>
              </View>

              {/* Monthly Rent */}
              <Text className="text-accent text-lg font-interMedium">
                ₱ {apartment.monthlyRent.toLocaleString()}
                <Text className="text-gray-500 font-inter text-base">/month</Text>
              </Text>

              {/* Apartment Type and Lease Duration */}
              <View className='flex-row flex-wrap'>
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconHome size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.type}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconCalendar size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.leaseDuration}
                  </Text>
                </View>
              </View>

              {/* Bedrooms and Bathrooms */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconBed size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.noBedrooms} Bedroom{apartment.noBedrooms !== 1 ? 's' : ''}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconBath size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.noBathrooms} Bathroom{apartment.noBathrooms !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Furnished Type and Floor Level */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconArmchair size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.furnishedType}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconBuildingCommunity size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.floorLevel}
                  </Text>
                </View>
              </View>

              {/* Max Occupants and Square Footage */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconUsers size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    Max {apartment.maxOccupants} Occupant{apartment.maxOccupants !== 1 ? 's' : ''}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconMaximize size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.areaSqm} Sqm
                  </Text>
                </View>
              </View>

              {/* Stats Row */}
              <View className="mt-5 p-2 border-t border-b border-gray-300 flex-row items-center justify-between">
                <View className="flex items-center gap-1 w-1/3">
                  <Text className="text-base text-foreground font-inter">Ratings</Text>
                  <Text className="text-3xl text-secondary font-interMedium">
                    {apartment.averageRating !== null ? `${apartment.averageRating}/5` : '—'}
                  </Text>
                  <Text className="text-base text-foreground font-interMedium">Average</Text>
                </View>

                <View className="w-px h-full bg-gray-300" />

                <View className="flex items-center gap-1 w-1/3">
                  <Text className="text-base text-foreground font-inter">Reviews</Text>
                  <Text className="text-3xl text-foreground font-interMedium">
                    {apartment.noRatings}
                  </Text>
                  <Text className="text-base text-foreground font-interMedium">Total</Text>
                </View>

                <View className="w-px h-full bg-gray-300" />

                <View className="flex items-center gap-1 w-1/3">
                  <Text className="text-base text-foreground font-inter">Status</Text>
                  <IconCircleCheckFilled
                    size={32}
                    color={isOccupied ? colors.success : colors.primary}
                  />
                  <Text className="text-base text-foreground font-interMedium">
                    {apartment.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description Button */}
            <View className="mt-5">
              <Button 
                onPress={() => router.push(`/manage-apartment/${apartmentId}/description`)} 
                size="sm"
              >
                <Button.Label>
                  View Full Description
                </Button.Label>
              </Button>
            </View>

            {/* Render the tenant information, maintenance if any, payments, if it is occupied */}
            {isOccupied ? (
              <>
                {/* Tenant Information */}
                {tenant && (
                  <View className="mt-5 flex gap-3">
                    <View className="flex-row gap-2 items-center">
                      <IconUser size={26} color={colors.textPrimary} />
                      <Text className="text-foreground text-lg font-interSemiBold">
                        Tenant Information
                      </Text>
                    </View>

                    <TenantCard
                      fullName={tenant.fullName}
                      email={tenant.email}
                      phoneNumber={tenant.mobileNumber}
                      profilePictureUrl={tenant.avatarUrl ?? undefined}
                      onPress={() => handleTenantProfilePress(tenant.id)}
                      leaseStartMonthYear={tenant.leaseStartMonthYear}
                      leaseEndMonthYear={tenant.leaseEndMonthYear}
                      onMessagePress={handleMessageTenant}  
                    />
                  </View>
                )}

                {/* Maintenance Request */}
                {maintenanceRequest && (
                  <View className="mt-5">
                    <MaintenanceRequestCard
                      issueName={maintenanceRequest.title}
                      reportedDate={maintenanceRequest.reportedDate}
                      onUpdatePress={() => console.log('Update Maintenance Pressed')}
                    />
                  </View>
                )}

                {/* Rent Payment History */}
                {paymentHistory.length > 0 && (
                  <View className="mt-5">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-text text-xl font-interSemiBold">
                        Rent Payment History
                      </Text>
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push(`/manage-apartment/${apartmentId}/payment-history`)
                        }
                      >
                        <Text className="text-primary text-base font-inter">See All</Text>
                      </TouchableOpacity>
                    </View>

                    <View className="mt-5 flex gap-2">
                      {paymentHistory.map((payment) => (
                        <PaymentHistoryCard
                          key={payment.id}
                          month={payment.month}
                          year={payment.year}
                          amount={payment.amount}
                          paidDate={payment.paidDate}
                          status={payment.status}
                        />
                      ))}
                    </View>
                  </View>
                )}
              </>
            ) : (
              // Empty State of Vacant Unit
              <View className="bg-surface border border-border flex gap-5 items-center p-4 rounded-2xl mt-5">
                <View className="flex items-center gap-1">
                  <Image
                    source={IMAGES.userError}
                    className="size-20"
                    resizeMode="contain"
                  />
                  <Text className="text-danger text-lg font-interMedium">
                    This property is currently vacant.
                  </Text>
                </View>

                <Button 
                  size="sm"
                  variant="tertiary"
                >
                  <Button.Label>
                    View Applications
                  </Button.Label>
                </Button>
              </View>
            )}

            <ImageViewing
              images={images.map((img) => ({ uri: img.url }))}
              imageIndex={imageIndex}
              visible={isImageViewVisible}
              onRequestClose={() => setIsImageViewVisible(false)}
              presentationStyle="overFullScreen"
              backgroundColor="rgb(0, 0, 0, 0.8)"
              FooterComponent={({ imageIndex: idx }) => (
                <View className="p-10 items-center">
                  <Text className="text-white font-interMedium">
                    {idx + 1} / {images.length}
                  </Text>
                </View>
              )}
            />
          </>
        ) : (
          // Error State
          <View className="flex-1 items-center justify-center py-24 gap-4">
            <IconBuildingOff size={48} color={colors.gray400} />
            <Text className="text-gray-400 font-interSemiBold text-center">
              Could not load property details.
            </Text>
            <PillButton label="Retry" size="sm" onPress={fetchApartmentDetail} />
          </View>
        )}
      </ScreenWrapper>

      {/* FAB with Menu */}
      <Menu>
        <Menu.Trigger asChild>
          <Button
            className="absolute bottom-8 right-6 rounded-full bg-accent
              items-center justify-center shadow-lg active:opacity-80"
            isIconOnly
          >
            <IconDotsVertical size={26} color={colors.secondaryForeground} />
          </Button>

        </Menu.Trigger>

        <Menu.Portal>
          <Menu.Overlay />
          <Menu.Content
            presentation="popover"
            placement="top"
            align="end"
            width={200}
          >
            <Menu.Item onPress={handleVacateUnit}>
              <IconLogout2 size={20} color={colors.textPrimary} />
              <Menu.ItemTitle>Vacate</Menu.ItemTitle>
            </Menu.Item>

            <Menu.Item variant="danger" onPress={() => { setOpen(false); setIsRemoveDialogOpen(true) }}>
              <IconCircleX size={20} color={colors.danger} />
              <Menu.ItemTitle>Remove Unit</Menu.ItemTitle>
            </Menu.Item>
          </Menu.Content>
        </Menu.Portal>
      </Menu>
      
      {/* Remove Unit Dialog */}
      <Dialog isOpen={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close variant="ghost" className="absolute top-4 right-4" />
            <View className="mb-5 gap-1.5">
              <Dialog.Title>Remove Unit</Dialog.Title>
              <Dialog.Description>
                Are you sure you want to remove this property? This action cannot be undone.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" size="sm" onPress={() => setIsRemoveDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onPress={handleRemoveUnit}>
                Remove
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
      
      {/* Confirm Dialog for Vacating Unit */}
      <Dialog isOpen={isVacateDialogOpen} onOpenChange={setIsVacateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close variant="ghost" className="absolute top-4 right-4" />
            <View className="mb-5 gap-1.5">
              <Dialog.Title>Vacate Unit</Dialog.Title>
              <Dialog.Description>
                Are you sure you want to mark this unit as vacant? The current tenant&apos;s lease will be ended and the unit will be listed as available.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button variant="ghost" size="sm" onPress={() => setIsVacateDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" variant="danger" onPress={handleConfirmVacate}>
                Vacate
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </View>
  )
}