import { View, Text } from "react-native";

import {
  IconMapPinFilled
} from "@tabler/icons-react-native"

import { COLORS } from "@/constants/colors";

import PillButton from "./PillButton";

interface PaymentSummaryCardProps {
  monthDue: string;
  amountDue: number;
  apartmentName: string;
  daysRemaining: number;
}

export default function PaymentSummaryCard({
  monthDue,
  amountDue,
  apartmentName,
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
    <View className='w-full bg-primary mt-5 p-4 rounded-3xl'>
      {/* Currently Renting */}
      <View className='flex-row items-center gap-1'>
        {/* Pin Icon*/}
        <IconMapPinFilled
          size={24}
          color={COLORS.white}
        />

        {/* Apartment Name */}
        <Text className='text-white text-xl font-poppinsSemiBold'>
          {apartmentName}
        </Text>
      </View>

      {/* Payment Summary */}
      <View className='flex mt-4 gap-2'>
        <View className="flex-row items-center justify-start gap-2">
          {/* Month Due */}
          <Text className='text-white text-base font-inter'>
            {monthDue} Due
          </Text>

          {/* Days remaining */}
          <Text className='text-white text-base font-inter'>
            ({daysRemaining} days left)
          </Text>
        </View>

        {/* Amount */}
        <Text className='text-white text-4xl font-poppinsSemiBold'>
          ₱ {amountDue}
        </Text>
        
      </View>

      {/* Payment Buttons */}
      <View className="flex-1 flex-row items-center justify-between mt-2 gap-3">
        <View className='flex-1'>
          <PillButton
            label="Pay Now"
            type='secondary'
            isFullWidth
            size="sm"
            onPress={() => handlePayNow()}
          />
        </View>
        <View className="flex-1">
          <PillButton
            label="View Details"
            type='outline'
            isFullWidth
            size="sm"
            onPress={() => handleViewDetails()}
          />
        </View>
      </View>
    </View>
  );
}
