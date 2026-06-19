import { View, Text } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import Animated from 'react-native-reanimated';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'
import ReviewAccordionItem from './components/ReviewAccordionItem'
import ReviewDocumentFile from './components/ReviewDocumentFile'
import ReviewDocumentImage from './components/ReviewDocumentImage'
import ReviewField from './components/ReviewField'


import {
  Accordion,
  AccordionLayoutTransition,
  Button,
  Separator,
  Spinner,
  useToast,
} from 'heroui-native';

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

    router.replace(`/apartment/${apartmentId}/apply/submitted`);
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
          
          <ReviewField
            label="Apartment Name"
            value={apartmentContext.name ?? '—'}
          />
          <ReviewField
            label="Address"
            value={apartmentContext.address ?? '—'}
          />
          <ReviewField
            label="Rental Owner/Landlord"
            value={apartmentContext.landlordName ?? '—'}
          />
          <ReviewField
            label="Unit Type"
            value={apartmentContext.type ?? '—'}
          />
          <ReviewField
            label="Furnishing"
            value={apartmentContext.furnishedType ?? '—'}
          />
          <ReviewField
            label="Floor Level"
            value={apartmentContext.floorLevel ?? '—'}
          />
          <ReviewField
            label="Max Occupants"
            value={
              apartmentContext.maxOccupants != null
                ? `${apartmentContext.maxOccupants} Person`
                : '—'}
          />

          <Separator className="my-3" />

          <ReviewField
            label="Monthly Rent"
            value={
              apartmentContext.monthlyRent != null
                ? `₱ ${formatCurrency(apartmentContext.monthlyRent)}`
                : '—'
            }
          />
          <ReviewField
            label="Lease Duration"
            value={apartmentContext.leaseDuration ?? '—'}
          />
          <ReviewField
            label="Security Deposit"
            value={
              apartmentContext.securityDeposit != null
                ? `₱ ${formatCurrency(apartmentContext.securityDeposit)}`
                : '—'
            }
          />
          <ReviewField
            label="Advance Rent"
            value={
              apartmentContext.advanceRent != null
                ? `₱ ${formatCurrency(apartmentContext.advanceRent)}`
                : '—'
            }
          />
          <ReviewField
            label='Total Move-In Cost'
            value={`₱ ${formatCurrency(totalMoveInCost)}`}
          />
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
                <ReviewField
                  label="Full Name"
                  value={tenantInformation.fullName}
                />
                <ReviewField
                  label="Contact Number"
                  value={tenantInformation.contactNumber}
                />
                <ReviewField
                  label="Email Address"
                  value={tenantInformation.email}
                />
                <ReviewField
                  label="Date of Birth"
                  value={formatDate(tenantInformation.dateOfBirth)}
                />
                <ReviewField
                  label="Current Address"
                  value={tenantInformation.currentAddress}
                />

                <Separator className="my-5" />

                <ReviewField
                  label="Occupation"
                  value={tenantInformation.occupation}
                />
                <ReviewField
                  label="Employer"
                  value={tenantInformation.companyName || "—"}
                />
                <ReviewField
                  label="Monthly Income"
                  value={`₱ ${formattedMonthlyIncome}`}
                />
                <ReviewField
                  label="Employment Type"
                  value={tenantInformation.employmentType}
                />

                <Separator className="my-5" />

                <View className="mb-5">
                  <ReviewField
                    label="Previous Landlord Name"
                    value={tenantInformation.previousLandlordName || "—"}
                  />
                </View>
                <View className="mb-5">
                  <ReviewField
                    label="Previous Landlord Contact"
                    value={tenantInformation.previousLandlordContact || "—"}
                  />
                </View>
              </ReviewAccordionItem>

              <ReviewAccordionItem
                value="preferences"
                title="Rental Preferences"
              >
                <ReviewField
                  label="Move-in Date"
                  value={
                    rentalPreferences.moveInDate
                      ? rentalPreferences.moveInDate.toLocaleDateString()
                      : "—"
                  }
                />
                <ReviewField
                  label="Number of Occupants"
                  value={`${rentalPreferences.noOccupants} Person`}
                />
                <ReviewField
                  label="Are there Pets?"
                  value={rentalPreferences.hasPets ? "Yes" : "No"}
                />
                <ReviewField
                  label="Is Smoker?"
                  value={rentalPreferences.isSmoker ? "Yes" : "No"}
                />
                <ReviewField
                  label="Need Parking?"
                  value={rentalPreferences.needParking ? "Yes" : "No"}
                />
                <ReviewField
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
              <Spinner />
            ) : (
              <Button.Label>Submit Application</Button.Label>
            )}
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
}