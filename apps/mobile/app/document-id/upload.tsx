import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import UploadImageField from '@/components/inputs/UploadImageField';
import CheckBox from '@/components/buttons/CheckBox';
import PillButton from '@/components/buttons/PillButton'


export default function Upload() {
  const { docType } = useLocalSearchParams();
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  // Handle Adding Document
  const handleAddDocument = () => {
    if (!isVerified) {
      // Show an alert or toast message to inform the user to verify the information
      alert('Please confirm that the information provided is true and the ID belongs to you before adding the document.');
      return;
    }

    router.replace('/document-id');
  }

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Upload Document' />
      }
      className='p-5'
    >
      <View className='flex gap-1'>
        {/* Name of Document */}
        <Text className='text-secondary text-2xl font-poppinsMedium'>
          {docType}
        </Text>

        <Text className='text-grey-500 text-base font-inter'>
          Accepted formats: JPG, PNG, or PDF (max 5MB each)
        </Text>
      </View>

      {/* Upload Image Field */}
      <View className='mt-5'>
        <UploadImageField />
      </View>

      {/* Verification */}
      <View className='mt-10 flex gap-5'>
        <CheckBox 
          label={'I confirm that the information provided is true and the ID belongs to me.'} 
          selected={isVerified}
          onPress={() => setIsVerified(!isVerified)}          
        />

        <Text className='text-sm text-grey-500 font-inter'>
          <Text className='text-redHead-200'>*</Text> By uploading your documents, you certify that all information is true and valid. Any fraudulent or falsified documents may result in account suspension and legal action in accordance with Republic Act No. 9653 (Anti-Fraud Law).
        </Text>
      </View>

      <View className='flex-1' />

      <PillButton 
        label='Add Document'
        onPress={handleAddDocument}
      />
    </ScreenWrapper>
  )
}