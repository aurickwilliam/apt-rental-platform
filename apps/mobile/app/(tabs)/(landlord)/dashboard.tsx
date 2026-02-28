import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

import { IMAGES } from '@/constants/images'
import { COLORS } from '@repo/constants'

import ScreenWrapper from '@/components/layout/ScreenWrapper'

import {
  IconBell
} from "@tabler/icons-react-native"
import RentDueCard from '@/components/display/RentDueCard'

export default function Dashboard() {
  const router = useRouter();
  
  // Dummy data for stats
  const stats = {
    totalProperties: 5,
    unitsOccupied: 5,
    pendingPayments: 2,
    maintenanceRequests: 1,
  }

  // Dummy data for upcoming rent due
  const upcomingRentDue = [
    {
      id: 1,
      tenantName: 'John Doe',
      propertyName: 'Sunset Apartments - Unit 3B',
      dueDate: '2024-07-05',
      amount: 1_200.00,
    },
    {
      id: 2,
      tenantName: 'Jane Smith',
      propertyName: 'Maple Residences - Unit 2A',
      dueDate: '2024-07-10',
      amount: 1_500.00,
    },
    {
      id: 3,
      tenantName: 'Michael Johnson',
      propertyName: 'Oakwood Villas - Unit 1C',
      dueDate: '2024-07-15',
      amount: 1_000.00,
    }
  ]

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
      bottomPadding={50}
    >
      <View className='flex-row items-center justify-between mb-5'>
        {/* Logo and Label */}
        <View className='flex-row gap-3 items-center'>
          <Image 
            source={IMAGES.logo}
            className='size-9'
            resizeMode='contain'
          />

          <Text className='text-secondary text-4xl font-dmserif'>
            Dashboard
          </Text>
        </View>

        {/* Notification */}
        <TouchableOpacity>
          <IconBell
            size={26}
            color={COLORS.grey}
            onPress={() => router.push('/landlord-notif')}
          />
        </TouchableOpacity>
      </View>

      {/* Grid Stats */}
      <View className='flex gap-3'>
        <View className='flex-row gap-3'>
          <View className='flex-1 bg-primary rounded-2xl p-4 gap-1'>
            <Text className='text-sm text-darkerWhite font-interMedium'>
              Total Properties
            </Text>
            <Text className='text-3xl text-white font-interSemiBold'>
              {stats.totalProperties}
            </Text>
          </View>

          <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200'>
            <Text className='text-sm text-gray-500 font-interMedium'>
              Units Occupied
            </Text>
            <Text className='text-3xl font-interSemiBold'>
              {stats.unitsOccupied}/{stats.totalProperties}
            </Text>
          </View>
        </View>

        <View className='flex-row gap-3'>
          <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200'>
            <Text className='text-sm text-gray-500 font-interMedium'>
              Pending Payments
            </Text>
            <Text className='text-3xl font-interSemiBold'>
              {stats.pendingPayments}
            </Text>
          </View>

          <View className='flex-1 bg-darkerWhite rounded-2xl p-4 gap-1'>
            <Text className='text-sm text-gray-500 font-interMedium'>
              Maintenance Requests
            </Text>
            <Text className='text-3xl font-interSemiBold'>
              {stats.maintenanceRequests}
            </Text>
          </View>
        </View>
      </View>

      {/* Upcoming Payment Due Date */}
      <View className='flex gap-5 mt-5'>
        <Text className='text-text text-lg font-poppinsMedium'>
          Upcoming Rent Due
        </Text>

        <View className='flex gap-3'>
          {
            upcomingRentDue.map((rent) => (
              <RentDueCard 
                key={rent.id} 
                {...rent}
                onPress={() => {
                  console.log("Rent due card pressed:", rent.id);
                }}
              />
            ))
          }
        </View>
      </View>
    </ScreenWrapper>
  )
} 