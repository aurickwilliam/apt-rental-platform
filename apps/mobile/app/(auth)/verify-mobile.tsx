import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import NumberField from 'components/inputs/NumberField';
import PillButton from 'components/buttons/PillButton'

import { COLORS } from '@repo/constants'

import { IconChevronLeft } from '@tabler/icons-react-native'

import { usePHMobileValidation } from '@repo/hooks';

import { useRegistrationStore } from '@/store/useRegistrationStore';

export default function VerifyMobile() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const { setData, data } = useRegistrationStore();

  const {
    value: mobileNumber,
    validation,
    onChange,
    validate
  } = usePHMobileValidation(data.mobileNumber ?? '');

  const handleAndVerifyMobile = () => {
    const result = validate();
    if (!result.isValid) return;

    setData({ mobileNumber });

    router.push({
      pathname: '/(auth)/otp-verification',
      params: { email, mobileNum: mobileNumber }
    });
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
            Enter Your Mobile Number
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
          label="Proceed to OTP Verification"
          onPress={handleAndVerifyMobile}
          isFullWidth
        />
      </View>
    </ScreenWrapper>
  )
}
