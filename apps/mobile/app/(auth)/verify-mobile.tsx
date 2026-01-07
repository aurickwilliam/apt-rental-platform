import { View, Text, Pressable } from 'react-native'
import { useState } from 'react'

import Ionicons from '@expo/vector-icons/build/Ionicons'
import { useRouter } from 'expo-router'

import { COLORS } from '../../constants/colors'
import ScreenWrapper from '../../components/ScreenWrapper'
import NumberField from '../../components/NumberField';
import PillButton from '../../components/PillButton'

export default function VerifyMobile() {
  const router = useRouter();

  const [mobileNumber, setMobileNumber] = useState<string>('');

  const handleAndVerifyMobile = () => {
    console.log("Verifying Mobile Number:", mobileNumber);
    router.push(`/(auth)/otp-verification?mobileNum=${mobileNumber}`);
  }

  return (
    <ScreenWrapper hasInput scrollable>
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

      {/* Spacer */}
      <View className="flex-1" />

      {/* Verify Button */}
      <PillButton
        label="Verify"
        onPress={handleAndVerifyMobile}
        isFullWidth
      />
    </ScreenWrapper>
  )
}
