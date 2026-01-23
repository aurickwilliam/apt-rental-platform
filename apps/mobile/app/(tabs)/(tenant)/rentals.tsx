import { View, Text } from 'react-native'
import { router, useRouter } from 'expo-router'

import ScreenWrapper from '../../../components/layout/ScreenWrapper'
import PaymentSummaryCard from '../../../components/display/PaymentSummaryCard'
import LandlordCard from '../../../components/display/LandlordCard';
import ApartmentDescriptionCard from "../../../components/display/ApartmentDescriptionCard";

import {
  IconMapPinFilled,
  IconUser,
  IconFileDescription,
  IconTool,
} from '@tabler/icons-react-native';

import { COLORS } from '../../../constants/colors';
import PillButton from 'components/buttons/PillButton';
import Divider from 'components/display/Divider';

export default function Rentals() {
  const router = useRouter();

  const handleRequestMaintenance = () => {
    // Navigate to the maintenance request screen
  }

  const handleViewMoreDetails = () => {
    router.push('/apartment-details');
  }

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
          <IconUser
            size={26}
            color={COLORS.text}
          />
          <Text className='text-text text-xl font-poppinsMedium'>
            Landlord Information
          </Text>
        </View>

        <LandlordCard
          fullName={'Landlord Full Name'}
          email={'landlord@example.com'}
          phoneNumber={'123-456-7890'}
        />
      </View>

      {/* Apartment Description */}
      <View className='mt-5 flex gap-3'>
        <View className='flex-row items-center justify-start gap-2'>
          <IconFileDescription
            size={26}
            color={COLORS.text}
          />
          <Text className='text-text text-xl font-poppinsMedium'>
            Apartment Description
          </Text>
        </View>

        <ApartmentDescriptionCard
          apartmentName="Apartment Name"
          apartmentAddress="123 Main St, City, Country"
          leaseStartMonth="January"
          leaseStartYear="2023"
          leaseEndMonth="December"
          leaseEndYear="2023"
          monthlyRent={1000}
          onPressViewMore={handleViewMoreDetails}
        />
      </View>

      {/* Divider */}
      <Divider />

      {/* Button to Request Maintenance */}
      <PillButton 
        label={'Request Maintenance Issue'}
        isFullWidth
        leftIconName={IconTool}
        onPress={handleRequestMaintenance}
      />
    </ScreenWrapper>
  )
}
