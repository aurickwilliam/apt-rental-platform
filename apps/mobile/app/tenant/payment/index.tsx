import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import Divider from '@/components/display/Divider'
import PillButton from '@/components/buttons/PillButton'

import { formatCurrency } from '@repo/utils'

export default function Index() {
  const router = useRouter();

  // TODO: Fetch apartment details and rent payment information from API and display here. For now, we will use dummy data.

  // Dummy data for apartment details and rent payment information
  const apartmentDetails = {
    name: 'Sunny Apartments',
    address: '123 Main St, City, State',
    landlord: 'John Doe',
    leaseStart: '01/01/2024',
    leaseEnd: '12/31/2024',
    month: 'October',
    year: '2024',
    monthlyRent: 1_200.00,
    dueDate: '10/05/2024',
    paymentStatus: 'Unpaid', // or 'Paid'
    paidAmount: 0.00,
  }

  // Calculate total payment (for now, it's just the monthly rent minus any paid amount, but this can be expanded to include late fees, discounts, etc.)
  const totalPayment = apartmentDetails.monthlyRent - apartmentDetails.paidAmount;

  // Handle Checkout button press
  const handleCheckout = () => {
    router.push('/tenant/payment/methods');
  }

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Rent Payment' />
      }
    >
      <View className='p-5'>
        {/* Aparment Details */}
        <View className='flex gap-3'>
          <View className='flex'>
            <Text className='text-sm text-grey-500 font-inter'>
              Apartment Name
            </Text>
            <Text className='text-text text-lg font-interMedium'>
              {apartmentDetails.name}
            </Text>
          </View>

          <View className='flex'>
            <Text className='text-sm text-grey-500 font-inter'>
              Address
            </Text>
            <Text className='text-text text-lg font-interMedium'>
              {apartmentDetails.address}
            </Text>
          </View>

          <View className='flex'>
            <Text className='text-sm text-grey-500 font-inter'>
              Landlord
            </Text>
            <Text className='text-text text-lg font-interMedium'>
              {apartmentDetails.landlord}
            </Text>
          </View>

          <View className='flex-row gap-5'>
            <View className='flex-1'>
              <Text className='text-sm text-grey-500 font-inter'>
                Lease Start
              </Text>
              <Text className='text-text text-lg font-interMedium'>
                {apartmentDetails.leaseStart}
              </Text>
            </View>

            <View className='flex-1'>
              <Text className='text-sm text-grey-500 font-inter'>
                Lease End
              </Text>
              <Text className='text-text text-lg font-interMedium'>
                {apartmentDetails.leaseEnd}
              </Text>
            </View>
          </View>
        </View>

        <Divider />

        {/* Payment Summary */}
        <View className='w-full border border-grey-300 rounded-xl p-4'>
          {/* Title */}
          <Text className='text-secondary text-lg font-poppinsMedium'>
            Payment Summary
          </Text>

          {/* Details */}
          <View className='flex gap-2 mt-3'>
            {/* Payment for Month and Year */}
            <View className='flex-row justify-between items-center'>
              <Text className='text-base text-text font-inter'>
                Month & Year
              </Text>
              <Text className='text-text text-base font-inter'>
                {apartmentDetails.month} {apartmentDetails.year}
              </Text>
            </View>

            {/* Due Date of Payment */}
            <View className='flex-row justify-between items-center'>
              <Text className='text-base text-text font-inter'>
                Due Date
              </Text>
              <Text className='text-text text-base font-inter'>
                {apartmentDetails.dueDate}
              </Text>
            </View>

            {/* Monthly Rent */}
            <View className='flex-row justify-between items-center'>
              <Text className='text-base text-text font-inter'>
                Monthly Rent
              </Text>
              <Text className='text-text text-base font-inter'>
                ₱ {formatCurrency(apartmentDetails.monthlyRent)}
              </Text>
            </View>

            {/* Amount Paid */}
            <View className='flex-row justify-between items-center'>
              <Text className='text-base text-text font-inter'>
                Paid
              </Text>
              <Text className='text-text text-base font-inter'>
                ₱ {formatCurrency(apartmentDetails.paidAmount)}
              </Text>
            </View>

            <Divider marginVertical={3}/>

            {/* Balance Left */}
            <View className='flex-row justify-between items-center'>
              <Text className='text-base text-text font-inter'>
                Balance Left
              </Text>
              <Text className='text-text text-base font-inter'>
                ₱ {formatCurrency(totalPayment)}
              </Text>
            </View>

            {/* Spacing */}
            <View className='h-10' />

            {/* Total Payment */}
            <View className='flex-row justify-between items-center mt-2'>
              <Text className='text-base text-text font-inter'>
                Total Payment
              </Text>
              <Text className='text-text text-base font-inter'>
                ₱ {formatCurrency(totalPayment)}
              </Text>
            </View>
          </View>
        </View>

      </View>

      <View className='flex-1'/>
      
      {/* Checkout Button */}
      <View className='w-full p-5 border-t border-grey-300 flex-row items-center justify-between bg-white'>
        <View className='flex'>
          <Text className='text-grey-500 font-interMedium'>
            Total
          </Text>

          <Text className='text-primary text-3xl font-poppinsMedium'>
            ₱ {formatCurrency(totalPayment)}
          </Text>
        </View>

        <PillButton
          label='Checkout'
          width='w-48'
          onPress={handleCheckout}
        />
      </View>
    </ScreenWrapper>
  )
}