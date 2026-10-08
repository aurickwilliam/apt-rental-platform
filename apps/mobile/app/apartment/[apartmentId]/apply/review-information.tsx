import { View, Text } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Animated from 'react-native-reanimated';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'
import ReviewAccordionItem from './components/ReviewAccordionItem'
import PassportNotice from './components/PassportNotice'
import ApplicationIssues from './components/ApplicationIssues'
import DetailField from '@/components/display/DetailField';


import {
  Accordion,
  AccordionLayoutTransition,
  Button,
  Separator,
  Spinner,
  useToast,
} from "heroui-native";

import { calcMoveInCost, formatDate, formatPesoDisplay } from '@repo/utils'

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'

import { useApplicationReadiness, useSubmitApplication } from '@/hooks/applications'
import { useApartmentDetails } from '@/hooks/apartments'
import { APPLICATION_SLOT_LABELS } from '@/service/applications/applicationReadiness'

export default function ReviewInformation() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { toast } = useToast();

  const {
    apartmentContext,
    tenantInformation,
    rentalPreferences,
  } = useApplicationFormStore();

  const { apartment } = useApartmentDetails(apartmentId, { includeReviews: false });
  const readiness = useApplicationReadiness(
    apartmentId,
    apartment?.landlord?.id ?? null,
    tenantInformation.employmentType,
  );

  const { submit, isSubmitting } = useSubmitApplication();

  const totalMoveInCost = calcMoveInCost(
    apartmentContext.monthlyRent,
    apartmentContext.securityDeposit,
    apartmentContext.advanceRent,
  );

  const handleSubmit = async () => {
    const result = await submit({ apartmentId });

    if (!result.success) {
      toast.show({
        variant: 'danger',
        label: 'Submission failed',
        description: result.error ?? 'Something went wrong. Please try again.',
      });
      return;
    }

    router.replace({
      pathname: "/apartment/[apartmentId]/apply/submitted",
      params: {
        apartmentId,
        apartmentName: apartmentContext.name ?? 'No Apartment Name',
      },
    });
  };

  return (
    <ScreenWrapper scrollable>
      <ApplicationHeader
        currentTitle="Review Application"
        nextTitle="Submit Application"
        step={3}
      />

      <View className="p-5 flex-1">
        <Text className="text-lg font-nunitoSemiBold text-foreground">
          Apartment Information
        </Text>
        <Text className="text-sm font-inter text-muted mt-1 mb-5">
          This is the apartment you are applying for.
        </Text>

        {/* Apartment Information */}
        <View className="flex gap-3">

          <DetailField
            label="Apartment Name"
            value={apartmentContext.name ?? '—'}
          />
          <DetailField
            label="Address"
            value={apartmentContext.address ?? '—'}
          />
          <DetailField
            label="Rental Owner/Landlord"
            value={apartmentContext.landlordName ?? '—'}
          />

          <View className='flex-row'>
            <DetailField
              label="Unit Type"
              value={apartmentContext.type ?? '—'}
            />
            <DetailField
              label="Furnishing"
              value={apartmentContext.furnishedType ?? '—'}
            />
          </View>

          <View className='flex-row'>
            <DetailField
              label="Floor Level"
              value={apartmentContext.floorLevel ?? '—'}
            />
            <DetailField
              label="Max Occupants"
              value={
                apartmentContext.maxOccupants != null
                  ? `${apartmentContext.maxOccupants} Person`
                  : '—'}
            />
          </View>

          <Separator className="my-3" />

          <DetailField
            label="Lease Duration"
            value={apartmentContext.leaseDuration ?? '—'}
          />

          <View className='flex-row'>
            <DetailField
              label="Monthly Rent"
              value={
                apartmentContext.monthlyRent != null
                  ? `${formatPesoDisplay(apartmentContext.monthlyRent)}`
                  : '—'
              }
            />
            <DetailField
              label="Security Deposit"
              value={
                apartmentContext.securityDeposit != null
                  ? `${formatPesoDisplay(apartmentContext.securityDeposit)}`
                  : '—'
              }
            />
          </View>

          <View className='flex-row'>
            <DetailField
              label="Advance Rent"
              value={
                apartmentContext.advanceRent != null
                  ? `${formatPesoDisplay(apartmentContext.advanceRent)}`
                  : '—'
              }
            />
            <DetailField
              label='Total Move-In Cost'
              value={`${formatPesoDisplay(totalMoveInCost)}`}
            />
          </View>
        </View>

        <Separator className="my-5" />

        {/* Summary */}
        <View className="flex-1">
          <Text className="text-lg font-nunitoSemiBold text-foreground">
            Summary of Application
          </Text>
          <Text className="text-sm font-inter text-muted mt-1">
            Please review the information you have provided before submitting
            your application. Make sure all details are accurate.
          </Text>

          <Animated.View
            layout={AccordionLayoutTransition}
            className="bg-surface rounded-3xl mt-5 overflow-hidden"
          >
            <Accordion selectionMode="single" defaultValue="tenant">
              <ReviewAccordionItem value="tenant" title="Tenant Information">
                <DetailField
                  label="Full Name"
                  value={tenantInformation.fullName}
                />
                <DetailField
                  label="Contact Number"
                  value={tenantInformation.contactNumber}
                />
                <DetailField
                  label="Email Address"
                  value={tenantInformation.email}
                />
                <DetailField
                  label="Date of Birth"
                  value={formatDate(tenantInformation.dateOfBirth)}
                />
                <DetailField
                  label="Current Address"
                  value={tenantInformation.currentAddress}
                />

                <Separator className="my-5" />

                <DetailField
                  label="Occupation"
                  value={tenantInformation.occupation}
                />
                <DetailField
                  label="Employer"
                  value={tenantInformation.companyName || "—"}
                />
                <DetailField
                  label="Monthly Income"
                  value={formatPesoDisplay(tenantInformation.monthlyIncome) || "—"}
                />
                <DetailField
                  label="Employment Type"
                  value={tenantInformation.employmentType}
                />

                <Separator className="my-5" />

                <View className="mb-5">
                  <DetailField
                    label="Previous Landlord Name"
                    value={tenantInformation.previousLandlordName || "—"}
                  />
                </View>
                <View className="mb-5">
                  <DetailField
                    label="Previous Landlord Contact"
                    value={tenantInformation.previousLandlordContact || "—"}
                  />
                </View>
              </ReviewAccordionItem>

              <ReviewAccordionItem
                value="preferences"
                title="Rental Preferences"
              >
                <DetailField
                  label="Move-in Date"
                  value={
                    rentalPreferences.moveInDate
                      ? rentalPreferences.moveInDate.toLocaleDateString()
                      : "—"
                  }
                />
                <DetailField
                  label="Number of Occupants"
                  value={`${rentalPreferences.noOccupants} Person`}
                />
                <DetailField
                  label="Are there Pets?"
                  value={rentalPreferences.hasPets ? "Yes" : "No"}
                />
                <DetailField
                  label="Is Smoker?"
                  value={rentalPreferences.isSmoker ? "Yes" : "No"}
                />
                <DetailField
                  label="Need Parking?"
                  value={rentalPreferences.needParking ? "Yes" : "No"}
                />
                <DetailField
                  label="Additional Notes"
                  value={rentalPreferences.additionalNotes || "—"}
                />
              </ReviewAccordionItem>

              <ReviewAccordionItem value="documents" title="APT Passport Documents">
                {(Object.keys(APPLICATION_SLOT_LABELS) as (keyof typeof APPLICATION_SLOT_LABELS)[]).map((slot) => {
                  const doc = readiness.selection.docs[slot];
                  const value = doc
                    ? `${doc.doc_type}${doc.is_verified ? " · Verified" : ""}`
                    : slot === "nbiClearance"
                      ? "Not provided (optional)"
                      : "Missing";
                  return (
                    <DetailField
                      key={slot}
                      label={APPLICATION_SLOT_LABELS[slot]}
                      value={value}
                    />
                  );
                })}
              </ReviewAccordionItem>
            </Accordion>
          </Animated.View>
        </View>

        <View className="mt-5 gap-3">
          <PassportNotice />
          {!readiness.loading ? <ApplicationIssues issues={readiness.issues} /> : null}
        </View>

        <View className="flex-row mt-10 gap-4">
          <Button
            variant="tertiary"
            onPress={() => router.back()}
            className="flex-1"
            isDisabled={isSubmitting}
          >
            <Button.Label>Back</Button.Label>
          </Button>

          <Button
            onPress={handleSubmit}
            className="flex-1"
            isDisabled={isSubmitting || readiness.loading || !readiness.isReady}
          >
            {isSubmitting ? (
              <Spinner color="white" />
            ) : (
              <Button.Label>Submit Application</Button.Label>
            )}
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}
