import { View, Text, TouchableOpacity } from 'react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { COLORS } from '../../../constants/colors'

import {
  IconSTurnUp,
  IconMap2,
  IconCompass,
  IconNavigation,
} from '@tabler/icons-react-native';
import IconButton from 'components/buttons/IconButton';

export default function MapView() {

  // Handle Get Directions Press
  const handleGetDirections = () => {
    console.log('Get Directions Pressed');
  }

  // Handle Open in Maps Press
  const handleOpenInMaps = () => {
    console.log('Open in Maps Pressed');
  }

  // Handle Navigation Button Press/Go Back to Pin Location
  const handleNavigationPress = () => {
    console.log('Navigation Button Pressed');
  }

  // Handle Compass Button Press/Refocus to North
  const handleCompassPress = () => {
    console.log('Compass Button Pressed');
  }

  return (
    <ScreenWrapper
      header={
        <StandardHeader title="Apartment Map View"/>
      }
      headerBackgroundColor={COLORS.primary}
    >
      {/* Apartment Name and Address */}
      <View className='flex-row items-center justify-between bg-white p-5 gap-1'>
        <View className='flex gap-1'>
          <Text className='text-2xl font-interSemiBold text-primary'>
            Apartment Name
          </Text>
          <Text className='text-base text-grey-500'>
            1234 Main St, City, State, ZIP
          </Text>
        </View>

        <View className='flex-row items-center gap-3'>
          <TouchableOpacity
            activeOpacity={0.7}
            className='bg-darkerWhite p-2 rounded-xl'
            onPress={handleOpenInMaps}
          >
            <IconMap2 
              size={24} 
              color={COLORS.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            className='bg-darkerWhite p-2 rounded-xl'
            onPress={handleGetDirections}
          >
            <IconSTurnUp 
              size={24} 
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

      </View>

      <View className='flex-1 bg-amber-200 relative'>
        {/* 
          // TODO: Implement Google Maps API here
        */}

        {/* Floating Action Buttons */}
        <View className='flex items-center gap-5 absolute bottom-5 right-5'>
          <IconButton 
            iconName={IconNavigation}            
            onPress={handleNavigationPress}
          />

          <IconButton 
            iconName={IconCompass}            
            onPress={handleCompassPress}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}