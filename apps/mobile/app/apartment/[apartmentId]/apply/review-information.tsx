import { View, Text } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Animated from 'react-native-reanimated';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'
import ReviewAccordionItem from './components/ReviewAccordionItem'
import ReviewDocumentFile from './components/ReviewDocumentFile'
import ReviewDocumentImage from './components/ReviewDocumentImage'
import DetailField from '@/components/display/DetailField';


import {
  Accordion,
  AccordionLayoutTransition,
  Button,
  Separator,
  Spinner,
  useToast,
} from "heroui-native";

import { formatCurrency, formatDate } from '@repo/utils'

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'
import { useSubmitApplication } from '@/hooks/useSubmitApplication'

export default function ReviewInformation() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { toast } = useToast();

  const {
    apartmentContext,
    tenantInformation,
    rentalPreferences,
    documents
  } = useApplicationFormStore();

  const { submit, isSubmitting } = useSubmitApplication();

  const formattedMonthlyIncome = formatCurrency(tenantInformation.monthlyIncome!)

  const totalMoveInCost =
    apartmentContext.monthlyRent! +
    apartmentContext.securityDeposit! +
    apartmentContext.advanceRent!;

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
        step={4}
      />

      <View className="p-5 flex-1">
        <Text className="text-lg font-interSemiBold text-foreground">
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
                  ? `${formatCurrency(apartmentContext.monthlyRent)}`
                  : '—'
              }
            />
            <DetailField
              label="Security Deposit"
              value={
                apartmentContext.securityDeposit != null
                  ? `${formatCurrency(apartmentContext.securityDeposit)}`
                  : '—'
              }
            />
          </View>

          <View className='flex-row'>
            <DetailField
              label="Advance Rent"
              value={
                apartmentContext.advanceRent != null
                  ? `${formatCurrency(apartmentContext.advanceRent)}`
                  : '—'
              }
            />
            <DetailField
              label='Total Move-In Cost'
              value={`${formatCurrency(totalMoveInCost)}`}
            />
          </View>
        </View>

        <Separator className="my-5" />

        {/* Summary */}
        <View className="flex-1">
          <Text className="text-lg font-interSemiBold text-foreground">
            Summary of Application
          </Text>
          <Text className="text-sm font-inter text-muted mt-1">
            Please review the information you have provided before submitting
            your application. Make sure all details are accurate and all
            required documents are uploaded.
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
                  value={`${formattedMonthlyIncome}`}
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

              <ReviewAccordionItem value="documents" title="Uploaded Documents">
                <ReviewDocumentImage
                  label="Valid Government-issued ID"
                  uri={documents.govId[0]?.uri}
                />
                <ReviewDocumentFile
                  label="Proof of Income"
                  fileName={documents.proofOfIncome?.name}
                />
                <ReviewDocumentImage
                  label="Proof of Billing"
                  uri={documents.proofOfBilling[0]?.uri}
                />
                <ReviewDocumentFile
                  label="NBI Clearance"
                  fileName={documents.nbiClearance?.name}
                />
              </ReviewAccordionItem>
            </Accordion>
          </Animated.View>
        </View>

        <View className="flex-row mt-16 gap-4">
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
            isDisabled={isSubmitting}
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
