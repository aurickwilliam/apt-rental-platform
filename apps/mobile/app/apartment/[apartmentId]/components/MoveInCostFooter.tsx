import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconX } from '@tabler/icons-react-native';

import PillButton from 'components/buttons/PillButton';
import { COLORS } from '@repo/constants';
import { formatCurrency } from '@repo/utils';

type MoveInCostFooterProps = {
  monthlyRent: number;
  securityDeposit?: number | null;
  advanceRent?: number | null;
  onApplyNow: () => void;
};

export default function MoveInCostFooter({
  monthlyRent,
  securityDeposit,
  advanceRent,
  onApplyNow,
}: MoveInCostFooterProps) {
  const [isMoveInCostModalVisible, setIsMoveInCostModalVisible] =
    useState(false);

  const totalMoveIn =
    monthlyRent + (securityDeposit ?? 0) + (advanceRent ?? 0);

  return (
    <>
      <View className='absolute bottom-0 left-0 right-0 bg-white z-10 px-5 py-4 border-t border-grey-200'>
        <SafeAreaView
          className='flex items-start justify-between gap-3'
          edges={['bottom']}
        >
          <View className='flex-1 flex-row gap-4 items-center'>
            <TouchableOpacity
              activeOpacity={0.7}
              className='flex-col shrink-0'
              onPress={() => setIsMoveInCostModalVisible(true)}
            >
              <View className='flex-row items-baseline'>
                <Text className='text-2xl font-poppinsSemiBold text-primary'>
                  ₱ {formatCurrency(monthlyRent)}
                </Text>
                <Text className='text-sm font-interMedium text-grey-500 ml-1'>
                  /month
                </Text>
              </View>
              <Text className='text-xs font-inter text-grey-500 mt-1 underline'>
                Move-in cost breakdown
              </Text>
            </TouchableOpacity>

            <View className='flex-1'>
              <PillButton label='Apply Now' size='md' onPress={onApplyNow} />
            </View>
          </View>
        </SafeAreaView>
      </View>

      <Modal
        visible={isMoveInCostModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setIsMoveInCostModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className='flex-1 bg-black/40 justify-center px-6'
          onPress={() => setIsMoveInCostModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className='bg-white rounded-2xl p-5 relative'
            onPress={(event) => event.stopPropagation()}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              className='absolute top-4 right-4 z-10 bg-grey-100 p-1.5 rounded-full'
              onPress={() => setIsMoveInCostModalVisible(false)}
            >
              <IconX size={20} color={COLORS.text} />
            </TouchableOpacity>

            <Text className='text-text font-poppinsSemiBold text-xl pr-8'>
              Move-in Cost Breakdown
            </Text>
            <Text className='text-grey-500 font-inter mt-1 mb-4'>
              Estimated initial payment required to move in.
            </Text>

            <View className='gap-3 bg-darkerWhite p-4 rounded-xl'>
              <View className='flex-row justify-between items-center'>
                <Text className='text-grey-500 font-inter text-base'>
                  Monthly Rent
                </Text>
                <Text className='text-text font-interMedium text-base'>
                  ₱ {formatCurrency(monthlyRent)}
                </Text>
              </View>

              <View className='flex-row justify-between items-center'>
                <Text className='text-grey-500 font-inter text-base'>
                  Security Deposit
                </Text>
                <Text className='text-text font-interMedium text-base'>
                  {securityDeposit != null
                    ? `₱ ${formatCurrency(securityDeposit)}`
                    : 'None'}
                </Text>
              </View>

              <View className='flex-row justify-between items-center'>
                <Text className='text-grey-500 font-inter text-base'>
                  Advance Rent
                </Text>
                <Text className='text-text font-interMedium text-base'>
                  {advanceRent != null
                    ? `₱ ${formatCurrency(advanceRent)}`
                    : 'None'}
                </Text>
              </View>

              <View className='h-px bg-grey-200 my-1' />

              <View className='flex-row justify-between items-center'>
                <Text className='text-text font-poppinsSemiBold text-lg'>
                  Total Move-in
                </Text>
                <Text className='text-primary font-poppinsSemiBold text-lg'>
                  ₱ {formatCurrency(totalMoveIn)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
