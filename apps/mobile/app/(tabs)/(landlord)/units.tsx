import { View, Text, Image} from 'react-native'
import { useState } from 'react'
import { useRouter } from 'expo-router'

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
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'
import { DEFAULT_IMAGES} from "constants/images";

export default function Units() {
  const router = useRouter();

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

  // Dummy data for properties - to be replaced with real data from the backend
  const properties = [
    {
      id: '1',
      apartmentName: 'Sunrise Apartments',
      address: '123 Main St',
      city: 'Caloocan',
      status: 'Occupied',
      thumbnailUrl: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail).uri,
    },
    {
      id: '2',
      apartmentName: 'Greenwood Residences',
      address: '456 Elm St',
      city: 'Malabon',
      status: 'Available',
      thumbnailUrl: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail2).uri,
    },
    {
      id: '3',
      apartmentName: 'Lakeside Villas',
      address: '789 Oak St',
      city: 'Navotas',
      status: 'Under Maintenance',
      thumbnailUrl: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail3).uri,
    },
    {
      id: '4',
      apartmentName: 'Cityview Condos',
      address: '321 Pine St',
      city: 'Valenzuela',
      status: 'Occupied',
      thumbnailUrl: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail4).uri,
    }
  ]

  // Handle the navigation and passing of the selected property to the Property Details screen when a property card is pressed
  const handlePropertyPress = (propertyId: string) => {
    router.push(`/manage-apartment/${propertyId}`);

    console.log(`Navigating to details of property with ID: ${propertyId}`);
  }

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
          {
            properties.map((property) => (
              <PropertyCard
                key={property.id}
                apartmentName={property.apartmentName}
                address={property.address}
                city={property.city}
                status={property.status as 'Available' | 'Occupied' | 'Under Maintenance'}
                thumbnailUrl={property.thumbnailUrl}
                onPress={() => handlePropertyPress(property.id)}
              />
            ))
          }
        </View>
      </View>
    </ScreenWrapper>
  )
}
