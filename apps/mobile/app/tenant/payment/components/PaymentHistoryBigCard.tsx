import { View, Text } from 'react-native'

import { PAYMENT_STATUS } from '@repo/constants';

import { formatDate, formatCurrency } from '@repo/utils';

interface PaymentHistoryBigCardProps {
  payment: {
    id: string;
    date: string;
    month: string;
    amount: number;
    status: typeof PAYMENT_STATUS[number];
    apartmentName: string;
    method: string;
  };
}

export default function PaymentHistoryBigCard({ payment }: PaymentHistoryBigCardProps) {

  const formattedDate = formatDate(payment.date, 'long');
  const formattedAmount = formatCurrency(payment.amount);

  const STATUS_STYLES: Record<typeof PAYMENT_STATUS[number], { container: string; text: string; border: string }> = {
    'Paid':    { container: 'bg-greenHulk-100', text: 'text-greenHulk-200', border: 'border-greenHulk-200' },
    'Unpaid':  { container: 'bg-redHead-100',   text: 'text-white',   border: 'border-redHead-200' },
    'Partial': { container: 'bg-yellowish-100', text: 'text-yellowish-200', border: 'border-yellowish-200' },
  }

  return (
    <View className='w-full border border-grey-300 rounded-2xl p-3 relative flex gap-5 items-center'>
      <View className='flex items-center gap-2'>
        <Text className='text-gray-500 text-base font-inter'>
          {formattedDate}
        </Text>
        <Text className='text-primary text-4xl font-interMedium'>
          ₱ {formattedAmount}
        </Text>
        <Text className='text-text text-lg font-interMedium'>
          {payment.apartmentName}
        </Text>
      </View>

      <View className='w-full flex-row items-center justify-between'>
        <Text className='text-grey-500 text-base font-inter'>
          Method: {payment.method}
        </Text>

        <Text className='text-grey-500 text-base font-inter'>
          Payment ID: {payment.id}
        </Text>
      </View>

      <View className={`absolute top-2 right-2 px-4 py-1 rounded-full ${STATUS_STYLES[payment.status].container} border ${STATUS_STYLES[payment.status].border}`}>
        <Text className={`text-sm font-interMedium ${STATUS_STYLES[payment.status].text}`}>
          {payment.status}
        </Text>
      </View>
    </View>
  )
}