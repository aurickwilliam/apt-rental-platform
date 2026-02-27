import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

import { IMAGES } from '@/constants/images'
import { COLORS } from '@repo/constants'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import {
  IconBell
} from "@tabler/icons-react-native"

export default function Dashboard() {
  const router = useRouter();

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
      bottomPadding={50}
    >
      <View className='flex-row items-center justify-between mb-5'>
        {/* Logo and Label */}
        <View className='flex-row gap-3 items-center'>
          <Image 
            source={IMAGES.logo}
            className='size-9'
            resizeMode='contain'
          />

          <Text className='text-secondary text-4xl font-dmserif'>
            Dashboard
          </Text>
        </View>

        {/* Notification */}
        <TouchableOpacity>
          <IconBell
            size={26}
            color={COLORS.grey}
            onPress={() => router.push('/landlord-notif')}
          />
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  )
} 