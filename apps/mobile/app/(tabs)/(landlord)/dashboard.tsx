import { useState, useEffect } from 'react'
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'

import { IMAGES } from '@/constants/images'

import { COLORS } from '@repo/constants'
import { supabase } from '@repo/supabase'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import { IconBell } from "@tabler/icons-react-native"
import RentDueCard from '@/components/display/RentDueCard'
import ProfitTrendCard from '@/components/charts/ProfitTrendCard'
import ProfitByPropertyCard from '@/components/charts/ProfitByPropertyCard'

import { useProfile } from '@/hooks/useProfile'

type DashboardStats = {
  totalProperties: number
  unitsOccupied: number
  pendingPayments: number
  maintenanceRequests: number
}

export default function Dashboard() {
  const router = useRouter()
  const { profile, loading: profileLoading } = useProfile()

  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    unitsOccupied: 0,
    pendingPayments: 0,
    maintenanceRequests: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (!profile) return
    fetchStats(profile.id)
  }, [profile])

  const fetchStats = async (landlordId: string) => {
    try {
      const [
        { count: totalProperties },
        { count: unitsOccupied },
        { count: pendingPayments },
        { count: maintenanceRequests },
      ] = await Promise.all([
        
        // Total properties for landlord
        supabase
          .from('apartments')
          .select('*', { count: 'exact', head: true })
          .eq('landlord_id', landlordId)
          .is('deleted_at', null),

        // Units with an active tenancy
        supabase
          .from('tenancies')
          .select('*', { count: 'exact', head: true })
          .eq('landlord_id', landlordId)
          .eq('status', 'active'),

        // Payments with status 'not paid' across landlord's apartments
        supabase
          .from('payment')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'not paid')
          .in(
            'apartment_id',
            (
              await supabase
                .from('apartments')
                .select('id')
                .eq('landlord_id', landlordId)
                .is('deleted_at', null)
            ).data?.map((a) => a.id) ?? []
          ),

        // Open maintenance requests (pending or in_progress) across landlord's apartments
        supabase
          .from('maintenance_request')
          .select('*', { count: 'exact', head: true })
          .in('status', ['pending', 'in_progress'])
          .in(
            'apartment_id',
            (
              await supabase
                .from('apartments')
                .select('id')
                .eq('landlord_id', landlordId)
                .is('deleted_at', null)
            ).data?.map((a) => a.id) ?? []
          ),
      ])

      setStats({
        totalProperties: totalProperties ?? 0,
        unitsOccupied: unitsOccupied ?? 0,
        pendingPayments: pendingPayments ?? 0,
        maintenanceRequests: maintenanceRequests ?? 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const upcomingRentDue = [
    { id: 1, tenantName: 'John Doe', propertyName: 'Sunset Apartments - Unit 3B', dueDate: '2024-07-05', amount: 1_200.00 },
    { id: 2, tenantName: 'Jane Smith', propertyName: 'Maple Residences - Unit 2A', dueDate: '2024-07-10', amount: 1_500.00 },
    { id: 3, tenantName: 'Michael Johnson', propertyName: 'Oakwood Villas - Unit 1C', dueDate: '2024-07-15', amount: 1_000.00 },
  ]

  const isLoading = profileLoading || statsLoading

  return (
    <ScreenWrapper scrollable className='p-5' bottomPadding={50}>
      <View className='flex-row items-center justify-between mb-5'>
        <View className='flex-row gap-3 items-center'>
          <Image source={IMAGES.logo} className='size-9' resizeMode='contain' />
          <Text className='text-secondary text-4xl font-dmserif'>Dashboard</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/landlord-notif')}>
          <IconBell size={26} color={COLORS.grey} />
        </TouchableOpacity>
      </View>

      {/* Grid Stats */}
      {isLoading ? (
        <ActivityIndicator size="large" color={COLORS.primary} className="my-6" />
      ) : (
        <View className='flex gap-3'>
          <View className='flex-row gap-3'>
            <View className='flex-1 bg-primary rounded-2xl p-4 gap-1 justify-center'>
              <Text className='text-sm text-darkerWhite font-interMedium'>Total Properties</Text>
              <Text className='text-3xl text-white font-interSemiBold'>{stats.totalProperties}</Text>
            </View>

            <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200 justify-center'>
              <Text className='text-sm text-gray-500 font-interMedium'>Units Occupied</Text>
              <Text className='text-3xl font-interSemiBold'>
                {stats.unitsOccupied}/{stats.totalProperties}
              </Text>
            </View>
          </View>

          <View className='flex-row gap-3'>
            <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200 justify-center'>
              <Text className='text-sm text-gray-500 font-interMedium'>Pending Payments</Text>
              <Text className='text-3xl font-interSemiBold'>{stats.pendingPayments}</Text>
            </View>

            <View className='flex-1 bg-darkerWhite rounded-2xl p-4 gap-1 justify-center'>
              <Text className='text-sm text-gray-500 font-interMedium'>Maintenance Requests</Text>
              <Text className='text-3xl font-interSemiBold'>{stats.maintenanceRequests}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Charts */}
      <View className='flex gap-5 mt-5'>
        <ProfitTrendCard />
        <ProfitByPropertyCard />
      </View>

      {/* Upcoming Payment Due Date */}
      <View className='flex gap-5 mt-5'>
        <Text className='text-text text-lg font-poppinsMedium'>Upcoming Rent Due</Text>
        <View className='flex gap-3'>
          {upcomingRentDue.map((rent) => (
            <RentDueCard
              key={rent.id}
              {...rent}
              onPress={() => console.log("Rent due card pressed:", rent.id)}
            />
          ))}
        </View>
      </View>
    </ScreenWrapper>
  )
}