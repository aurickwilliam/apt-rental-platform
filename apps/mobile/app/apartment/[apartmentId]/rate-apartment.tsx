import { View, Text, Image } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import Divider from 'components/display/Divider'
import DropdownButton from 'components/buttons/DropdownButton'

import { COLORS } from '../../../constants/colors'
import { IMAGES } from '../../../constants/images'

import {
  IconStarFilled,
} from '@tabler/icons-react-native';
import PillButton from 'components/buttons/PillButton'


export default function RateApartment() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  type Month = 'January' | 'February' | 'March' | 'April' | 'May' | 'June' | 'July' | 'August' | 'September' | 'October' | 'November' | 'December';

  const [fromMonth, setFromMonth] = useState<Month>('January');
  const [fromYear, setFromYear] = useState<string>('2023');
  const [toMonth, setToMonth] = useState<Month>('January');
  const [toYear, setToYear] = useState<string>('2023');

  const monthOptions: Month[] = [
    'January', 
    'February', 
    'March', 
    'April', 
    'May',
    'June', 
    'July', 
    'August', 
    'September', 
    'October', 
    'November', 
    'December'
  ];
  
  const yearOptions: string[] = [
    '2015',
    '2018',
    '2019',
    '2020', 
    '2021',
    '2022', 
    '2023', 
    '2024', 
    '2025',
    '2026',
  ];

  // Dummy Data for demonstration purposes
  const apartment = {
    id: apartmentId,
    name: 'Modern Apartment in City Center',
    address: '123 Main St, Metropolis',
    thumbnailUrl: IMAGES.defaultThumbnail,
    landlordName: 'Alice Johnson',
    apartmentType: '2 Bedroom Apartment',
    ratings: 4.5,
    noRatings: 120,
  }

  return (
    <ScreenWrapper
      scrollable
      hasInput
      header={
        <StandardHeader title="Rate Apartment" />
      }
      headerBackgroundColor={COLORS.primary}
    >
      {/* Apartment Thumbnail */}
      <View className='w-full h-[15rem]'>
        <Image 
          source={apartment.thumbnailUrl}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      {/* Main Content */}
      <View className='p-5'>
        {/* Apartment Name and Address */}
        <View className='flex gap-1'>
          <Text className='text-2xl font-interSemiBold text-primary'>
            {apartment.name}
          </Text>

          <Text className='text-text text-base font-interMedium'>
            {apartment.address}
          </Text>
        </View>

        {/* Rental Owner */}
        <View className='flex mt-5'>
          <Text className='text-sm text-grey-500 font-inter'>
            Rental Owner
          </Text>

          <Text className='text-base text-text font-inter'>
            {apartment.landlordName}
          </Text>
        </View>

        {/* Type and Ratings */}
        <View className='flex-row items-center justify-between mt-5'>
          <Text className='text-text text-base font-inter'>
            {apartment.apartmentType}
          </Text>

          <View className='flex-row gap-2'>
            <IconStarFilled 
              size={20}
              color={COLORS.secondary}
            />
            <Text className='text-text text-base font-inter'>
              {apartment.ratings} ({apartment.noRatings} Reviews)
            </Text>
          </View>
        </View>

        <Divider />

        {/* Rating Input */}
        <View className='flex items-center'>
          <Text className='text-text text-lg font-interMedium'>
            Overall Rating
          </Text>

          {/* Star Rating Input */}
          <View className='bg-amber-200 h-20'>
            <Text>Star Rating Input Component Here</Text>
          </View>

          <View className='flex-row items-center gap-5'>
            <Text className='text-grey-500 text-sm font-inter'>
              1 - Poor
            </Text>

            <Text className='text-grey-500 text-sm font-inter'>
              5 - Excellent
            </Text>
          </View>
        </View>

        {/* Review Text Box */}
        <View className='flex gap-1 mt-3'>
          <Text className='text-text text-lg font-interMedium mt-5'>
            Review Box to be implemented Here
          </Text>
        </View>

        <Divider />      
        
        {/* Duration of Stay */}
        <View>
          <Text className='text-text text-base font-interMedium mt-5'>
            Duration of Stay:
          </Text>

          <View className='flex gap-1 mt-3'>
            <Text className='text-grey-500 text-base font-inter'>
              From
            </Text>

            <View className='flex-1 flex-row items-center gap-3'>
              <DropdownButton 
                bottomSheetLabel={'Select Month'} 
                options={monthOptions} 
                value={fromMonth}
                onSelect={setFromMonth}    
                buttonClassName='w-1/2 flex-row items-center justify-between bg-darkerWhite px-2 py-1 rounded-xl'              
              />
              <DropdownButton 
                bottomSheetLabel={'Select Year'} 
                options={yearOptions} 
                value={fromYear}
                onSelect={setFromYear}                  
                buttonClassName='w-1/2 flex-row items-center justify-between bg-darkerWhite px-2 py-1 rounded-xl'              
              />
            </View>
          </View>

          <View className='flex gap-1 mt-3'>
            <Text className='text-grey-500 text-base font-inter'>
              To
            </Text>

            <View className='flex-1 flex-row items-center gap-3'>
              <DropdownButton 
                bottomSheetLabel={'Select Month'} 
                options={monthOptions} 
                value={toMonth}
                onSelect={setToMonth}    
                buttonClassName='w-1/2 flex-row items-center justify-between bg-darkerWhite px-2 py-1 rounded-xl'              
              />
              <DropdownButton 
                bottomSheetLabel={'Select Year'} 
                options={yearOptions} 
                value={toYear}
                onSelect={setToYear}                  
                buttonClassName='w-1/2 flex-row items-center justify-between bg-darkerWhite px-2 py-1 rounded-xl'              
              />
            </View>
          </View>
        </View>

        <View className='mt-20'>
          <PillButton 
            label='Submit Review'          
            onPress={() => {
              console.log('Submit Review Pressed');
            }}
          />
        </View>

      </View>
    </ScreenWrapper>
  )
}