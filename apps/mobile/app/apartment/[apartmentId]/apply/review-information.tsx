import { View, Text } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from 'components/display/ApplicationHeader'
import Divider from 'components/display/Divider'
import PillButton from 'components/buttons/PillButton'
import AccordionItem from 'components/display/AccordionItem'

import { COLORS } from 'constants/colors'

import { formatCurrency } from 'utils/formatCurrency'

export default function ReviewInformation() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  // Dummy data of Apartment Information
  const apartmentInfo = {
    name: "Sunset Residences",
    address: "123 Main St, Cityville",
    landlordName: "John Doe",
  };

  // Dummy data of Tenant Information
  const submittedInfo = {
    fullName: "John Doe",
    email: "john@email.com",
    phoneNumber: "+1 (555) 123-4567",
    dateOfBirth: "January 1, 1990",
    currentAddress: "456 Elm St, Cityville",

    occupation: "Software Engineer",
    employer: "Tech Company Inc.",
    monthlyIncome: 5000,
    employmentType: "Full-time",

    previousLandlordName: "Jane Smith",
    previousLandlordContact: "+1 (555) 987-6543",

    moveInDate: "2024-10-01",
    durationOfStay: "12 months",
    noOccupants: 2,
    isPets: false,
    isSmoker: false,
    needParking: true,
    additionalNotes: "Looking forward to living in this apartment!"
  };

  const formattedMonthlyIncome = formatCurrency(submittedInfo.monthlyIncome);

  return (
    <ScreenWrapper
      scrollable
      bottomPadding={50}
      backgroundColor={COLORS.darkerWhite}
    >
      <ApplicationHeader
        currentTitle="Review Application"
        nextTitle="Submit Application"
        step={4}
      />

      <View className='p-5 flex-1'>
        {/* Apartment Information */}
        <View className='flex gap-3'>
          {/* Name */}
          <View>
            <Text className='text-sm font-inter text-grey-500'>
              Apartment Name
            </Text>
            <Text className='text-lg font-interMedium text-text'>
              {apartmentInfo.name}
            </Text>
          </View>

          {/* Address */}
          <View>
            <Text className='text-sm font-inter text-grey-500'>
              Address
            </Text>
            <Text className='text-lg font-interMedium text-text'>
              {apartmentInfo.address}
            </Text>
          </View>

          {/* Landlord Name */}
          <View>
            <Text className='text-sm font-inter text-grey-500'>
              Rental Owner/Landlord
            </Text>
            <Text className='text-lg font-interMedium text-text'>
              {apartmentInfo.landlordName}
            </Text>
          </View>
        </View>

        <Divider />

        {/* Summary */}
        <View className='flex-1'>
          <Text className='text-xl font-poppinsSemiBold text-text'>
            Summary of Application
          </Text>
          <Text className='text-sm font-inter text-text mt-1'>
            Please review the information you have provided before submitting your application.
            Make sure all details are accurate and all required documents are uploaded.
          </Text>

          {/* Accordion */}
          <View className='bg-white rounded-2xl mt-5 overflow-hidden'>
            <AccordionItem title="Tenant Information">
              <View className="flex gap-3">
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Full Name
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.fullName}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Contact Number
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.phoneNumber}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Email Address
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.email}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Date of Birth
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.dateOfBirth}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Current Address
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.currentAddress}
                  </Text>
                </View>
              </View>

              <Divider />

              <View className="flex gap-3">
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Occupation
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.occupation}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Employer
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.employer}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Monthly Income
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    ₱ {formattedMonthlyIncome}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Employment Type
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.employmentType}
                  </Text>
                </View>
              </View>

              <Divider />

              <View className="flex gap-3 mb-5">
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Previous Landlord Name
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.previousLandlordName}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Previous Landlord Contact
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.previousLandlordContact}
                  </Text>
                </View>
              </View>
            </AccordionItem>

            <AccordionItem title="Rental Preferences">
              <View className="flex gap-3">
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Move-in Date
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.moveInDate}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Duration of Stay
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.durationOfStay}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Number of Occupants
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.noOccupants} Person
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Are there Pets?
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.isPets ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Is Smoker?
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.isSmoker ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Need Parking?
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.needParking ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View className="flex">
                  <Text className="text-sm text-grey-500">
                    Additional Notes
                  </Text>
                  <Text className="text-base text-text font-interMedium">
                    {submittedInfo.additionalNotes}
                  </Text>
                </View>
              </View>
            </AccordionItem>

            <AccordionItem title="Uploaded Documents" isLast>
              <View className="flex gap-3">
                <View className="flex gap-2">
                  <Text className="text-base text-text">
                    Valid Government-issued ID
                  </Text>
                  <View className='bg-amber-200 w-full h-52 rounded-lg items-center justify-center'>
                  </View>
                </View>

                <View className="flex gap-2">
                  <Text className="text-base text-text">
                    Proof of Income
                  </Text>
                  <View className='bg-amber-200 w-full h-52 rounded-lg items-center justify-center'>
                  </View>
                </View>

                <View className="flex gap-2">
                  <Text className="text-base text-text">
                    Birth Certificate
                  </Text>
                  <View className='bg-amber-200 w-full h-52 rounded-lg items-center justify-center'>
                  </View>
                </View>
              </View>
            </AccordionItem>
          </View>
        </View>

        {/* Back or Submit Button */}
        <View className='flex-row mt-16 gap-4'>
          <View className='flex-1'>
            <PillButton
              label={'Back'}
              type='outline'
              isFullWidth
              onPress={() => router.back()}
            />
          </View>
          <View className='flex-1'>
            <PillButton
              label={'Submit Application'}
              isFullWidth
              onPress={() => {
                router.replace(`/apartment/${apartmentId}/apply/submitted`);
              }}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}
