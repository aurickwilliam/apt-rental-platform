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

      {/* Grid Stats */}
      <View className='flex gap-3'>
        <View className='flex-row gap-3'>
          <View className='flex-1 bg-primary rounded-2xl p-4 gap-1'>
            <Text className='text-sm text-darkerWhite font-interMedium'>Total Properties</Text>
            <Text className='text-4xl text-white font-interSemiBold'>5</Text>
          </View>

          <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200'>
            <Text className='text-sm text-gray-500 font-interMedium'>Total Properties</Text>
            <Text className='text-4xl font-interSemiBold'>5</Text>
          </View>
        </View>

        <View className='flex-row gap-3'>
          <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200'>
            <Text className='text-sm text-gray-500 font-interMedium'>Total Properties</Text>
            <Text className='text-4xl font-interSemiBold'>5</Text>
          </View>

          <View className='flex-1 bg-darkerWhite rounded-2xl p-4 gap-1'>
            <Text className='text-sm text-gray-500 font-interMedium'>Total Properties</Text>
            <Text className='text-4xl font-interSemiBold'>5</Text>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
} 