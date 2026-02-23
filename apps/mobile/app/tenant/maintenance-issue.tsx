import { View, Text } from 'react-native'

import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import Divider from '@/components/display/Divider'
import DropdownField from '@/components/inputs/DropdownField'
import TextField from '@/components/inputs/TextField'

import { MAINTENANCE_CATEGORIES } from '@repo/constants';
import TextBox from '@/components/inputs/TextBox'
import UploadImageField from '@/components/inputs/UploadImageField'
import RadioButton from '@/components/buttons/RadioButton'
import PillButton from '@/components/buttons/PillButton'

type MaintenanceDetails = {
  category: string;
  title: string;
  message: string;
  urgency: 'Urgent' | 'Moderate' | 'Low';
}

export default function MaintenanceIssue() {
  // TODO: Get the apartment details and maintenance issue details from 
  // TODO: the backend using the issue ID passed in the route params

  const [maintenanceDetails, setMaintenanceDetails] = useState<MaintenanceDetails>({
    category: '',
    title: '',
    message: '',
    urgency: 'Low',
  });

  // Dummy data for now
  const apartmentDetails = {
    name: "Charles Apartments",
    address: "123 Main St, Apt 4B",
    landlord: "John Doe",
  }

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      header={
        <StandardHeader title='Request Maintenance'/>
      }
    >
      {/* Apartment Details */}
      <View className='flex gap-3'>
        <View className='flex'>
          <Text className='text-grey-500 text-sm font-inter'>
            Apartment Name
          </Text>
          <Text className='text-text text-lg font-interMedium'>
            {apartmentDetails.name}
          </Text>
        </View>
        <View className='flex'>
          <Text className='text-grey-500 text-sm font-inter'>
            Address
          </Text>
          <Text className='text-text text-lg font-interMedium'>
            {apartmentDetails.address}
          </Text>
        </View>
        <View className='flex'>
          <Text className='text-grey-500 text-sm font-inter'>
            Landlord
          </Text>
          <Text className='text-text text-lg font-interMedium'>
            {apartmentDetails.landlord}
          </Text>
        </View>
      </View>

      <Divider />

      {/* Maintenance Issue Form */}
      <View className='flex gap-3'>
        {/* Title */}
        <Text className='text-text text-xl font-poppinsMedium'>
          Maintenance Details
        </Text>

        <DropdownField 
          label={'Issue Category:'} 
          bottomSheetLabel={'Select Issue Category'} 
          options={MAINTENANCE_CATEGORIES}
          value={maintenanceDetails.category}
          onSelect={(value) => setMaintenanceDetails({...maintenanceDetails, category: value})}          
          placeholder='Select a Category'
          required
        />

        <TextField 
          label={'Issue Title:'}
          placeholder='Enter a short title for the issue...'
          required        
          value={maintenanceDetails.title}
          onChangeText={(value) => setMaintenanceDetails({...maintenanceDetails, title: value})}
        />

        <TextBox 
          label={'Issue Description:'}
          placeholder='Describe the issue in detail...'
          required        
          value={maintenanceDetails.message}
          onChangeText={(value) => setMaintenanceDetails({...maintenanceDetails, message: value})}        
        />

        <UploadImageField 
          label={'Add Photos or Videos:'}          
        />

        <View className='mt-5 flex gap-3'>
          <Text className='text-text text-base font-interMedium'>
            How urgent is this issue? <Text className='text-redHead-200'>*</Text>
          </Text>

          <RadioButton 
            label={'Urgent'} 
            onPress={() => setMaintenanceDetails({...maintenanceDetails, urgency: 'Urgent'})} 
            selected={maintenanceDetails.urgency === 'Urgent'}        
          />
          <RadioButton 
            label={'Moderate'} 
            onPress={() => setMaintenanceDetails({...maintenanceDetails, urgency: 'Moderate'})} 
            selected={maintenanceDetails.urgency === 'Moderate'}        
          />
          <RadioButton 
            label={'Low'} 
            onPress={() => setMaintenanceDetails({...maintenanceDetails, urgency: 'Low'})} 
            selected={maintenanceDetails.urgency === 'Low'}        
          />
        </View>
      </View>

      <View className='mt-20'>
        <PillButton 
          label={'Submit Maintenance Request'} 
        />
      </View>
    </ScreenWrapper>
  )
}