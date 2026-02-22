import { View, Text } from 'react-native';

import { COLORS } from '@repo/constants';

import StatusPill from './StatusPill';
import PillButton from 'components/buttons/PillButton';

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

  const statusColor = status === 'Pending' ? COLORS.yellowish : COLORS.greenHulk;

  return (
    <View className='bg-primary rounded-3xl p-4'>
      {/* Title Header */}
      <View className='flex-row items-center justify-between'>
        <Text className='text-white text-2xl font-poppinsSemiBold'>
          Payment Summary
        </Text>

        {/* Status */}
        <StatusPill
          status={status}
          color={statusColor}
        />
      </View>

      {/* Payment Detaisl */}
      <View className='flex-1 flex-row items-center mt-5'>
        {/* Month Period */}
        <View className='flex w-1/2'>
          <Text className='text-darkerWhite text-base font-inter'>
            Period
          </Text>

          <Text className='text-white text-xl font-interMedium'>
            {periodMonth} {periodYear}
          </Text>
        </View>

        {/* Total Rent */}
        <View className='flex w-1/2'>
          <Text className='text-darkerWhite text-base font-inter'>
            Total Rent
          </Text>

          <Text className='text-white text-xl font-interMedium'>
            ₱ {totalRent}
          </Text>
        </View>
      </View>

      <View className='flex-1 flex-row items-center mt-5'>
        {/* Balance Left */}
        <View className='flex w-1/2'>
          <Text className='text-darkerWhite text-base font-inter'>
            Balance Left
          </Text>

          <Text className='text-white text-xl font-interMedium'>
            ₱ {balanceLeft}
          </Text>
        </View>

        {/* Balance Paid */}
        <View className='flex w-1/2'>
          <Text className='text-darkerWhite text-base font-inter'>
            Paid
          </Text>

          <Text className='text-white text-xl font-interMedium'>
            ₱ {balancePaid}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className='flex-row flex-1 mt-5 gap-5'>
        <View className='flex-1'>
          <PillButton
            label={'Pay Now'}
            type='secondary'
            size='sm'
            isFullWidth
            onPress={onPayNowPress}
          />
        </View>
        <View className='flex-1'>
          <PillButton
            label={'View History'}
            type='outline'
            size='sm'
            isFullWidth
            onPress={onViewHistoryPress}
          />
        </View>
      </View>
    </View>
  );
}
