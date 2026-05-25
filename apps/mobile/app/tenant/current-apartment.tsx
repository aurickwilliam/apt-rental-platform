import { View, Text, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import Divider from 'components/display/Divider'
import PerkItem from 'components/display/PerkItem'

import { formatCurrency } from '@repo/utils'
import { COLORS } from '@repo/constants'
import { Button } from 'heroui-native'

import {
  IconHome,
  IconBath,
  IconBed,
  IconMaximize,
  IconCalendarEvent,
  IconSofa,
  IconBuilding,
  IconUsers,
  IconFileText,
  IconAlertCircle,
} from '@tabler/icons-react-native'

import { useTenancy } from 'hooks/useTenancy'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDateToMonthYear(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export default function CurrentApartmentDetails() {
  const router = useRouter()
  const { tenancy, loading, error } = useTenancy()

  const handleViewLeaseAgreement = () => {
    router.push('/tenant/current-lease')
  }

  // Loading State
  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Apartment Details" />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="text-text text-sm font-inter mt-3">
            Loading your tenancy details...
          </Text>
        </View>
      </ScreenWrapper>
    )
  }

  // Empty State / Error
  if (error || !tenancy) {
    return (
      <ScreenWrapper header={<StandardHeader title="Apartment Details" />}>
        <View className="flex-1 items-center justify-center px-6">
          <IconAlertCircle size={40} color={COLORS.mediumGrey} />
          <Text className="text-text text-base font-interSemiBold mt-3 text-center">
            No Active Tenancy
          </Text>
          <Text className="text-mediumGrey text-sm font-inter mt-1 text-center">
            {error ?? "You don't have an active tenancy at the moment."}
          </Text>
        </View>
      </ScreenWrapper>
    )
  }

  const { apartment, landlord } = tenancy
  const landlordName = landlord
    ? `${landlord.first_name ?? ''} ${landlord.last_name ?? ''}`.trim()
    : 'Unknown Landlord'
  const formattedMonthlyRent = formatCurrency(Number(tenancy.monthly_rent ?? apartment.monthly_rent))
  const apartmentAddress = `${apartment.street_address}, ${apartment.barangay}, ${apartment.city}`

  return (
    <ScreenWrapper
      scrollable
      className="p-5"
      header={<StandardHeader title="Apartment Details" />}
      bottomPadding={50}
    >
      {/* Name and Address */}
      <View>
        <Text className="text-2xl font-nunitoSemiBold text-text">
          {apartment.name}
        </Text>
        <Text className="text-base text-text">
          {apartmentAddress}
        </Text>
      </View>

      {/* Landlord */}
      <View className="mt-5">
        <Text className="text-text text-xs font-inter">Landlord</Text>
        <Text className="text-text text-base font-interMedium">
          {landlordName}
        </Text>
      </View>

      {/* Lease Duration */}
      <View className="flex-row mt-5">
        <View className="flex w-1/2">
          <Text className="text-text text-xs font-inter">Lease Start</Text>
          <Text className="text-text text-base font-interMedium">
            {formatDateToMonthYear(tenancy.lease_start)}
          </Text>
        </View>
        <View className="flex w-1/2">
          <Text className="text-text text-xs font-inter">Lease End</Text>
          <Text className="text-text text-base font-interMedium">
            {tenancy.lease_end
              ? formatDateToMonthYear(tenancy.lease_end)
              : 'Ongoing'}
          </Text>
        </View>
      </View>

      {/* Monthly Rent */}
      <View className="mt-5">
        <Text className="text-text text-xs font-inter">Monthly Rent</Text>
        <Text className="text-text text-base font-interMedium">
          {`₱ ${formattedMonthlyRent}`}
        </Text>
      </View>

      <Divider />

      {/* Full Description */}
      <Text className="text-text text-base font-interSemiBold">
        Apartment Full Description
      </Text>
      <View className="mt-3 bg-darkerWhite p-4 rounded-2xl">
        <Text className="text-text text-sm font-inter">
          {apartment.description}
        </Text>
      </View>

      {/* Room/Unit Details */}
      <Text className="text-text text-lg font-interSemiBold mt-5">
        Room/Unit Details
      </Text>
      <View className="flex-row flex-wrap justify-between mt-5">
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={IconHome}
            customText={apartment.type}
            iconColor={COLORS.mediumGrey}
          />
        </View>

        {apartment.lease_duration && (
          <View className="w-1/2 mb-5">
            <PerkItem
              customIcon={IconCalendarEvent}
              customText={apartment.lease_duration}
              iconColor={COLORS.mediumGrey}
            />
          </View>
        )}

        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={IconBed}
            customText={`${apartment.no_bedrooms} Bedrooms`}
            iconColor={COLORS.mediumGrey}
          />
        </View>

        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={IconBath}
            customText={`${apartment.no_bathrooms} Bathrooms`}
            iconColor={COLORS.mediumGrey}
          />
        </View>

        {apartment.furnished_type && (
          <View className="w-1/2 mb-5">
            <PerkItem
              customIcon={IconSofa}
              customText={apartment.furnished_type}
              iconColor={COLORS.mediumGrey}
            />
          </View>
        )}

        {apartment.floor_level && (
          <View className="w-1/2 mb-5">
            <PerkItem
              customIcon={IconBuilding}
              customText={apartment.floor_level}
              iconColor={COLORS.mediumGrey}
            />
          </View>
        )}

        {apartment.max_occupants && (
          <View className="w-1/2 mb-5">
            <PerkItem
              customIcon={IconUsers}
              customText={`Max ${apartment.max_occupants} Occupants`}
              iconColor={COLORS.mediumGrey}
            />
          </View>
        )}

        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={IconMaximize}
            customText={`${apartment.area_sqm} sqm`}
            iconColor={COLORS.mediumGrey}
          />
        </View>
      </View>

      <Divider />

      {/* Included Perks */}
      {apartment.amenities && apartment.amenities.length > 0 && (
        <>
          <Text className="text-text text-lg font-interSemiBold mt-5">
            Included Perks
          </Text>
          <View className="flex-row flex-wrap justify-between mt-5">
            {apartment.amenities.map((perk, index) => (
              <View className="w-1/2 mb-5" key={index}>
                <PerkItem iconColor={COLORS.primary} perkId={perk} />
              </View>
            ))}
          </View>
        </>
      )}

      <Divider />

      {/* View Lease Agreement */}
      <View className="mt-5">
        <Button variant="tertiary" onPress={handleViewLeaseAgreement}>
          <IconFileText size={20} color={COLORS.grey} />
          <Button.Label>View Lease Agreement</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  )
}