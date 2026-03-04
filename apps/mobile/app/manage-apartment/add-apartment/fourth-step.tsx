import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/display/ApplicationHeader'
import TextBox from '@/components/inputs/TextBox'
import PillButton from '@/components/buttons/PillButton'
import CheckBox from '@/components/buttons/CheckBox'

import { COLORS } from '@repo/constants'

export default function FourthStep() {
  const router = useRouter();

  const [apartmentRules, setApartmentRules] = useState({
    isPetFriendly: false,
    isNoSmoking: false,
    isNoLoudMusic: false,
    isNoDecorating: false,
  })

  return (
    <ScreenWrapper
      scrollable
      backgroundColor={COLORS.darkerWhite}
    >
      <ApplicationHeader 
        currentTitle={'Description & Amenities'} 
        nextTitle={'Preview & Publish'} 
        step={4}   
        totalSteps={5}     
      />

      <View className='flex-1 p-5'>
        <TextBox 
          label='Apartment Description:'
          required
          placeholder='Write a detailed description of the apartment, including its features, amenities, and any other relevant information that would attract potential renters.'
          boxHeight={200}
        />

        <View className='mt-5 flex gap-3'>
          <View>
            <Text className='text-text text-xl font-poppinsMedium'>
              Add Included Perks & Amenities
            </Text>

            <Text className='text-text text-base font-inter'>
              Highlight features that make this property stand out
            </Text>
          </View>

          <PillButton
            label={'Add Amenities'}
            size='sm'
            type='outline'
            onPress={() => router.push('/manage-apartment/add-apartment/amenities')}
           />
        </View>

        {/* Apartment Rules */}
        <View className='mt-5'>
          <View>
            <Text className='text-text text-xl font-poppinsMedium'>
              Apartment Rules
            </Text>

            <Text className='text-text text-base font-inter'>
              Choose policies that work for your property
            </Text>
          </View>

          <View className='flex gap-3 mt-5'>
            <CheckBox 
              label={'Pet Friendly'} 
              selected={apartmentRules.isPetFriendly}
              onPress={() => setApartmentRules({...apartmentRules, isPetFriendly: !apartmentRules.isPetFriendly})}              
            />

            <CheckBox 
              label={'No Smoking/Vaping'} 
              selected={apartmentRules.isNoSmoking}
              onPress={() => setApartmentRules({...apartmentRules, isNoSmoking: !apartmentRules.isNoSmoking})}              
            />

            <CheckBox 
              label={'No Loud Music/Parties'} 
              selected={apartmentRules.isNoLoudMusic}
              onPress={() => setApartmentRules({...apartmentRules, isNoLoudMusic: !apartmentRules.isNoLoudMusic})}              
            />

            <CheckBox 
              label={'No Painting/Decorating'} 
              selected={apartmentRules.isNoDecorating} 
              onPress={() => setApartmentRules({...apartmentRules, isNoDecorating: !apartmentRules.isNoDecorating})}              
            />          
          </View>
        </View>

        {/* Back or Next Button */}
        <View className='flex-row mt-auto gap-4'>
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
              label={'Next'}
              isFullWidth
              onPress={() => {
                router.push('/manage-apartment/add-apartment/fifth-step');
              }}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}