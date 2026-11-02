import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from "heroui-native"

import { formatPesoDisplay, type PaymentMethod } from '@repo/utils';
import AcceptedPaymentMethods from '@/components/display/AcceptedPaymentMethods';
import AppDialog from '@/components/display/AppDialog';
import MoveInCostBreakdown from '@/components/display/MoveInCostBreakdown';

type MoveInCostFooterProps = {
  monthlyRent: number;
  securityDeposit?: number | null;
  advanceRent?: number | null;
  /** The landlord's accepted payment methods, shown under the total; omitted until known. */
  acceptedMethods?: PaymentMethod[] | null;
  onApplyNow: () => void;
  applyDisabledReason?: string | null;
};

export default function MoveInCostFooterSection({
  monthlyRent,
  securityDeposit,
  advanceRent,
  acceptedMethods,
  onApplyNow,
  applyDisabledReason,
}: MoveInCostFooterProps) {
  const [isMoveInCostModalVisible, setIsMoveInCostModalVisible] =
    useState(false);



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
                isDisabled={!!applyDisabledReason}
              >
                <Button.Label>
                  {applyDisabledReason ?? 'Apply Now'}
                </Button.Label>
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </View>

      <AppDialog
        isOpen={isMoveInCostModalVisible}
        onOpenChange={setIsMoveInCostModalVisible}
        title="Move-in Cost Breakdown"
        description="Estimated initial payment required to move in."
      >
        <MoveInCostBreakdown
          monthlyRent={monthlyRent}
          securityDeposit={securityDeposit}
          advanceRent={advanceRent}
        />
        {acceptedMethods && acceptedMethods.length > 0 ? (
          <View className='mt-4 pt-4 border-t border-border'>
            <AcceptedPaymentMethods methods={acceptedMethods} />
          </View>
        ) : null}
      </AppDialog>
    </>
  );
}
