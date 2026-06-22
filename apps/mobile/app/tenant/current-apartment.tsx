import { useRef, useState } from 'react'
import { View, Text, ActivityIndicator, Alert, Linking } from 'react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import PerkItem from 'components/display/PerkItem'

import { formatCurrency } from '@repo/utils'

import { Button, Separator } from 'heroui-native'

import {
  House,
  Bath,
  BedDouble,
  Maximize,
  Calendar,
  Armchair,
  Building,
  Users,
  FileText,
  AlertCircle,
} from 'lucide-react-native';

import { useColors } from 'hooks/useTheme'
import { useTenancy } from 'hooks/useTenancy'
import { supabase } from '@repo/supabase'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatDateToMonthYear(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

// Signed URLs valid 1hr; refresh 5min before expiry
const TTL_MS = 55 * 60 * 1000;

export default function CurrentApartmentDetails() {
  const { colors } = useColors();
  const { tenancy, loading, error } = useTenancy()

  const cachedLeaseUrl = useRef<string | null>(null);
  const leaseUrlExpiry = useRef<number>(0);
  const [leaseLoading, setLeaseLoading] = useState(false);

  const handleViewLeaseAgreement = async () => {
    const leaseAgreementUrl = tenancy?.apartment?.lease_agreement_url;
    if (!leaseAgreementUrl) {
      Alert.alert('Not Found', 'This apartment does not have a lease agreement uploaded.');
      return;
    }

    // Reuse cached signed URL if still valid
    if (cachedLeaseUrl.current && Date.now() < leaseUrlExpiry.current) {
      Linking.openURL(cachedLeaseUrl.current);
      return;
    }

    setLeaseLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('lease-agreements')
        .createSignedUrl(leaseAgreementUrl, 3600);
      if (error || !data?.signedUrl) throw error;

      cachedLeaseUrl.current = data.signedUrl;
      leaseUrlExpiry.current = Date.now() + TTL_MS;

      Linking.openURL(data.signedUrl);
    } catch (err) {
      Alert.alert('Error', 'Could not open lease agreement.');
      console.error(err);
    } finally {
      setLeaseLoading(false);
    }
  };

  // Loading State
  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title="Apartment Details" />}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-foreground text-sm font-inter mt-3">
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
          <AlertCircle size={40} color={colors.gray300} />
          <Text className="text-foreground text-base font-interSemiBold mt-3 text-center">
            No Active Tenancy
          </Text>
          <Text className="text-muted text-sm font-inter mt-1 text-center">
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
        <Text className="text-2xl font-nunitoSemiBold text-foreground">
          {apartment.name}
        </Text>
        <Text className="text-base text-foreground">
          {apartmentAddress}
        </Text>
      </View>

      {/* Landlord */}
      <View className="mt-5">
        <Text className="text-muted text-xs font-inter">Landlord</Text>
        <Text className="text-foreground text-base font-interMedium">
          {landlordName}
        </Text>
      </View>

      {/* Lease Duration */}
      <View className="flex-row mt-5">
        <View className="flex w-1/2">
          <Text className="text-muted text-xs font-inter">Lease Start</Text>
          <Text className="text-foreground text-base font-interMedium">
            {formatDateToMonthYear(tenancy.lease_start)}
          </Text>
        </View>
        <View className="flex w-1/2">
          <Text className="text-muted text-xs font-inter">Lease End</Text>
          <Text className="text-foreground text-base font-interMedium">
            {tenancy.lease_end
              ? formatDateToMonthYear(tenancy.lease_end)
              : 'Ongoing'}
          </Text>
        </View>
      </View>

      {/* Monthly Rent */}
      <View className="mt-5">
        <Text className="text-muted text-xs font-inter">Monthly Rent</Text>
        <Text className="text-foreground text-base font-interMedium">
          {`₱ ${formattedMonthlyRent}`}
        </Text>
      </View>

      <Separator className="my-5" />

      {/* Full Description */}
      <Text className="text-foreground text-base font-interSemiBold">
        Apartment Full Description
      </Text>
      <View className="mt-3 bg-surface-secondary p-4 rounded-2xl">
        <Text className="text-foreground text-sm font-inter">
          {apartment.description}
        </Text>
      </View>

      {/* Room/Unit Details */}
      <Text className="text-foreground text-lg font-interSemiBold mt-5">
        Room/Unit Details
      </Text>
      <View className="flex-row flex-wrap justify-between mt-5">
        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={House}
            customText={apartment.type}
            iconColor={colors.gray300}
          />
        </View>

        {apartment.lease_duration && (
          <View className="w-1/2 mb-5">
            <PerkItem
              customIcon={Calendar}
              customText={apartment.lease_duration}
              iconColor={colors.gray300}
            />
          </View>
        )}

        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={BedDouble}
            customText={`${apartment.no_bedrooms} Bedrooms`}
            iconColor={colors.gray300}
          />
        </View>

        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={Bath}
            customText={`${apartment.no_bathrooms} Bathrooms`}
            iconColor={colors.gray300}
          />
        </View>

        {apartment.furnished_type && (
          <View className="w-1/2 mb-5">
            <PerkItem
              customIcon={Armchair}
              customText={apartment.furnished_type}
              iconColor={colors.gray300}
            />
          </View>
        )}

        {apartment.floor_level && (
          <View className="w-1/2 mb-5">
            <PerkItem
              customIcon={Building}
              customText={apartment.floor_level}
              iconColor={colors.gray300}
            />
          </View>
        )}

        {apartment.max_occupants && (
          <View className="w-1/2 mb-5">
            <PerkItem
              customIcon={Users}
              customText={`Max ${apartment.max_occupants} Occupants`}
              iconColor={colors.gray300}
            />
          </View>
        )}

        <View className="w-1/2 mb-5">
          <PerkItem
            customIcon={Maximize}
            customText={`${apartment.area_sqm} sqm`}
            iconColor={colors.gray300}
          />
        </View>
      </View>

      <Separator className="my-5" />

      {/* Included Perks */}
      {apartment.amenities && apartment.amenities.length > 0 && (
        <>
          <Text className="text-foreground text-lg font-interSemiBold mt-5">
            Included Perks
          </Text>
          <View className="flex-row flex-wrap justify-between mt-5">
            {apartment.amenities.map((perk, index) => (
              <View className="w-1/2 mb-5" key={index}>
                <PerkItem iconColor={colors.primary} perkId={perk} />
              </View>
            ))}
          </View>
        </>
      )}

      <Separator className="my-5" />

      {/* View Lease Agreement */}
      <View className="mt-5">
        <Button
          variant="tertiary"
          onPress={handleViewLeaseAgreement}
          isDisabled={!tenancy?.apartment?.lease_agreement_url || leaseLoading}
        >
          <FileText size={20} color={colors.secondaryForeground} />
          <Button.Label>View Lease Agreement</Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  )
}
