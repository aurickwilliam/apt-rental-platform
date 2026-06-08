import ScreenWrapper from '@/components/layout/ScreenWrapper'
import { View, Text } from 'react-native'

export default function AuthCompleteProfile() {
  return (
    <ScreenWrapper>
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg font-medium">
          Please complete your profile to continue.
        </Text>
      </View>
    </ScreenWrapper>
  )
}