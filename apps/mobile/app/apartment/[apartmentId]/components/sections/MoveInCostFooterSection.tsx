import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { X } from 'lucide-react-native';

import { Button } from "heroui-native"

import { formatPesoDisplay } from '@repo/utils';

import { useColors } from 'hooks/useTheme';

type MoveInCostFooterProps = {
  monthlyRent: number;
  securityDeposit?: number | null;
  advanceRent?: number | null;
  onApplyNow: () => void;
};

export default function MoveInCostFooterSection({
  monthlyRent,
  securityDeposit,
  advanceRent,
  onApplyNow,
}: MoveInCostFooterProps) {
  const { colors } = useColors();

  const [isMoveInCostModalVisible, setIsMoveInCostModalVisible] =
    useState(false);

  const totalMoveIn =
    monthlyRent + (securityDeposit ?? 0) + (advanceRent ?? 0);

  return (
    <>
      <View className='absolute bottom-0 left-0 right-0 bg-surface-secondary z-10 px-5 py-4 border-t border-border'>
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
                <Text className='text-2xl font-interSemiBold text-accent'>
                  {formatPesoDisplay(monthlyRent)}
                </Text>
                <Text className='text-sm font-interMedium text-muted ml-1'>
                  /month
                </Text>
              </View>
              <Text className='text-xs font-inter text-muted mt-1 underline'>
                Move-in cost breakdown
              </Text>
            </TouchableOpacity>

            <View className='flex-1'>
              <Button
                onPress={onApplyNow}
                size="md"
              >
                <Button.Label>
                  Apply Now
                </Button.Label>
              </Button>
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
          className='flex-1 bg-backdrop justify-center px-6'
          onPress={() => setIsMoveInCostModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className='bg-surface-secondary rounded-2xl p-5 relative'
            onPress={(event) => event.stopPropagation()}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              className='absolute top-4 right-4 z-10 bg-surface-tertiary p-1.5 rounded-full'
              onPress={() => setIsMoveInCostModalVisible(false)}
            >
              <X size={20} color={colors.textPrimary} />
            </TouchableOpacity>

            <Text className='text-foreground font-interSemiBold text-xl pr-8'>
              Move-in Cost Breakdown
            </Text>
            <Text className='text-muted font-inter mt-1 mb-5'>
              Estimated initial payment required to move in.
            </Text>

            <View className='gap-3 bg-darkerWhite rounded-xl'>
              <View className='flex-row justify-between items-center'>
                <Text className='text-muted font-inter text-base'>
                  Monthly Rent
                </Text>
                <Text className='text-foreground font-interMedium text-base'>
                  {formatPesoDisplay(monthlyRent)}
                </Text>
              </View>

              <View className='flex-row justify-between items-center'>
                <Text className='text-muted font-inter text-base'>
                  Security Deposit
                </Text>
                <Text className='text-foreground font-interMedium text-base'>
                  {securityDeposit != null
                    ? `${formatPesoDisplay(securityDeposit)}`
                    : 'None'}
                </Text>
              </View>

              <View className='flex-row justify-between items-center'>
                <Text className='text-muted font-inter text-base'>
                  Advance Rent
                </Text>
                <Text className='text-foreground font-interMedium text-base'>
                  {advanceRent != null
                    ? `${formatPesoDisplay(advanceRent)}`
                    : 'None'}
                </Text>
              </View>

              <View className='h-px bg-muted my-1' />

              <View className='flex-row justify-between items-center'>
                <Text className='text-foreground font-interSemiBold text-lg'>
                  Total Move-in
                </Text>
                <Text className='text-accent font-interSemiBold text-lg'>
                  {formatPesoDisplay(totalMoveIn)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
