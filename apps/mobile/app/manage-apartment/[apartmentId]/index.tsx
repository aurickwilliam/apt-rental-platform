import { View, Text, Image, TouchableOpacity, FlatList, Pressable, Modal } from 'react-native'
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

import { COLORS } from '@repo/constants'
import { IMAGES } from '@/constants/images'
import { supabase } from '@repo/supabase'

type ApartmentStatus = 'Available' | 'Occupied' | 'Under Maintenance' | 'Unverified'

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
          <View key={i} className="rounded-2xl w-48 h-60 bg-gray-200" />
        ))}
      </View>
      <View className="h-8 bg-gray-200 rounded-full w-2/3" />
      <View className="h-4 bg-gray-100 rounded-full w-1/2" />
      <View className="h-5 bg-gray-200 rounded-full w-1/3" />
      <View className="flex-row gap-3">
        {[1, 2, 3].map((i) => (
          <View key={i} className="h-4 bg-gray-100 rounded-full w-1/4" />
        ))}
      </View>
    </View>
  )
}

export default function Index() {
  const router = useRouter()
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()

  const [imageIndex, setImageIndex] = useState(0)
  const [isImageViewVisible, setIsImageViewVisible] = useState(false)
  const [open, setOpen] = useState(false)

  const [loading, setLoading] = useState(true)
  const [apartment, setApartment] = useState<ApartmentDetail | null>(null)
  const [images, setImages] = useState<ApartmentImage[]>([])
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [maintenanceRequest, setMaintenanceRequest] = useState<MaintenanceRequest | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])

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

      const validStatuses: ApartmentStatus[] = ['Available', 'Occupied', 'Under Maintenance', 'Unverified']
      const status = validStatuses.includes(aptData.status as ApartmentStatus)
        ? (aptData.status as ApartmentStatus)
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
          move_in_date,
          move_out_date,
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
          leaseStartMonthYear: formatMonthYear(tenancyData.move_in_date),
          leaseEndMonthYear: formatMonthYear(tenancyData.move_out_date),
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
    // TODO: update tenancy status to 'inactive' and apartment status to 'Available'
    console.log('Vacate unit')
  }

  const handleRemoveUnit = async () => {
    setOpen(false)
    if (!apartmentId) return

    try {
      const { error } = await supabase
        .from('apartments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', apartmentId)

      if (error) throw error
      
      router.back()
    } catch (err) {
      console.error('Error removing unit:', err)
    }
  }

  const handleTenantProfilePress = (tenantId: string) => {
    router.push(`/manage-apartment/${apartmentId}/tenant-profile/${tenantId}`)
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
                <Text className="text-primary text-3xl font-dmserif">
                  {apartment.name}
                </Text>
                <Text className="text-text font-inter text-base">
                  {apartment.street_address}, {apartment.barangay}, {apartment.city}
                  {apartment.province ? `, ${apartment.province}` : ''} {apartment.zip_code ? `, ${apartment.zip_code}` : ''}
                </Text>
              </View>

              {/* Monthly Rent */}
              <Text className="text-text text-lg font-interMedium">
                ₱ {apartment.monthlyRent.toLocaleString()}
                <Text className="text-grey-500 font-inter text-base">/month</Text>
              </Text>

              {/* Apartment Type and Lease Duration */}
              <View className='flex-row flex-wrap'>
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconHome size={24} color={COLORS.text} />
                  <Text className="text-grey-500 text-base">
                    {apartment.type}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconCalendar size={24} color={COLORS.text} />
                  <Text className="text-grey-500 text-base">
                    {apartment.leaseDuration}
                  </Text>
                </View>
              </View>

              {/* Bedrooms and Bathrooms */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconBed size={24} color={COLORS.text} />
                  <Text className="text-grey-500 text-base">
                    {apartment.noBedrooms} Bedroom{apartment.noBedrooms !== 1 ? 's' : ''}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconBath size={24} color={COLORS.text} />
                  <Text className="text-grey-500 text-base">
                    {apartment.noBathrooms} Bathroom{apartment.noBathrooms !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {/* Furnished Type and Floor Level */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconArmchair size={24} color={COLORS.text} />
                  <Text className="text-grey-500 text-base">
                    {apartment.furnishedType}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconBuildingCommunity size={24} color={COLORS.text} />
                  <Text className="text-grey-500 text-base">
                    {apartment.floorLevel}
                  </Text>
                </View>
              </View>

              {/* Max Occupants and Square Footage */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconUsers size={24} color={COLORS.text} />
                  <Text className="text-grey-500 text-base">
                    Max {apartment.maxOccupants} Occupant{apartment.maxOccupants !== 1 ? 's' : ''}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <IconMaximize size={24} color={COLORS.text} />
                  <Text className="text-grey-500 text-base">
                    {apartment.areaSqm} Sqm
                  </Text>
                </View>
              </View>

              {/* Stats Row */}
              <View className="mt-5 p-2 border-t border-b border-grey-300 flex-row items-center justify-between">
                <View className="flex items-center gap-1 w-1/3">
                  <Text className="text-base text-grey-500 font-inter">Ratings</Text>
                  <Text className="text-3xl text-secondary font-interMedium">
                    {apartment.averageRating !== null ? `${apartment.averageRating}/5` : '—'}
                  </Text>
                  <Text className="text-base text-grey-500 font-interMedium">Average</Text>
                </View>

                <View className="w-[1px] h-full bg-grey-300" />

                <View className="flex items-center gap-1 w-1/3">
                  <Text className="text-base text-grey-500 font-inter">Reviews</Text>
                  <Text className="text-3xl text-text font-interMedium">
                    {apartment.noRatings}
                  </Text>
                  <Text className="text-base text-grey-500 font-interMedium">Total</Text>
                </View>

                <View className="w-[1px] h-full bg-grey-300" />

                <View className="flex items-center gap-1 w-1/3">
                  <Text className="text-base text-grey-500 font-inter">Status</Text>
                  <IconCircleCheckFilled
                    size={32}
                    color={isOccupied ? COLORS.greenHulk : COLORS.grey}
                  />
                  <Text className="text-base text-grey-500 font-interMedium">
                    {apartment.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description Button */}
            <View className="mt-5">
              <PillButton
                label="View Full Description"
                size="sm"
                onPress={() => router.push(`/manage-apartment/${apartmentId}/description`)}
              />
            </View>

            {/* Render the tenant information, maintenance if any, payments, if it is occupied */}
            {isOccupied ? (
              <>
                {/* Tenant Information */}
                {tenant && (
                  <View className="mt-5 flex gap-3">
                    <View className="flex-row gap-2 items-center">
                      <IconUser size={26} color={COLORS.text} />
                      <Text className="text-text text-lg font-poppinsMedium">
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
                      <Text className="text-text text-xl font-poppinsSemiBold">
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
              <View className="bg-white border border-grey-200 flex gap-5 items-center p-4 rounded-2xl mt-5">
                <View className="flex items-center gap-1">
                  <Image
                    source={IMAGES.userError}
                    className="size-20"
                    resizeMode="contain"
                  />
                  <Text className="text-redHead-200 text-lg font-interMedium">
                    This property is currently vacant.
                  </Text>
                </View>

                <PillButton
                  label="View Applications"
                  size="sm"
                  type="outline"
                  isFullWidth
                />
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
            <IconBuildingOff size={48} color={COLORS.grey} />
            <Text className="text-gray-400 font-poppinsMedium text-center">
              Could not load property details.
            </Text>
            <PillButton label="Retry" size="sm" onPress={fetchApartmentDetail} />
          </View>
        )}
      </ScreenWrapper>

      {/* FAB */}
      <Pressable
        onPress={() => setOpen(true)}
        className="absolute bottom-8 right-6 w-16 h-16 rounded-full bg-primary
                   items-center justify-center shadow-lg active:opacity-80"
      >
        <IconDotsVertical size={26} color={COLORS.white} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable className="flex-1" onPress={() => setOpen(false)}>
          <Pressable
            className="absolute bottom-8 right-6 bg-white rounded-2xl border border-grey-300 overflow-hidden min-w-[180px]"
            onPress={() => {}}
          >
            <Pressable
              onPress={handleVacateUnit}
              className="px-5 py-4 active:bg-grey-100 border-b border-gray-100 flex-row items-center gap-3"
            >
              <IconLogout2 size={20} color={COLORS.text} />
              <Text className="text-text text-base font-interMedium">Vacate</Text>
            </Pressable>

            <Pressable
              onPress={handleRemoveUnit}
              className="px-5 py-4 active:bg-grey-100 border-b border-gray-100 flex-row items-center gap-3"
            >
              <IconCircleX size={20} color={COLORS.redHead} />
              <Text className="text-redHead-200 text-base font-interMedium">Remove Unit</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}