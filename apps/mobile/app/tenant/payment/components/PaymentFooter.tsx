import { View, Text } from 'react-native'
import { Button } from 'heroui-native'
import { formatPesoDisplay } from '@repo/utils'

interface PaymentFooterProps {
  totalPayment: number
  onPayPress: () => void
  isProcessing?: boolean
}

export default function PaymentFooter({ totalPayment, onPayPress, isProcessing = false }: PaymentFooterProps) {
  return (
    <View className='w-full p-5 border-t border-border flex-row items-center justify-between bg-surface gap-10'>
      <View className='flex'>
        <Text className='text-muted font-nunitoSemiBold'>
          Total Rent Due
        </Text>

        <Text className='text-primary text-2xl font-nunitoBold'>
          {formatPesoDisplay(totalPayment)}
        </Text>
      </View>

      <Button onPress={onPayPress} isDisabled={isProcessing} className='flex-1'>
        <Button.Label>{isProcessing ? 'Processing…' : 'Pay'}</Button.Label>
      </Button>
    </View>
  )
}
