import { View, Text, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import TextField from '@/components/inputs/TextField'
import Divider from '@/components/display/Divider'

import {
  IconCirclePlus,
  IconCircleMinus
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'
import RadioButton from '@/components/buttons/RadioButton'
import PillButton from '@/components/buttons/PillButton'

export default function EditSpecs() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams();

  const [noBathrooms, setNoBathrooms] = useState<number>(1);
  const [noKitchens, setNoKitchens] = useState<number>(1);
  const [noBedrooms, setNoBedrooms] = useState<number>(1);

  const [hasParkingSpace, setHasParkingSpace] = useState<boolean>(false);

  const maxValue = 5;

  // Handle substracting bathrooms, kitchens, and bedrooms
  const handleSubtract = (type: 'bathrooms' | 'kitchens' | 'bedrooms') => {
    switch(type) {
      case 'bathrooms':
        setNoBathrooms(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'kitchens':
        setNoKitchens(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'bedrooms':
        setNoBedrooms(prev => prev > 0 ? prev - 1 : 0);
        break;
    }
  };

  // Handle adding bathrooms, kitchens, and bedrooms
  const handleAdd = (type: 'bathrooms' | 'kitchens' | 'bedrooms') => {
    switch(type) {
      case 'bathrooms':
        setNoBathrooms(prev => prev < maxValue ? prev + 1 : maxValue);
        break;
      case 'kitchens':
        setNoKitchens(prev => prev < maxValue ? prev + 1 : maxValue);
        break;
      case 'bedrooms':
        setNoBedrooms(prev => prev < maxValue ? prev + 1 : maxValue);
        break;
    }
  }

  // Handle saving changes (for now, just log the changes to the console)
  const handleSaveChanges = () => {
    console.log("Save Changes");

    router.replace(`/manage-apartment/${apartmentId}/description`);
  }

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Edit Room/Unit Details' />
      }
    >
      <TextField 
        label='Room/Unit Size (sqm):'
        placeholder='Enter unit size'
        required
      />

      <Divider marginVertical={30} />

      <View className='flex-row items-center justify-between'>
        <Text className='text-text text-lg font-interMedium'>
          Bathrooms:
        </Text>

        <View className='flex-row items-center gap-7'>
          <TouchableOpacity
            onPress={() => handleAdd('bathrooms')}
          >
            <IconCirclePlus 
              size={30} 
              color={COLORS.text} 
            />
          </TouchableOpacity>

          <Text className='text-text text-xl font-interMedium'>
            {noBathrooms}
          </Text>

          <TouchableOpacity
            onPress={() => handleSubtract('bathrooms')}
          >
            <IconCircleMinus 
              size={30} 
              color={COLORS.text} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View className='flex-row items-center justify-between mt-5'>
        <Text className='text-text text-lg font-interMedium'>
          Kitchens:
        </Text>

        <View className='flex-row items-center gap-7'>
          <TouchableOpacity
            onPress={() => handleAdd('kitchens')}
          >
            <IconCirclePlus 
              size={30} 
              color={COLORS.text} 
            />
          </TouchableOpacity>

          <Text className='text-text text-xl font-interMedium'>
            {noKitchens}
          </Text>

          <TouchableOpacity
            onPress={() => handleSubtract('kitchens')}
          >
            <IconCircleMinus 
              size={30} 
              color={COLORS.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View className='flex-row items-center justify-between mt-5'>
        <Text className='text-text text-lg font-interMedium'>
          Bedrooms:
        </Text>

        <View className='flex-row items-center gap-7'>
          <TouchableOpacity
            onPress={() => handleAdd('bedrooms')}
          >
            <IconCirclePlus 
              size={30} 
              color={COLORS.text} 
            />
          </TouchableOpacity>

          <Text className='text-text text-xl font-interMedium'>
            {noBedrooms}
          </Text>

          <TouchableOpacity
            onPress={() => handleSubtract('bedrooms')}
          >
            <IconCircleMinus 
              size={30} 
              color={COLORS.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <Divider marginVertical={30} />

      <View className='flex gap-3'>
        <Text className='text-text text-base font-interMedium'>
          Has Parking Space?
        </Text>
        
        <RadioButton 
          label={'Available'} 
          onPress={() => setHasParkingSpace(!hasParkingSpace)} 
          selected={hasParkingSpace}          
        />
      </View>

      <View className='flex-1' />

      <PillButton
        label='Save Changes'
        onPress={handleSaveChanges}
      />

    </ScreenWrapper>
  )
}