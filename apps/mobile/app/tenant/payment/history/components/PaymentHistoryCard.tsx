import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { Card, Chip, PressableFeedback } from 'heroui-native'

import { formatPesoDisplay } from '@repo/utils'

import { usePaymentStatusStyles, type PaymentStatus } from '@/hooks/payments'

export interface PaymentHistoryItem {
  id: string;
  date: string;
  month: string;
  amount: number;
  status: PaymentStatus;
  apartmentName: string;
  landlordName: string;
  method: string;
}

interface PaymentHistoryCardProps {
  payment: PaymentHistoryItem;
}

export default function PaymentHistoryCard({ payment }: PaymentHistoryCardProps) {
  const router = useRouter()
  const statusStyles = usePaymentStatusStyles()
  const statusStyle = statusStyles[payment.status]

  const handlePress = () => {
    router.push({
      pathname: '/tenant/payment/history/[paymentId]',
      params: {
        paymentId: payment.id,
      },
    })
  }

  return (
    <PressableFeedback
      onPress={handlePress}
      className='rounded-3xl overflow-hidden'
    >
      <PressableFeedback.Highlight />
      <Card className='shadow-none border border-border'>
        <Card.Header>
          <View className='flex-row items-center justify-between gap-3'>
            <Text
              className='text-foreground font-nunitoSemiBold text-base flex-1'
              numberOfLines={1}
            >
              {payment.month}
            </Text>

            <Text className='text-accent text-base font-nunitoSemiBold'>
              {formatPesoDisplay(payment.amount)}
            </Text>
          </View>
        </Card.Header>

        <Card.Body className='pt-0 gap-1'>
          <Text
            className='text-muted text-xs font-inter'
            numberOfLines={1}
          >
            {payment.apartmentName}
          </Text>

          <View className='flex-row items-center justify-between gap-3'>
            <Text className='text-muted text-xs font-inter'>
              via {payment.method}
            </Text>

            <Chip
              variant='soft'
              size='sm'
              animation='disable-all'
              style={{ backgroundColor: statusStyle.backgroundColor }}
            >
              <Chip.Label
                style={{ color: statusStyle.textColor }}
                className='text-xs font-nunitoSemiBold'
              >
                {payment.status}
              </Chip.Label>
            </Chip>
          </View>
        </Card.Body>
      </Card>
    </PressableFeedback>
  )
}
