import { View, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useState } from 'react';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import TenantCard from './components/TenantCard'
import PaymentHistoryCard from './components/PaymentHistoryCard'
import MaintenanceRequestCard from './components/MaintenanceRequestCard'
import PropertyOverview from './components/PropertyOverview'
import PropertyActionMenu from './components/PropertyActionMenu'
import ConfirmDialog from 'components/display/ConfirmDialog'
import PropertyOverviewSkeleton from './components/PropertyOverviewSkeleton';

import { Button } from 'heroui-native'

import {
  User,
  CircleCheck,
  Building,
} from 'lucide-react-native';

import { IMAGES } from 'constants/images'
import { APARTMENT_STATUS_LABELS } from '@repo/constants'

import { supabase } from '@repo/supabase'

import { useColors } from 'hooks/useTheme'
import { useApartmentDetails } from 'hooks/apartments'
import { useLandlordTenancy } from 'hooks/tenancy'
import { useProfile } from 'hooks/auth'

import { formatDate } from '@repo/utils';

export default function Index() {
  const router = useRouter()
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()
  const { colors } = useColors();

  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [isVacateDialogOpen, setIsVacateDialogOpen] = useState(false)

  const { apartment, loading, refetch } = useApartmentDetails(apartmentId);
  const { tenant, maintenanceRequest, paymentHistory } = useLandlordTenancy(apartmentId);
  const { profile } = useProfile();

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

  const handleMessageTenant = () => {
    if (!tenant || !profile || !apartmentId) return;

    const userA = profile.id < tenant.id ? profile.id : tenant.id;
    const userB = profile.id < tenant.id ? tenant.id : profile.id;
    const conversationId = `${userA}-${userB}-${apartmentId}`;

    router.push({
      pathname: '/chat/[conversationId]',
      params: {
        conversationId,
        otherUserId: tenant.id,
        otherUserName: tenant.fullName,
        otherUserAvatar: tenant.avatarUrl ?? '',
        otherUserPhoneNumber: tenant.mobileNumber,
        apartmentId,
      },
    });
  };

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
          <PropertyOverviewSkeleton />
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
              is_verified={apartment.is_verified}
            />

            {/* Stats Row */}
            <View className="mt-5 p-2 border-t border-b border-border flex-row items-center justify-between">
              <View className="flex items-center gap-1 w-1/3">
                <Text className="text-base text-foreground font-inter">Ratings</Text>
                <Text className="text-3xl text-secondary font-interMedium">
                  {apartment.average_rating !== null
                    ? `${apartment.average_rating}/5`
                    : '—'}
                </Text>
                <Text className="text-base text-foreground font-interMedium">
                  Average
                </Text>
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
                <CircleCheck
                  size={32}
                  color={isOccupied ? colors.success : colors.primary}
                />
                <Text className="text-base text-foreground font-interMedium">
                  {APARTMENT_STATUS_LABELS[apartment.status]}
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

            <Button
              size="sm"
              variant="tertiary"
              onPress={refetch}
            >
              <Button.Label>
                Retry
              </Button.Label>
            </Button>
          </View>
        )}
      </ScreenWrapper>

      <PropertyActionMenu
        onVacate={handleVacateUnit}
        onRemove={() => setIsRemoveDialogOpen(true)}
        isOccupied={isOccupied}
      />

      <ConfirmDialog
        isOpen={isRemoveDialogOpen}
        onOpenChange={setIsRemoveDialogOpen}
        title="Remove Unit"
        description="Are you sure you want to remove this property? This action cannot be undone."
        confirmLabel="Remove"
        onConfirm={handleRemoveUnit}
      />

      <ConfirmDialog
        isOpen={isVacateDialogOpen}
        onOpenChange={setIsVacateDialogOpen}
        title="Vacate Unit"
        description="Are you sure you want to mark this unit as vacant? The current tenant's lease will be ended and the unit will be listed as available."
        confirmLabel="Vacate"
        onConfirm={handleConfirmVacate}
      />
    </View>
  );
}
