import { View } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PillButton from '@/components/buttons/PillButton'

import {
  IconMapPinFilled
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'

const MAP_PIN_ICON_SIZE = 48;

export default function MapPin() {
  const router = useRouter();

  return (
    <ScreenWrapper
      header={
        <StandardHeader title="Set Location" />
      }

    >
      {/* Map API */}
      <View className='flex-1 bg-amber-200'>
        <View className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'>
          <IconMapPinFilled 
            size={MAP_PIN_ICON_SIZE} 
            color={COLORS.primary} 
          />
        </View>

        <View className='absolute bottom-0 right-0 left-0 p-5'>
          <PillButton 
            label='Save'
            isFullWidth
            onPress={() => {
              // Handle saving the location (for now, just log to the console)
              console.log("Location Saved");
              router.back();
            }}
          />
        </View>
      </View>
    </ScreenWrapper>
  )
}