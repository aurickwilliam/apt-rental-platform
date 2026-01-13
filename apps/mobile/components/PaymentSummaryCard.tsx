import { View, Text } from "react-native";

import {
  IconMapPinFilled
} from "@tabler/icons-react-native"

import { COLORS } from "@/constants/colors";

import PillButton from "./PillButton";

interface PaymentSummaryCardProps {
  monthDue: string;
  amountDue: number;
  address: string;
  daysRemaining: number;
}

export default function PaymentSummaryCard({
  monthDue,
  amountDue,
  address,
  daysRemaining
}: PaymentSummaryCardProps) {

  const handlePayNow = () => {
    // TODO: Implement pay now functionality here
    console.log("PAY NOW!");
  };

  const handleViewDetails = () => {
    // TODO: Implement view details functionality here
    console.log("VIEW DETAILS!");
  };

  // TODO: Add commas to amountDue and add .00 at the end

  return (
    <View className='w-full bg-primary mt-8 p-5 rounded-3xl'>
      {/* Currently Renting */}
      <View className='flex gap-2'>
        <View className='flex-row items-center gap-1'>
          {/* Pin Icon*/}
          <IconMapPinFilled
            size={24}
            color={COLORS.white}
          />

          <Text className='text-white text-xl font-poppinsSemiBold'>
            Currently Renting in:
          </Text>
        </View>

        {/* Address */}
        <Text className='text-white text-sm font-inter'>
          {address}
        </Text>
      </View>

      {/* Payment Summary */}
      <View className='flex mt-5'>
        {/* Month Due */}
        <Text className='text-white text-xl font-poppinsMedium'>
          Month {monthDue} Due:
        </Text>
        {/* Amount */}
        <Text className='text-white text-3xl font-poppinsSemiBold'>
          ₱ {amountDue}
        </Text>
        {/* Days remaining */}
        <Text className='text-white text-sm font-inter'>
          {daysRemaining} days remaining
        </Text>
      </View>

      {/* Payment Buttons */}
      <View className="flex-row items-center justify-between mt-5 gap-3">
        <View className='flex-1'>
          <PillButton
            label="Pay Now"
            type='secondary'
            isFullWidth
            onPress={() => handlePayNow()}
          />
        </View>
        <View className="flex-1">
          <PillButton
            label="View Details"
            type='outline'
            isFullWidth
            onPress={() => handleViewDetails()}
          />
        </View>
      </View>
    </View>
  );
}
