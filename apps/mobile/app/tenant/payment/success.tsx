import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Button } from 'heroui-native'

import { useColors } from '@/hooks/useTheme'

import ReceiptCard from './components/ReceiptCard'

export default function Success() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useColors();

  const now = new Date()
  const receipt = {
    apartmentName: 'Sunny Apartments',
    landlordName: 'John Doe',
    date: new Intl.DateTimeFormat('en-PH', { dateStyle: 'full' }).format(now),
    time: new Intl.DateTimeFormat('en-PH', { timeStyle: 'short' }).format(now),
    method: 'GCash',
    amount: 1200,
    referenceNumber: 'APT-' + now.getTime().toString(36).toUpperCase(),
  }

  const handleGoHome = () => {
    router.replace('/(tabs)/(tenant)/rentals')
  }

  return (
    <View
      className='flex-1 bg-primary px-5'
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <View className='flex-1 justify-center'>
        <ReceiptCard
          apartmentName={receipt.apartmentName}
          landlordName={receipt.landlordName}
          date={receipt.date}
          time={receipt.time}
          method={receipt.method}
          amount={receipt.amount}
          referenceNumber={receipt.referenceNumber}
          backgroundColor={colors.primary}
        />
      </View>

      <View className='pb-4'>
        <Button onPress={handleGoHome} className='bg-white'>
          <Button.Label className='text-primary'>Go to Home</Button.Label>
        </Button>
      </View>
    </View>
  )
}
