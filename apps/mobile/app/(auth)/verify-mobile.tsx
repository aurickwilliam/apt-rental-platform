import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import NumberField from 'components/inputs/NumberField';
import PillButton from 'components/buttons/PillButton'

import { COLORS } from '@repo/constants'

import { IconChevronLeft } from '@tabler/icons-react-native'

import { usePHMobileValidation } from '@repo/hooks';

export default function VerifyMobile() {
  const router = useRouter();

  const { 
    value: mobileNumber, 
    validation, 
    onChange, 
    validate 
  } = usePHMobileValidation();

  const handleAndVerifyMobile = () => {
    const result = validate();
    if (!result.isValid) return;

    console.log("Verifying Mobile Number:", mobileNumber);
    router.push(`/(auth)/otp-verification?mobileNum=${mobileNumber}`);
  }

  return (
    <ScreenWrapper className='p-5'>
      <View className='flex-1 justify-between'>
        <View>
          {/* Back button */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="mb-3"
            onPress={() => router.back()}
          >
            <IconChevronLeft
              size={30}
              color={COLORS.text}
            />
          </TouchableOpacity>

          {/* Title */}
          <Text className="text-3xl text-text font-poppinsSemiBold my-5">
            Verify Your Mobile Number
          </Text>

          {/* Mobile Number Field */}
          <NumberField
            label='Mobile Number:'
            placeholder='09XXXXXXXXX'
            value={mobileNumber}
            onChange={onChange}
            maxLength={11}
            error={validation.errorMessage ?? undefined}
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
