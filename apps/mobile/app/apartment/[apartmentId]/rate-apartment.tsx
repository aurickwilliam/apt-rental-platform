import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import Divider from 'components/display/Divider'
import DropdownButton from 'components/buttons/DropdownButton'
import PillButton from 'components/buttons/PillButton'
import TextBox from 'components/inputs/TextBox'

import { YEARS, MONTHS } from '@repo/constants'
import { DEFAULT_IMAGES } from 'constants/images'

import {
  Star
} from 'lucide-react-native'

import { useColors } from 'hooks/useTheme';

export default function RateApartment() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { colors } = useColors();

  type Month = typeof MONTHS[number];

  const [fromMonth, setFromMonth] = useState<Month>('January');
  const [fromYear, setFromYear] = useState<string>('2023');
  const [toMonth, setToMonth] = useState<Month>('January');
  const [toYear, setToYear] = useState<string>('2023');

  const [reviewText, setReviewText] = useState<string>('');
  const [rating, setRating] = useState<number>(0);

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

  // Dummy Data for demonstration purposes
  const apartment = {
    id: apartmentId,
    name: 'Modern Apartment in City Center',
    address: '123 Main St, Metropolis',
    thumbnailUrl: DEFAULT_IMAGES.defaultThumbnail,
    landlordName: 'Alice Johnson',
    apartmentType: '2 Bedroom Apartment',
    ratings: 4.5,
    noRatings: 120,
  }

  // Render Stars for Rating
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => setRating(i)}
          activeOpacity={0.7}
        >
          {
            i <= rating ? (
              <Star
                size={45}
                color={colors.secondary}
              />
            ) : (
              <Star
                size={45}
                color={colors.gray300}
              />
            )
          }
        </TouchableOpacity>
      );
    }

    return stars;
  };

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title="Rate Apartment" />
      }
    >
      {/* Apartment Thumbnail */}
      <View className='w-full h-60'>
        <Image
          source={apartment.thumbnailUrl}
          style={{ width: '100%', height: '100%' }}
        />
      </View>

      {/* Main Content */}
      <View className='p-5'>
        {/* Apartment Name and Address */}
        <View className='flex gap-1'>
          <Text className='text-2xl font-interSemiBold text-accent'>
            {apartment.name}
          </Text>

          <Text className='text-foreground text-base font-interMedium'>
            {apartment.address}
          </Text>
        </View>

        {/* Rental Owner */}
        <View className='flex mt-5'>
          <Text className='text-sm text-muted font-inter'>
            Rental Owner
          </Text>

          <Text className='text-base text-foreground font-inter'>
            {apartment.landlordName}
          </Text>
        </View>

        {/* Type and Ratings */}
        <View className='flex-row items-center justify-between mt-5'>
          <Text className='text-muted text-base font-inter'>
            {apartment.apartmentType}
          </Text>

          <View className='flex-row gap-2'>
            <Star
              size={20}
              color={colors.secondary}
            />
            <Text className='text-foreground text-base font-inter'>
              {apartment.ratings} ({apartment.noRatings} Reviews)
            </Text>
          </View>
        </View>

        <Divider />

        {/* Rating Input */}
        <View className='flex items-center'>
          <Text className='text-foreground text-lg font-interMedium'>
            Overall Rating
          </Text>

          {/* Star Rating Input */}
          <View className='flex-row items-center justify-center gap-3 my-5'>
            {renderStars()}
          </View>

          <View className='flex-row items-center gap-5'>
            <Text className='text-muted text-sm font-inter'>
              1 - Poor
            </Text>

            <Text className='text-muted text-sm font-inter'>
              5 - Excellent
            </Text>
          </View>
        </View>

        {/* Review Text Box */}
        <View className='flex mt-3'>
          <TextBox
            label='Review:'
            placeholder="Type your experience and review about the apartment.."
            value={reviewText}
            onChangeText={setReviewText}
            required
          />
        </View>

        <Divider />

        {/* Duration of Stay */}
        <View>
          <Text className='text-foreground text-base font-interMedium'>
            Duration of Stay:
          </Text>

          <View className='flex gap-1 mt-3'>
            <Text className='text-muted text-base font-inter'>
              From
            </Text>

            <View className='flex-1 flex-row items-center gap-3'>
              <DropdownButton
                bottomSheetLabel={'Select Month'}
                options={monthOptions}
                value={fromMonth}
                onSelect={setFromMonth}
                buttonClassName='w-1/2 flex-row items-center justify-between bg-darkerWhite
                  px-2 py-1 rounded-xl'
              />
              <DropdownButton
                bottomSheetLabel={'Select Year'}
                options={YEARS}
                value={fromYear}
                onSelect={setFromYear}
                buttonClassName='w-1/2 flex-row items-center justify-between bg-darkerWhite
                  px-2 py-1 rounded-xl'
              />
            </View>
          </View>

          <View className='flex gap-1 mt-3'>
            <Text className='text-muted text-base font-inter'>
              To
            </Text>

            <View className='flex-1 flex-row items-center gap-3'>
              <DropdownButton
                bottomSheetLabel={'Select Month'}
                options={monthOptions}
                value={toMonth}
                onSelect={setToMonth}
                buttonClassName='w-1/2 flex-row items-center justify-between bg-darkerWhite
                  px-2 py-1 rounded-xl'
              />
              <DropdownButton
                bottomSheetLabel={'Select Year'}
                options={YEARS}
                value={toYear}
                onSelect={setToYear}
                buttonClassName='w-1/2 flex-row items-center justify-between bg-darkerWhite
                  px-2 py-1 rounded-xl'
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
