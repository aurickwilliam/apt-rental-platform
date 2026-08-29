import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Dialog, Separator } from "heroui-native"

import { formatPesoDisplay } from '@repo/utils';

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
                <Text className='text-2xl font-nunitoBold text-accent'>
                  {formatPesoDisplay(monthlyRent)}
                </Text>
                <Text className='text-sm font-nunitoSemiBold text-muted ml-1'>
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

      <Dialog isOpen={isMoveInCostModalVisible} onOpenChange={setIsMoveInCostModalVisible}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-backdrop items-center justify-center px-6" />
          <Dialog.Content className="w-full rounded-3xl bg-surface-secondary p-5">
            <Dialog.Close variant="ghost" className="absolute top-4 right-4 z-50" />

            <View className="mb-5 gap-1">
              <Dialog.Title className="text-foreground font-nunitoBold text-lg">
                Move-in Cost Breakdown
              </Dialog.Title>
              <Dialog.Description className="text-muted">
                Estimated initial payment required to move in.
              </Dialog.Description>
            </View>

            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-muted font-inter text-base">
                  Monthly Rent
                </Text>
                <Text className="text-foreground font-nunitoSemiBold text-base">
                  {formatPesoDisplay(monthlyRent)}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-muted font-inter text-base">
                  Security Deposit
                </Text>
                <Text className="text-foreground font-nunitoSemiBold text-base">
                  {securityDeposit != null
                    ? `${formatPesoDisplay(securityDeposit)}`
                    : 'None'}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-muted font-inter text-base">
                  Advance Rent
                </Text>
                <Text className="text-foreground font-nunitoSemiBold text-base">
                  {advanceRent != null
                    ? `${formatPesoDisplay(advanceRent)}`
                    : 'None'}
                </Text>
              </View>

              <Separator className="my-1" />

              <View className="flex-row justify-between items-center">
                <Text className="text-foreground font-nunitoSemiBold text-lg">
                  Total Move-in Cost
                </Text>
                <Text className="text-accent font-nunitoSemiBold text-lg">
                  {formatPesoDisplay(totalMoveIn)}
                </Text>
              </View>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
