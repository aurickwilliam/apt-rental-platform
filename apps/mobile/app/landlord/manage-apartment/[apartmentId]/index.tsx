import { View, Text, TouchableOpacity, FlatList } from 'react-native'
import { Image } from 'expo-image';
import ImageViewing from 'react-native-image-viewing'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import PillButton from 'components/buttons/PillButton'
import TenantCard from './components/TenantCard'
import PaymentHistoryCard from './components/PaymentHistoryCard'
import MaintenanceRequestCard from './components/MaintenanceRequestCard'

import { Button, Menu, Dialog } from 'heroui-native'

import {
  Bath,
  BedDouble,
  House,
  Maximize,
  User,
  CircleCheck,
  LogOut,
  CircleX,
  EllipsisVertical,
  Armchair,
  Calendar,
  Users,
  Building,
} from 'lucide-react-native';

import { IMAGES } from 'constants/images'

import { supabase } from '@repo/supabase'

import { useColors } from 'hooks/useTheme'
import { useApartmentDetails } from 'hooks/useApartmentDetails'
import { useLandlordTenancy } from 'hooks/useLandlordTenancy'

import { formatDate } from '@repo/utils';

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

  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [isVacateDialogOpen, setIsVacateDialogOpen] = useState(false)

  const { apartment, loading, refetch } = useApartmentDetails(apartmentId);
  const { tenant, maintenanceRequest, paymentHistory } = useLandlordTenancy(apartmentId);

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
      refetch()
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
    router.push(`/landlord/manage-apartment/${apartmentId}/tenant-profile/${tenantId}`)
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

  const isOccupied = apartment?.status === 'occupied';
  const images = [...(apartment?.apartment_images ?? [])].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0))

  return (
    <View style={{ flex: 1 }}>
      <ScreenWrapper
        className="p-5"
        header={
          <StandardHeader
            title="Property"
            onBackPress={() => router.replace("/(tabs)/(landlord)/units")}
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
                        style={{ width: "100%", height: "100%" }}
                        contentFit="cover"
                        cachePolicy="disk"
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
                  {apartment.street_address}, {apartment.barangay},{" "}
                  {apartment.city}
                  {apartment.province ? `, ${apartment.province}` : ""}{" "}
                  {apartment.zip_code ? `, ${apartment.zip_code}` : ""}
                </Text>
              </View>

              {/* Monthly Rent */}
              <Text className="text-accent text-lg font-interMedium">
                ₱ {apartment.monthly_rent.toLocaleString()}
                <Text className="text-gray-500 font-inter text-base">
                  /month
                </Text>
              </Text>

              {/* Apartment Type and Lease Duration */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <House size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.type}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <Calendar size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.lease_duration}
                  </Text>
                </View>
              </View>

              {/* Bedrooms and Bathrooms */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <BedDouble size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.no_bedrooms} Bedroom
                    {apartment.no_bedrooms !== 1 ? "s" : ""}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <Bath size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.no_bathrooms} Bathroom
                    {apartment.no_bathrooms !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>

              {/* Furnished Type and Floor Level */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <Armchair size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.furnished_type}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <Building size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.floor_level}
                  </Text>
                </View>
              </View>

              {/* Max Occupants and Square Footage */}
              <View className="flex-row flex-wrap">
                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <Users size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    Max {apartment.max_occupants} Occupant
                    {apartment.max_occupants !== 1 ? "s" : ""}
                  </Text>
                </View>

                <View className="flex-row w-1/2 gap-2 items-center justify-start">
                  <Maximize size={24} color={colors.gray500} />
                  <Text className="text-foreground text-base">
                    {apartment.area_sqm} Sqm
                  </Text>
                </View>
              </View>

              {/* Stats Row */}
              <View className="mt-5 p-2 border-t border-b border-border flex-row items-center justify-between">
                <View className="flex items-center gap-1 w-1/3">
                  <Text className="text-base text-foreground font-inter">
                    Ratings
                  </Text>

                  <Text className="text-3xl text-secondary font-interMedium">
                    {apartment.average_rating !== null
                      ? `${apartment.average_rating}/5`
                      : "—"}
                  </Text>

                  <Text className="text-base text-foreground font-interMedium">
                    Average
                  </Text>
                </View>

                <View className="w-px h-full bg-border" />

                <View className="flex items-center gap-1 w-1/3">
                  <Text className="text-base text-foreground font-inter">
                    Reviews
                  </Text>

                  <Text className="text-3xl text-foreground font-interMedium">
                    {apartment.no_ratings}
                  </Text>

                  <Text className="text-base text-foreground font-interMedium">
                    Total
                  </Text>
                </View>

                <View className="w-px h-full bg-border" />

                <View className="flex items-center gap-1 w-1/3">
                  <Text className="text-base text-foreground font-inter">
                    Status
                  </Text>

                  <CircleCheck
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
                onPress={() =>
                  router.push(`/landlord/manage-apartment/${apartmentId}/description`)
                }
                size="sm"
              >
                <Button.Label>View Full Description</Button.Label>
              </Button>
            </View>

            {/* Render the tenant information, maintenance if any, payments, if it is occupied */}
            {isOccupied ? (
              <>
                {/* Tenant Information */}
                {tenant && (
                  <View className="mt-5 flex gap-3">
                    <View className="flex-row gap-2 items-center">
                      <User size={26} color={colors.textPrimary} />
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
                      leaseStartMonthYear={formatDate(tenant.leaseStart, "medium")}
                      leaseEndMonthYear={
                        tenant.leaseEnd
                          ? formatDate(tenant.leaseEnd, "medium")
                          : "—"
                      }
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
                      onUpdatePress={() =>
                        console.log("Update Maintenance Pressed")
                      }
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
                          router.push(
                            `/landlord/manage-apartment/${apartmentId}/payment-history`,
                          )
                        }
                      >
                        <Text className="text-primary text-base font-inter">
                          See All
                        </Text>
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
                    style={{ width: 100, height: 100 }}
                    contentFit="contain"
                  />
                  <Text className="text-danger text-lg font-interMedium">
                    This property is currently vacant.
                  </Text>
                </View>

                <Button
                  size="sm"
                  variant="tertiary"
                  onPress={() => router.push(`/landlord/tenant-applications/`)}
                >
                  <Button.Label>
                    View Applications
                  </Button.Label>
                </Button>
              </View>
            )}

            <ImageViewing
              images={(apartment?.apartment_images ?? []).map((img) => ({ uri: img.url }))}
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
            <Building size={48} color={colors.gray400} />
            <Text className="text-gray-400 font-interSemiBold text-center">
              Could not load property details.
            </Text>
            <PillButton
              label="Retry"
              size="sm"
              onPress={refetch}
            />
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
            <EllipsisVertical size={26} color={colors.secondaryForeground} />
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
            <Menu.Label>Actions</Menu.Label>
            <Menu.Item onPress={handleVacateUnit}>
              <LogOut size={20} color={colors.textPrimary} />
              <Menu.ItemTitle>Vacate</Menu.ItemTitle>
            </Menu.Item>

            <Menu.Item
              variant="danger"
              onPress={() => {
                setOpen(false);
                setIsRemoveDialogOpen(true);
              }}
            >
              <CircleX size={20} color={colors.danger} />
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
                Are you sure you want to remove this property? This action
                cannot be undone.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setIsRemoveDialogOpen(false)}
              >
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
              <Dialog.Title>
                Vacate Unit
              </Dialog.Title>

              <Dialog.Description>
                Are you sure you want to mark this unit as vacant? The current
                tenant&apos;s lease will be ended and the unit will be listed as
                available.
              </Dialog.Description>
            </View>
            <View className="flex-row justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setIsVacateDialogOpen(false)}
              >
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
  );
}
