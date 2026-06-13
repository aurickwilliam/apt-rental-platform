import { View, Text } from 'react-native';

import { useColors } from 'hooks/useTheme';

import { Button, Chip } from 'heroui-native';

interface PaymentSummaryCardProps {
  periodMonth?: string;
  periodYear?: string;
  status?: 'Pending' | 'Paid';
  totalRent?: number;
  balanceLeft?: number;
  balancePaid?: number;
  onPayNowPress?: () => void;
  onViewHistoryPress?: () => void;
}

export default function PaymentSummaryCard({
  periodMonth = 'Month',
  periodYear = 'Year',
  status = 'Pending',
  totalRent = 0,
  balanceLeft = 0,
  balancePaid = 0,
  onPayNowPress,
  onViewHistoryPress,
}: PaymentSummaryCardProps) {

  const { colors } = useColors();

  const isPending = status === 'Pending';

  return (
    <View className='bg-accent rounded-3xl p-4'>
      {/* Title Header */}
      <View className='flex-row items-center justify-between'>
        <Text className='text-white text-xl font-interSemiBold'>
          Payment Summary
        </Text>

        {/* Status */}
        <Chip
          size="md"
          variant="soft"
          style={{ backgroundColor: isPending ? colors.warningLight : colors.successLight }}
        >
          <Chip.Label
            className='font-interMedium'
            style={{ color: isPending ? colors.warning : colors.success }}
          >
            {status}
          </Chip.Label>
        </Chip>
      </View>

      {/* Payment Details */}
      <View className='flex-1 flex-row items-center mt-5'>
        {/* Month Period */}
        <View className='flex w-1/2'>
          <Text className='text-gray-100 text-sm font-inter'>
            Period
          </Text>

          <Text className='text-white text-base font-interMedium'>
            {periodMonth} {periodYear}
          </Text>
        </View>

        {/* Total Rent */}
        <View className='flex w-1/2'>
          <Text className='text-gray-100 text-sm font-inter'>
            Total Rent
          </Text>

          <Text className='text-white text-base font-interMedium'>
            ₱ {totalRent}
          </Text>
        </View>
      </View>

      <View className='flex-1 flex-row items-center mt-5'>
        {/* Balance Left */}
        <View className='flex w-1/2'>
          <Text className='text-gray-100 text-sm font-inter'>
            Balance Left
          </Text>

          <Text className='text-white text-base font-interMedium'>
            ₱ {balanceLeft}
          </Text>
        </View>

        {/* Balance Paid */}
        <View className='flex w-1/2'>
          <Text className='text-gray-100 text-sm font-inter'>
            Paid
          </Text>

          <Text className='text-white text-base font-interMedium'>
            ₱ {balancePaid}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className='flex-row flex-1 mt-5 gap-5'>
        <Button
          size="sm"
          onPress={onPayNowPress}
          className='flex-1 bg-secondary text-secondary-foreground'
        >
          <Button.Label>
            Pay Now
          </Button.Label>
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onPress={onViewHistoryPress}
          className='flex-1'
        >
          <Button.Label>
            View History
          </Button.Label>
        </Button>
      </View>
    </View>
  );
}