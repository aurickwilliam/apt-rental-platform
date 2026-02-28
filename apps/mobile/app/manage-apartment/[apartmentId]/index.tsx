import { View, Text, Image, TouchableOpacity} from 'react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PillButton from '@/components/buttons/PillButton'
import TenantCard from '@/components/display/TenantCard'
import PaymentHistoryCard from '@/components/display/PaymentHistoryCard'
import MaintenanceRequestCard from '@/components/display/MaintenanceRequestCard'

import {
  IconBath,
  IconBed,
  IconHome,
  IconMaximize,
  IconUser,  
  IconCircleCheckFilled
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'
import { DEFAULT_IMAGES } from '@/constants/images'

// Data for Rent Payment History
type paymentHistoryTypes = {
  id: number;
  month: string;
  year: string;
  amount: number;
  paidDate: string;
  status: 'paid' | 'partial'
}

export default function Index() {

  // Dummy data for payment history
  const paymentHistory: paymentHistoryTypes[] = [
    {id: 1, month: 'January', year: '2026', amount: 10_000, paidDate: '1/1/2026', status: 'paid'},
    {id: 2, month: 'Febuary', year: '2026', amount: 10_000, paidDate: '1/1/2026', status: 'partial'},
    {id: 3, month: 'March', year: '2026', amount: 10_000, paidDate: '1/1/2026', status: 'paid'},
    {id: 4, month: 'April', year: '2026', amount: 10_000, paidDate: '1/1/2026', status: 'partial'},
  ]

  return (
    <ScreenWrapper
      className='p-5'
      header={
        <StandardHeader title='Property' />
      }
      scrollable
      bottomPadding={50}
    >
      {/* Image Carousel */}

      {/* Property Details */}
      <View className='flex gap-5'>
        <View className='flex gap-1'>
          <Text className='text-primary text-3xl font-dmserif'>
            Property Name
          </Text>
          <Text className="text-text font-inter text-base">
            Full Address
          </Text>
        </View>

        {/* Monthly Rent */}
        <Text className='text-text text-lg font-interMedium'>
          ₱ 20,000<Text className="text-grey-500 font-inter text-base">/month</Text>
        </Text>

        {/* Apartment Type */}
        <View className='flex-row gap-1 items-center'>
          <IconHome size={24} color={COLORS.text} />
          <Text className='text-text text-base font-interMedium'>
            Apartment Type
          </Text>
        </View>

        {/* Specs */}
        <View className='flex-row flex-wrap'>
          {/* Bedroom */}
          <View className='flex-row w-2/6 gap-1 items-center justify-start'>
            <IconBed
              size={24}
              color={COLORS.text}
            />

            <Text className='text-grey-500 text-base'>
              1 Bedroom
            </Text>
          </View>

          {/* Bathroom */}
          <View className='flex-row w-2/6 gap-1 items-center justify-start'>
            <IconBath
              size={24}
              color={COLORS.text}
            />

            <Text className='text-grey-500 text-base'>
              1 Bathroom
            </Text>
          </View>

          {/* Square Meters */}
          <View className='flex-row w-2/6 gap-1 items-center justify-start'>
            <IconMaximize
              size={24}
              color={COLORS.text}
            />

            <Text className='text-grey-500 text-base'>
              50 Sqm
            </Text>
          </View>
        </View>

        <View className='mt-5 p-2 border-t border-b border-grey-300 flex-row items-center justify-between'>
          {/* No. of Properties */}
          <View className='flex items-center gap-1 w-1/3'>
            <Text className='text-base text-grey-500 font-inter'>
              No. of
            </Text>
            <Text className='text-3xl text-text font-interMedium'>
              5
            </Text>
            <Text className='text-base text-grey-500 font-interMedium'>
              Views
            </Text>
          </View>

          <View
            className='w-[1px] h-full bg-grey-300'
          />

          <View className='flex items-center gap-1 w-1/3'>
            <Text className='text-base text-grey-500 font-inter'>
              Ratings
            </Text>
            <Text className='text-3xl text-secondary font-interMedium'>
              4.5/5
            </Text>
            <Text className='text-base text-grey-500 font-interMedium'>
              Average
            </Text>
          </View>

          <View
            className='w-[1px] h-full bg-grey-300'
          />

          <View className='flex items-center gap-1 w-1/3'>
            <Text className='text-base text-grey-500 font-inter'>
              Status
            </Text>
            <IconCircleCheckFilled
              size={32}
              color={COLORS.greenHulk}
            />

            <Text className='text-base text-grey-500 font-interMedium'>
              Occupied
            </Text>
          </View>
        </View>
      </View>

      {/* Description Button */}
      <View className='mt-5'>
        <PillButton 
          label='View Full Description'
          size='sm'
          onPress={() => {}}
        />
      </View>

      {/* Tenant Information */}
      <View className='mt-5 flex gap-3'>
        <View className='flex-row gap-2 items-center'>
          <IconUser size={26} color={COLORS.text} />
          <Text className='text-text text-lg font-poppinsMedium'>
            Tenant Information
          </Text>
        </View>

        <TenantCard 
          fullName='John Doe'
          email='john.doe@example.com' 
          phoneNumber='09123456789' 
          profilePictureUrl={Image.resolveAssetSource(DEFAULT_IMAGES.defaultProfilePicture).uri}
          onPress={() => console.log('Tenant card pressed')} 
          leaseStartMonthYear={'Jan 2023'} 
          leaseEndMonthYear={'Jan 2024'}        
        />
      </View>
      
      {/* If has Maintenance Requests */}
      <View className='mt-5'>
        <MaintenanceRequestCard 
          issueName='Leaking Faucet'
          reportedDate='Aug 15, 2024'
          onUpdatePress={() => console.log('Update Maintenance Pressed')}
        />
      </View>

      {/* Rent Payment History */}
      <View className='mt-5'>
        <View className='flex-row items-center justify-between'>
          <Text className='text-text text-xl font-poppinsSemiBold'>
            Rent Payment History
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
          >
            <Text className='text-primary text-base font-inter'>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of Payments */}
        <View className='mt-5 flex gap-2'>
          {
            paymentHistory.map((payment) => (
              <PaymentHistoryCard
                key={payment.id}
                month={payment.month}
                year={payment.year}
                amount={payment.amount}
                paidDate={payment.paidDate}
                status={payment.status}
              />
            ))
          }
        </View>
      </View>
    </ScreenWrapper>
  )
}