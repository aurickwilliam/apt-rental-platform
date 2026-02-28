import { View, Text } from 'react-native'
import { useState } from 'react'

import PillButton from '@/components/buttons/PillButton'
import ScreenWrapper from '@/components/layout/ScreenWrapper'
import Divider from '@/components/display/Divider'
import QuickActionButton from '@/components/buttons/QuickActionButton'
import SearchField from '@/components/inputs/SearchField'

import {
  IconChartDonut3,
  IconCirclePlus,
  IconTool,
  IconHome,
  IconFileText,
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'
import PropertyCard from '@/components/display/PropertyCard'

export default function Units() {
  // Status options for filtering properties
  const statusOptions = [
    'All',
    'Occupied',
    'Vacant',
    'Under Maintenance',
  ]

  // Location Options
  const locationOptions = [
    'All',
    'Caloocan',
    'Malabon',
    'Navotas',
    'Valenzuela',
  ]

  // TODO: Implement filtering logic based on selectedStatus and selectedLocation
  // TODO: Refactor the Search Field to appear beside the filter button and implement search functionality
  const [selectedStatus, setSelectedStatus] = useState<string>(statusOptions[0]);
  const [selectedLocation, setSelectedLocation] = useState<string>(locationOptions[0]);

  const [searchQuery, setSearchQuery] = useState('');

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      bottomPadding={50}
    >
      {/* Header */}
      <Text className='text-secondary text-4xl font-dmserif'>
        My Properties
      </Text>

      {/* Property Stats */}
      <View className='flex gap-3 mt-5'>
        <View className='bg-primary p-4 rounded-xl flex gap-2'>
          <Text className='text-white text-base font-poppinsMedium'>
            November Total Profit
          </Text>

          <Text className='text-white text-4xl font-poppinsMedium'>
            ₱ 12,000.00
          </Text>
        </View>

        <View className='flex-row gap-3'>
          <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200 justify-center'>
            <Text className='text-sm text-gray-500 font-interMedium'>
              Total Properties
            </Text>
            <Text className='text-3xl font-interSemiBold'>
              5
            </Text>
          </View>

          <View className='flex-1 bg-white rounded-2xl p-4 gap-1 border border-grey-200 justify-center'>
            <Text className='text-sm text-gray-500 font-interMedium'>
              Units Occupied
            </Text>
            <Text className='text-3xl font-interSemiBold'>
              3
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
        <Text className='text-text text-lg font-poppinsMedium'>
          Property Actions
        </Text>

        <View className='flex-row flex-wrap'>
          <QuickActionButton 
            label={'Add Property'} 
            icon={IconCirclePlus}            
          />

          <QuickActionButton 
            label={'Maintenance Request'} 
            icon={IconTool}            
          />

          <QuickActionButton 
            label={'Visit Request'} 
            icon={IconHome}            
          />

          <QuickActionButton 
            label={'Tenant Applications'} 
            icon={IconFileText}            
          />
        </View>
      </View>

      {/* List of Properties */}
      <View className='mt-5'>
        <Text className='text-primary text-3xl font-dmserif'>
          List of Properties
        </Text>

        {/* Search Field */}
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

        {/* Generate the list */}
        <View className='flex gap-3'>
          <PropertyCard />
          <PropertyCard />
          <PropertyCard />
        </View>
      </View>
    </ScreenWrapper>
  )
}
