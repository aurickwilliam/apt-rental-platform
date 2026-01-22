import { View, Text } from 'react-native'

import ScreenWrapper from '../../../components/layout/ScreenWrapper'
import PaymentSummaryCard from '../../../components/display/PaymentSummaryCard'
import LandlordCard from '../../../components/display/LandlordCard';

import {
  IconMapPinFilled,
  IconUserCircle,
} from '@tabler/icons-react-native';

import { COLORS } from '../../../constants/colors';

export default function Rentals() {
  return (
    <ScreenWrapper scrollable className='p-5'>
      <View className='flex-row items-center justify-start gap-2'>
        <IconMapPinFilled
          size={34}
          color={COLORS.primary}
          className='mr-2'
        />
        <Text className='text-secondary text-3xl font-dmserif leading-[34px]'>
          Apartment Name
        </Text>
      </View>

      {/* Payment Summary Card */}
      <View className='mt-5'>
        <PaymentSummaryCard
          periodMonth='January'
          periodYear='2023'
          status='Pending'
          totalRent={1000}
          balanceLeft={500}
          balancePaid={500}
        />
      </View>

      {/* Landlord Information*/}
      <View className='mt-5 flex gap-3'>
        <View className='flex-row items-center justify-start gap-2'>
          <IconUserCircle
            size={32}
            color={COLORS.primary}
          />
          <Text className='text-text text-lg font-poppinsMedium'>
            Landlord Information
          </Text>
        </View>

        <LandlordCard
          fullName={'Landlord Full Name'}
          email={'landlord@example.com'}
          phoneNumber={'123-456-7890'}
        />
      </View>
    </ScreenWrapper>
  )
}
