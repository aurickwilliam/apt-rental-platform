import { useEffect, useMemo } from 'react'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Button } from 'heroui-native'
import { IconChevronLeft } from '@tabler/icons-react-native'

import { useColors } from '@/hooks/useTheme'

import ReceiptCard from '../components/ReceiptCard'
import { getPaymentById } from './mockPaymentHistory'

export default function PaymentReceipt() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useColors();
  const { paymentId } = useLocalSearchParams<{ paymentId: string }>();

  const payment = useMemo(() => {
    if (!paymentId) return null;
    return getPaymentById(paymentId);
  }, [paymentId]);

  useEffect(() => {
    if (!payment) {
      router.back();
    }
  }, [payment, router]);

  if (!payment) {
    return null;
  }

  const paymentDate = new Date(payment.date);
  const referenceNumber = `APT-${payment.id.padStart(6, '0')}`;
  const time = new Date(payment.date);
  time.setHours(8 + (Number(payment.id) % 12), (Number(payment.id) * 7) % 60);

  return (
    <View
      className='flex-1 bg-primary px-5'
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom
      }}
    >
      <View className='pt-2'>
        <Button
          onPress={() => router.back()}
          variant='ghost'
          isIconOnly
          className='bg-white/20 self-start'
        >
          <IconChevronLeft size={24} color='#FFFFFF' />
        </Button>
      </View>

      <View className='flex-1 justify-center'>
        <ReceiptCard
          apartmentName={payment.apartmentName}
          landlordName={payment.landlordName}
          date={new Intl.DateTimeFormat('en-PH', { dateStyle: 'full' }).format(paymentDate)}
          time={new Intl.DateTimeFormat('en-PH', { timeStyle: 'short' }).format(time)}
          method={payment.method}
          amount={payment.amount}
          referenceNumber={referenceNumber}
          status={payment.status}
          periodLabel={`${payment.month} ${paymentDate.getFullYear()}`}
          backgroundColor={colors.primary}
        />
      </View>
    </View>
  )
}
