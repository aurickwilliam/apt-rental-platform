import { View, Text, } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'

import PillButton from '@/components/buttons/PillButton'
import ScreenWrapper from '@/components/layout/ScreenWrapper'
import Divider from '@/components/display/Divider'
import QuickActionButton from '@/components/buttons/QuickActionButton'
import SearchField from '@/components/inputs/SearchField'
import PropertyCard from '@/components/display/PropertyCard'

import {
  IconChartDonut3,
  IconCirclePlus,
  IconTool,
  IconHome,
  IconFileText,
  IconBuildingOff,
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'

import { supabase } from '@repo/supabase'

import { formatCurrency } from '@repo/utils'

type ApartmentStatus = 'Available' | 'Occupied' | 'Under Maintenance' | 'Unverified'

type Apartment = {
  id: string
  name: string
  barangay: string
  city: string
  status: ApartmentStatus
  coverUrl: string | null
}

function EmptyProperties({ onAdd }: { onAdd: () => void }) {
  return (
    <View className='items-center justify-center py-16 gap-4'>
      <View className='bg-gray-100 rounded-full p-6'>
        <IconBuildingOff size={48} color={COLORS.grey} />
      </View>
      <View className='items-center gap-1'>
        <Text className='text-text text-lg font-poppinsMedium'>
          No properties yet
        </Text>
        <Text className='text-gray-400 text-sm font-inter text-center px-8'>
          Add your first property to start managing your rentals.
        </Text>
      </View>
      <PillButton
        label='Add Property'
        leftIconName={IconCirclePlus}
        onPress={onAdd}
      />
    </View>
  )
}

function SkeletonCard() {
  return (
    <View className='bg-white rounded-2xl p-4 flex-row gap-3 border border-gray-100'>
      <View className='w-20 h-20 rounded-xl bg-gray-200' />
      <View className='flex-1 gap-2 justify-center'>
        <View className='h-4 bg-gray-200 rounded-full w-3/4' />
        <View className='h-3 bg-gray-100 rounded-full w-1/2' />
        <View className='h-3 bg-gray-100 rounded-full w-1/3' />
      </View>
    </View>
  )
}

export default function Units() {
  const router = useRouter()

  const [apartments, setApartments] = useState<Apartment[]>([])
  const [filteredApartments, setFilteredApartments] = useState<Apartment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const statusOptions = ['All', 'Occupied', 'Available', 'Under Maintenance', 'Unverified']
  const locationOptions = ['All', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela']

  const [selectedStatus, setSelectedStatus] = useState<string>(statusOptions[0])
  const [selectedLocation, setSelectedLocation] = useState<string>(locationOptions[0])

  const [monthlyProfit, setMonthlyProfit] = useState<number | null>(null)

  // Current Month Label (e.g. "November 2024")
  const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  const fetchMonthlyProfit = async (landlordId: string): Promise<void> => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split('T')[0]

      // Get all apartment IDs that belong to this landlord
      const { data: aptData, error: aptError } = await supabase
        .from('apartments')
        .select('id')
        .eq('landlord_id', landlordId)
        .is('deleted_at', null)

      if (aptError) throw aptError

      const apartmentIds = (aptData ?? []).map((a) => a.id)
      if (apartmentIds.length === 0) {
        setMonthlyProfit(0)
        return
      }

      const { data: payments, error: payError } = await supabase
        .from('payment')
        .select('amount')
        .in('apartment_id', apartmentIds)
        .eq('status', 'paid')
        .gte('date', startOfMonth)
        .lte('date', endOfMonth)

      if (payError) throw payError

      const total = (payments ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0)
      setMonthlyProfit(total)
    } catch (err) {
      console.error('Error fetching monthly profit:', err)
      setMonthlyProfit(null)
    }
  }

  const fetchApartments = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (userError || !userData) throw userError

      const [apartmentsResult] = await Promise.all([
      supabase
        .from('apartments')
        .select(`id, name, barangay, city, status, apartment_images (url, is_cover)`)
        .eq('landlord_id', userData.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),

      fetchMonthlyProfit(userData.id),
    ])

      if (apartmentsResult.error) throw apartmentsResult.error

      const mapped: Apartment[] = (apartmentsResult.data ?? []).map((apt) => {
        const images = apt.apartment_images ?? []
        const cover = images.find((img) => img.is_cover) ?? images[0] ?? null

        const validStatuses: ApartmentStatus[] = ['Available', 'Occupied', 'Under Maintenance', 'Unverified']
        const status = validStatuses.includes(apt.status as ApartmentStatus)
          ? (apt.status as ApartmentStatus)
          : 'Unverified'

        return {
          id: apt.id,
          name: apt.name,
          barangay: apt.barangay,
          city: apt.city,
          status,
          coverUrl: cover?.url ?? null,
        }
      })

      setApartments(mapped)
      setFilteredApartments(mapped)
    } catch (err) {
      console.error('Error fetching apartments:', err)
    } finally {
      setLoading(false)
    }
  }, []);

  // Re-fetch whenever tab is focused (e.g. after adding a new apartment)
  useFocusEffect(
    useCallback(() => {
      fetchApartments()
    }, [fetchApartments])
  )

  useEffect(() => {
    let result = apartments

    if (selectedStatus !== 'All') {
      result = result.filter((a) => a.status === selectedStatus)
    }

    if (selectedLocation !== 'All') {
      result = result.filter((a) => a.city === selectedLocation)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.barangay.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q)
      )
    }

    setFilteredApartments(result)
  }, [searchQuery, selectedStatus, selectedLocation, apartments])

  const totalProperties = apartments.length
  const occupiedCount = apartments.filter((a) => a.status === 'Occupied').length

  const handlePropertyPress = (propertyId: string) => {
    router.push(`/manage-apartment/${propertyId}`)
  }

  return (
    <ScreenWrapper className='p-5' scrollable bottomPadding={50}>
      {/* Header */}
      <Text className='text-secondary text-4xl font-dmserif'>My Properties</Text>

      {/* Property Stats */}
      <View className='flex gap-3 mt-5'>
        <View className='bg-primary p-4 rounded-xl flex gap-2'>
          <Text className='text-white text-base font-poppinsMedium'>
            {currentMonthLabel} Total Profit
          </Text>
          <Text className='text-white text-4xl font-poppinsMedium'>
            {loading
              ? '—'
              : monthlyProfit === null
              ? 'N/A'
              : `₱ ${formatCurrency(monthlyProfit)}`
            }
          </Text>
        </View>

        <View className='flex-row gap-3'>
          <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200 justify-center'>
            <Text className='text-sm text-gray-500 font-interMedium'>Total Properties</Text>
            <Text className='text-3xl font-interSemiBold'>
              {loading ? '—' : totalProperties}
            </Text>
          </View>

          <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200 justify-center'>
            <Text className='text-sm text-gray-500 font-interMedium'>Units Occupied</Text>
            <Text className='text-3xl font-interSemiBold'>
              {loading ? '—' : occupiedCount}
            </Text>
          </View>
        </View>

        <PillButton
          label='Budget Analytics'
          leftIconName={IconChartDonut3}
          onPress={() => {}}
        />
      </View>

      <Divider marginVertical={20} />

      {/* Property Actions */}
      <View className='flex gap-5'>
        <Text className='text-text text-lg font-poppinsMedium'>Property Actions</Text>
        <View className='flex-row flex-wrap'>
          <QuickActionButton
            label={'Add Property'}
            icon={IconCirclePlus}
            onPress={() => router.push('/manage-apartment/add-apartment/')}
          />
          <QuickActionButton label={'Maintenance Request'} icon={IconTool} />
          <QuickActionButton label={'Visit Request'} icon={IconHome} />
          <QuickActionButton label={'Tenant Applications'} icon={IconFileText} />
        </View>
      </View>

      {/* List of Properties */}
      <View className='mt-5'>
        <Text className='text-primary text-3xl font-dmserif'>List of Properties</Text>

        <View className='mt-3'>
          <SearchField
            searchPlaceholder='Search a Property'
            onChangeSearch={(text) => setSearchQuery(text)}
            searchValue={searchQuery}
            backgroundColor={COLORS.darkerWhite}
            showFilterButton
          />
        </View>

        <Divider />

        {loading ? (
          // Skeleton loading state
          <View className='flex gap-3'>
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </View>
        ) : filteredApartments.length === 0 ? (
          // Empty / no results state
          apartments.length === 0 ? (
            <EmptyProperties onAdd={() => router.push('/manage-apartment/add-apartment/')} />
          ) : (
            <View className='items-center py-12 gap-2'>
              <Text className='text-gray-400 font-poppinsMedium'>No properties match your search.</Text>
            </View>
          )
        ) : (
          // Apartment list
          <View className='flex gap-3'>
            {filteredApartments.map((apt) => (
              <PropertyCard
                key={apt.id}
                apartmentName={apt.name}          
                barangay={apt.barangay}       
                city={apt.city}
                status={apt.status}
                thumbnailUrl={apt.coverUrl ?? undefined}
                onPress={() => handlePropertyPress(apt.id)}
              />
            ))}
          </View>
        )}
      </View>
    </ScreenWrapper>
  )
}