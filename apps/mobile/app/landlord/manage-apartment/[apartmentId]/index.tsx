import { View, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import PillButton from 'components/buttons/PillButton'
import TenantCard from './components/TenantCard'
import PaymentHistoryCard from './components/PaymentHistoryCard'
import MaintenanceRequestCard from './components/MaintenanceRequestCard'
import PropertyOverview from './components/PropertyOverview'
import PropertyActionMenu from './components/PropertyActionMenu'

import { Button, Dialog } from 'heroui-native'

import {
  User,
  CircleCheck,
  Building,
} from 'lucide-react-native';

import { IMAGES } from 'constants/images'

import { supabase } from '@repo/supabase'

import { useColors } from 'hooks/useTheme'
import { useApartmentDetails } from 'hooks/useApartmentDetails'
import { useLandlordTenancy } from 'hooks/useLandlordTenancy'

import { formatDate } from '@repo/utils';
import { useState } from 'react';

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

  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [isVacateDialogOpen, setIsVacateDialogOpen] = useState(false)

  const { apartment, loading, refetch } = useApartmentDetails(apartmentId);
  const { tenant, maintenanceRequest, paymentHistory } = useLandlordTenancy(apartmentId);

  const handleVacateUnit = () => {
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
            {/* Images + Specs */}
            <PropertyOverview
              name={apartment.name}
              street_address={apartment.street_address}
              barangay={apartment.barangay}
              city={apartment.city}
              province={apartment.province}
              zip_code={apartment.zip_code}
              monthly_rent={apartment.monthly_rent}
              type={apartment.type}
              lease_duration={apartment.lease_duration!}
              no_bedrooms={apartment.no_bedrooms}
              no_bathrooms={apartment.no_bathrooms}
              furnished_type={apartment.furnished_type!}
              floor_level={apartment.floor_level!}
              max_occupants={apartment.max_occupants!}
              area_sqm={apartment.area_sqm}
              apartment_images={apartment.apartment_images ?? []}
            />

            {/* Stats Row */}
            <View className="mt-5 p-2 border-t border-b border-border flex-row items-center justify-between">
              <View className="flex items-center gap-1 w-1/3">
                <Text className="text-base text-foreground font-inter">Ratings</Text>
                <Text className="text-3xl text-secondary font-interMedium">
                  {apartment.average_rating !== null ? `${apartment.average_rating}/5` : '—'}
                </Text>
                <Text className="text-base text-foreground font-interMedium">Average</Text>
              </View>

              <View className="w-px h-full bg-border" />

              <View className="flex items-center gap-1 w-1/3">
                <Text className="text-base text-foreground font-inter">Reviews</Text>
                <Text className="text-3xl text-foreground font-interMedium">
                  {apartment.no_ratings}
                </Text>
                <Text className="text-base text-foreground font-interMedium">Total</Text>
              </View>

              <View className="w-px h-full bg-border" />

              <View className="flex items-center gap-1 w-1/3">
                <Text className="text-base text-foreground font-inter">Status</Text>
                <CircleCheck size={32} color={isOccupied ? colors.success : colors.primary} />
                <Text className="text-base text-foreground font-interMedium">
                  {apartment.status}
                </Text>
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

            {/* Occupied vs Vacant */}
            {isOccupied ? (
              <>
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
                        tenant.leaseEnd ? formatDate(tenant.leaseEnd, "medium") : '—'
                      }
                      onMessagePress={handleMessageTenant}
                    />
                  </View>
                )}

                {maintenanceRequest && (
                  <View className="mt-5">
                    <MaintenanceRequestCard
                      issueName={maintenanceRequest.title}
                      reportedDate={maintenanceRequest.reportedDate}
                      onUpdatePress={() => console.log('Update Maintenance Pressed')}
                    />
                  </View>
                )}

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
                  <Button.Label>View Applications</Button.Label>
                </Button>
              </View>
            )}
          </>
        ) : (
          <View className="flex-1 items-center justify-center py-24 gap-4">
            <Building size={48} color={colors.gray400} />
            <Text className="text-gray-400 font-interSemiBold text-center">
              Could not load property details.
            </Text>
            <PillButton label="Retry" size="sm" onPress={refetch} />
          </View>
        )}
      </ScreenWrapper>

      <PropertyActionMenu
        onVacate={handleVacateUnit}
        onRemove={() => setIsRemoveDialogOpen(true)}
        isOccupied={isOccupied}
      />

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

      {/* Vacate Unit Dialog */}
      <Dialog isOpen={isVacateDialogOpen} onOpenChange={setIsVacateDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Close variant="ghost" className="absolute top-4 right-4" />
            <View className="mb-5 gap-1.5">
              <Dialog.Title>Vacate Unit</Dialog.Title>
              <Dialog.Description>
                Are you sure you want to mark this unit as vacant? The current tenant&apos;s
                lease will be ended and the unit will be listed as available.
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
  );
}
