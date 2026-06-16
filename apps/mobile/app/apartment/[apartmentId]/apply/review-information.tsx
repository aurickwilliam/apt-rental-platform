import { useEffect, useState } from 'react'
import { View, Text, Image, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'

import { Accordion, AccordionLayoutTransition, Button, Separator } from 'heroui-native';
import Animated from 'react-native-reanimated';

import { useColors } from '@/hooks/useTheme';

import { formatCurrency } from '@repo/utils'
import { supabase } from '@repo/supabase'

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'

type ApartmentSummary = {
  name: string
  address: string
  landlordName: string
}

export default function ReviewInformation() {
  const { colors } = useColors();
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { tenantInformation, rentalPreferences, documents } = useApplicationFormStore()

  const [apartmentInfo, setApartmentInfo] = useState<ApartmentSummary | null>(null)
  const [isLoadingApartment, setIsLoadingApartment] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    if (!apartmentId) return

    let isActive = true

    const fetchApartmentInfo = async () => {
      setIsLoadingApartment(true)
      setFetchError(null)

      const { data, error } = await supabase
        .from('apartments')
        .select(`
          name,
          street_address,
          barangay,
          city,
          province,
          landlord:users!apartments_landlord_id_fkey1 ( first_name, last_name )
        `)
        .eq('id', apartmentId)
        .single()

      if (!isActive) return

      if (error || !data) {
        setFetchError('Unable to load apartment details.')
        setIsLoadingApartment(false)
        return
      }

      const address = [data.street_address, data.barangay, data.city, data.province]
        .filter(Boolean)
        .join(', ')

      const landlord = Array.isArray(data.landlord) ? data.landlord[0] : data.landlord
      const landlordName = landlord
        ? [landlord.first_name, landlord.last_name].filter(Boolean).join(' ')
        : 'Unknown'

      setApartmentInfo({
        name: data.name,
        address,
        landlordName,
      })
      setIsLoadingApartment(false)
    }

    fetchApartmentInfo()

    return () => {
      isActive = false
    }
  }, [apartmentId])

  const formattedMonthlyIncome = formatCurrency(tenantInformation.monthlyIncome)

  return (
    <ScreenWrapper scrollable>
      <ApplicationHeader
        currentTitle="Review Application"
        nextTitle="Submit Application"
        step={4}
      />

      <View className="p-5 flex-1">
        {/* Apartment Information */}
        {isLoadingApartment ? (
          <View className="py-6 items-center">
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : fetchError ? (
          <Text className="text-danger font-inter text-sm">{fetchError}</Text>
        ) : (
          <View className="flex gap-3">
            <View>
              <Text className="text-sm font-inter text-muted">
                Apartment Name
              </Text>
              <Text className="text-base font-interMedium text-foreground">
                {apartmentInfo?.name}
              </Text>
            </View>

            <View>
              <Text className="text-sm font-inter text-muted">Address</Text>
              <Text className="text-base font-interMedium text-foreground">
                {apartmentInfo?.address}
              </Text>
            </View>

            <View>
              <Text className="text-sm font-inter text-muted">
                Rental Owner/Landlord
              </Text>
              <Text className="text-base font-interMedium text-foreground">
                {apartmentInfo?.landlordName}
              </Text>
            </View>
          </View>
        )}

        <Separator className="my-5" />

        {/* Summary */}
        <View className="flex-1">
          <Text className="text-lg font-interSemiBold text-foreground">
            Summary of Application
          </Text>
          <Text className="text-sm font-inter text-foreground mt-1">
            Please review the information you have provided before submitting
            your application. Make sure all details are accurate and all
            required documents are uploaded.
          </Text>

          <Animated.View
            layout={AccordionLayoutTransition}
            className="bg-surface rounded-2xl mt-5 overflow-hidden"
          >
            <Accordion selectionMode="single" defaultValue="tenant">
              <Accordion.Item value="tenant">
                <Accordion.Trigger>
                  <Text className="text-base font-interMedium text-foreground flex-1">
                    Tenant Information
                  </Text>
                  <Accordion.Indicator />
                </Accordion.Trigger>
                <Accordion.Content>
                  <View className="flex gap-3">
                    <View className="flex">
                      <Text className="text-sm text-muted">Full Name</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.fullName}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Contact Number</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.contactNumber}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Email Address</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.email}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Date of Birth</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.dateOfBirth}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Current Address</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.currentAddress}
                      </Text>
                    </View>
                  </View>

                  <Separator className="my-5" />

                  <View className="flex gap-3">
                    <View className="flex">
                      <Text className="text-sm text-muted">Occupation</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.occupation}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Employer</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.companyName || '—'}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Monthly Income</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        ₱ {formattedMonthlyIncome}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Employment Type</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.employmentType}
                      </Text>
                    </View>
                  </View>

                  <Separator className="my-5" />

                  <View className="flex gap-3 mb-5">
                    <View className="flex">
                      <Text className="text-sm text-muted">
                        Previous Landlord Name
                      </Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.previousLandlordName || '—'}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">
                        Previous Landlord Contact
                      </Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {tenantInformation.previousLandlordContact || '—'}
                      </Text>
                    </View>
                  </View>
                </Accordion.Content>
              </Accordion.Item>

              <Accordion.Item value="preferences">
                <Accordion.Trigger>
                  <Text className="text-base font-interMedium text-foreground flex-1">
                    Rental Preferences
                  </Text>
                  <Accordion.Indicator />
                </Accordion.Trigger>
                <Accordion.Content>
                  <View className="flex gap-3">
                    <View className="flex">
                      <Text className="text-sm text-muted">Move-in Date</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {rentalPreferences.moveInDate
                          ? rentalPreferences.moveInDate.toLocaleDateString()
                          : '—'}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">
                        Duration of Stay
                      </Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {rentalPreferences.intendedDuration}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">
                        Number of Occupants
                      </Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {rentalPreferences.noOccupants} Person
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Are there Pets?</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {rentalPreferences.hasPets ? "Yes" : "No"}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Is Smoker?</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {rentalPreferences.isSmoker ? "Yes" : "No"}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">Need Parking?</Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {rentalPreferences.needParking ? "Yes" : "No"}
                      </Text>
                    </View>
                    <View className="flex">
                      <Text className="text-sm text-muted">
                        Additional Notes
                      </Text>
                      <Text className="text-base text-foreground font-interMedium">
                        {rentalPreferences.additionalNotes || '—'}
                      </Text>
                    </View>
                  </View>
                </Accordion.Content>
              </Accordion.Item>

              <Accordion.Item value="documents">
                <Accordion.Trigger>
                  <Text className="text-base font-interMedium text-foreground flex-1">
                    Uploaded Documents
                  </Text>
                  <Accordion.Indicator />
                </Accordion.Trigger>
                <Accordion.Content>
                  <View className="flex gap-3">
                    <View className="flex gap-2">
                      <Text className="text-base text-foreground">
                        Valid Government-issued ID
                      </Text>
                      {documents.govId[0] ? (
                        <Image
                          source={{ uri: documents.govId[0].uri }}
                          className="w-full h-52 rounded-lg"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="bg-amber-200 w-full h-52 rounded-lg items-center justify-center">
                          <Text className="text-sm text-foreground">Not uploaded</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex gap-2">
                      <Text className="text-base text-foreground">Proof of Income</Text>
                      <View className="bg-surface border border-border w-full rounded-lg p-4">
                        <Text className="text-sm text-foreground font-interMedium" numberOfLines={1}>
                          {documents.proofOfIncome?.name ?? 'Not uploaded'}
                        </Text>
                      </View>
                    </View>

                    <View className="flex gap-2">
                      <Text className="text-base text-foreground">Proof of Billing</Text>
                      {documents.proofOfBilling[0] ? (
                        <Image
                          source={{ uri: documents.proofOfBilling[0].uri }}
                          className="w-full h-52 rounded-lg"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="bg-amber-200 w-full h-52 rounded-lg items-center justify-center">
                          <Text className="text-sm text-foreground">Not uploaded</Text>
                        </View>
                      )}
                    </View>

                    <View className="flex gap-2">
                      <Text className="text-base text-foreground">NBI Clearance</Text>
                      <View className="bg-surface border border-border w-full rounded-lg p-4">
                        <Text className="text-sm text-foreground font-interMedium" numberOfLines={1}>
                          {documents.nbiClearance?.name ?? 'Not uploaded'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Accordion.Content>
              </Accordion.Item>
            </Accordion>
          </Animated.View>
        </View>

        <View className="flex-row mt-16 gap-4">
          <Button
            variant="tertiary"
            onPress={() => router.back()}
            className="flex-1"
          >
            <Button.Label>
              Back
            </Button.Label>
          </Button>

          <Button
            onPress={() => {
              router.replace(`/apartment/${apartmentId}/apply/submitted`);
            }}
            className="flex-1"
          >
            <Button.Label>
              Submit Application
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}