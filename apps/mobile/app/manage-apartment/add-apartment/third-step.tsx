import { View } from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/display/ApplicationHeader'
import NumberField from '@/components/inputs/NumberField'
import DropdownField from '@/components/inputs/DropdownField'
import Divider from '@/components/display/Divider'
import UploadImageField from '@/components/inputs/UploadImageField'
import PillButton from '@/components/buttons/PillButton'

import { COLORS } from '@repo/constants'

export default function ThirdStep() {
  const router = useRouter();

  const [pricingTerms, setPricingTerms] = useState({
    monthlyRent: '',
    depositMonth: '',
    depositAmount: '',
  })

  return (
    <ScreenWrapper
      scrollable
      backgroundColor={COLORS.darkerWhite}
    >
      <ApplicationHeader 
        currentTitle={'Pricing & Terms'} 
        nextTitle={'Description & Amenities'} 
        step={3}   
        totalSteps={5}     
      />
      
      <View className='p-5'>
        {/* Form */}
        <View className='flex gap-3'>
          <NumberField
            label='Monthly Rent:'
            placeholder='Enter monthly rent'
            required
            value={pricingTerms.monthlyRent}
            onChange={(value) => setPricingTerms({...pricingTerms, monthlyRent: value})}
          />

          <DropdownField 
            label='Deposit :' 
            bottomSheetLabel='Select Deposit Terms' 
            options={['1 Month', '2 Months', '3 Months']} 
            onSelect={(value) => setPricingTerms({...pricingTerms, depositMonth: value})}     
            value={pricingTerms.depositMonth}       
          />

          <NumberField
            label='Deposit Amount:'
            placeholder='Enter deposit amount'
            required
            value={pricingTerms.depositAmount}
            onChange={(value) => setPricingTerms({...pricingTerms, depositAmount: value})}
          />
        </View>

        <Divider />

        <View>
          <UploadImageField 
            label='Add Lease Agreement:'
            required
          />
        </View>

        <View className='flex-1' />

        {/* Back or Next Button */}
        <View className='flex-1 flex-row mt-16 gap-4'>
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
                router.push('/manage-apartment/add-apartment/fourth-step');
              }}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}