import { View } from 'react-native'
import { useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import TextBox from '@/components/inputs/TextBox'
import PillButton from '@/components/buttons/PillButton'

export default function EditDescription() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams();

  // TODO: Fetch the current description using the apartmentId and set it as the initial value for the TextBox

  // Dummy description state for testing
  const [description, setDescription] = useState<string>('This is a sample description of the apartment. It provides details about the features, amenities, and location of the apartment.');

  // Handle saving changes to the description
  const handleSaveChanges = () => {
    // TODO: Implement save functionality here
    console.log('Save Changes button pressed');

    router.push(`/manage-apartment/${apartmentId}/description`);
  }

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Edit Description' />
      }
    >
      <TextBox 
        label='Description:'
        placeholder='Enter apartment description'
        boxHeight={500}
        required
        value={description}
        onChangeText={setDescription}
      />

      <View className='flex-1' />

      <PillButton 
        label='Save Changes'
        onPress={handleSaveChanges}
      />
    </ScreenWrapper>
  )
}