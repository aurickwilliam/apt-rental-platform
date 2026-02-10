import { View, Text } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from 'components/display/ApplicationHeader'

import { COLORS } from '../../../../constants/colors'
import Divider from 'components/display/Divider'
import PillButton from 'components/buttons/PillButton'
import AccordionItem from 'components/display/AccordionItem'

export default function ReviewInformation() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams();

  // Dummy data of Apartment Information
  const apartmentInfo = {
    name: "Sunset Residences",
    address: "123 Main St, Cityville",
    landlordName: "John Doe",
  };


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
          <View className='bg-white rounded-2xl mt-5'>
            <AccordionItem title="Tenant Information" isFirst>
              <View className="flex-row gap-4 mb-4">
                <View className="flex-1">
                  <Text className="text-xs text-stone-500 mb-1">Full Name</Text>
                  <Text className="text-sm text-stone-900 font-medium">John Doe</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-stone-500 mb-1">Email</Text>
                  <Text className="text-sm text-stone-900 font-medium">john@email.com</Text>
                </View>
              </View>
              <View className="mb-4">
                <Text className="text-xs text-stone-500 mb-1">Phone Number</Text>
                <Text className="text-sm text-stone-900 font-medium">+1 (555) 123-4567</Text>
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
                router.push(`/apartment/${apartmentId}/apply/submitted`);
              }}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}