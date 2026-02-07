import { View, Text, Pressable } from 'react-native'
import { useState } from 'react'
import Ionicons from '@expo/vector-icons/build/Ionicons'
import { useRouter } from 'expo-router'

import ScreenWrapper from '../../components/layout/ScreenWrapper'
import NumberField from '../../components/inputs/NumberField';
import PillButton from '../../components/buttons/PillButton'

import { COLORS } from '../../constants/colors'

export default function VerifyMobile() {
  const router = useRouter();

  const [mobileNumber, setMobileNumber] = useState<string>('');

  const handleAndVerifyMobile = () => {
    console.log("Verifying Mobile Number:", mobileNumber);
    router.push(`/(auth)/otp-verification?mobileNum=${mobileNumber}`);
  }

  return (
    <ScreenWrapper
      className='p-5'
    >
      <View className='flex-1 justify-between'>
        <View>
          {/* Back button */}
          <Pressable className="mb-3" onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={30} color={COLORS.text} />
          </Pressable>

          {/* Title */}
          <Text className="text-3xl text-text font-poppinsSemiBold my-5">
            Verify Your Mobile Number
          </Text>

          {/* TODO: Validate Mobile Number length and format */}

          {/* Mobile Number Field */}
          <NumberField
            label='Mobile Number:'
            placeholder='09XXXXXXXXX'
            value={mobileNumber}
            onChange={setMobileNumber}
            maxLength={11}
          />
        </View>

        {/* Verify Button */}
        <PillButton
          label="Verify"
          onPress={handleAndVerifyMobile}
          isFullWidth
        />
      </View>
    </ScreenWrapper>
  )
}
