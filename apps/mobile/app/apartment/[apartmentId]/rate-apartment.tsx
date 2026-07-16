import { View, Text, TouchableOpacity, type GestureResponderEvent } from 'react-native'
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import UploadImageField from 'components/inputs/UploadImageField'
import DateField from 'components/inputs/DateField'

import { DEFAULT_IMAGES } from 'constants/images'

import { useColors } from 'hooks/useTheme';
import DetailField from '@/components/display/DetailField';
import {
  IconStar,
  IconStarHalfFilled,
  IconStarFilled,
} from '@tabler/icons-react-native';
import { Button, Label, Separator, TextArea, TextField } from 'heroui-native';

const STAR_SIZE = 45;

export default function RateApartment() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const { colors } = useColors();

  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);

  const [reviewText, setReviewText] = useState<string>('');
  const [rating, setRating] = useState<number>(0); // supports .5 increments

  const [reviewImages, setReviewImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

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

  // Tapping the left half of a star sets a half value (e.g. 3.5),
  // tapping the right half sets the full value (e.g. 4)
  const handleStarPress = (starIndex: number, event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    const isHalf = locationX < STAR_SIZE / 2;
    setRating(isHalf ? starIndex - 0.5 : starIndex);
  };

  // Render Stars for Rating
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFull = rating >= i;
      const isHalf = !isFull && rating >= i - 0.5;

      let StarIcon = IconStar;
      if (isFull) StarIcon = IconStarFilled;
      else if (isHalf) StarIcon = IconStarHalfFilled;

      stars.push(
        <TouchableOpacity
          key={i}
          onPress={(e) => handleStarPress(i, e)}
          activeOpacity={0.7}
        >
          <StarIcon
            size={STAR_SIZE}
            color={isFull || isHalf ? colors.secondary : colors.gray300}
          />
        </TouchableOpacity>
      );
    }

    return stars;
  };

  const handleAddImages = (
    newImages: ImagePicker.ImagePickerAsset | ImagePicker.ImagePickerAsset[]
  ) => {
    const incoming = Array.isArray(newImages) ? newImages : [newImages];
    setReviewImages((prev) => [...prev, ...incoming].slice(0, 5));
  };

  const handleRemoveImage = (uri: string) => {
    setReviewImages((prev) => prev.filter((img) => img.uri !== uri));
  };

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title="Rate Apartment" />
      }
      className='p-5'
    >
      {/* Apartment Thumbnail */}
      <View className='w-full h-52 rounded-3xl overflow-hidden'>
        <Image
          source={apartment.thumbnailUrl}
          style={{ width: '100%', height: '100%' }}
          contentFit='cover'
          cachePolicy='disk'
        />
      </View>

      {/* Main Content */}
      <View className='flex mt-3 gap-3'>
        {/* Apartment Name and Address */}
        <View className='flex gap-1'>
          <Text className='text-xl font-interSemiBold text-accent'>
            {apartment.name}
          </Text>

          <Text className='text-foreground text-base font-interMedium'>
            {apartment.address}
          </Text>
        </View>

        {/* Rental Owner */}
        <DetailField
          label='Landlord'
          value={apartment.landlordName}
        />

        {/* Type and Ratings */}
        <View className='flex-row justify-between items-center'>
          <DetailField
            label='Apartment Type'
            value={apartment.apartmentType}
          />

          <View className='flex-row gap-2'>
            <IconStarFilled
              size={22}
              color={colors.secondary}
            />
            <Text className='text-foreground text-base font-interMedium'>
              {apartment.ratings} ({apartment.noRatings})
            </Text>
          </View>
        </View>

        <Separator className='my-4' />

        {/* Rating Input */}
        <View className='flex items-center'>
          <Text className='text-foreground text-lg font-interMedium'>
            Overall Rating
          </Text>

          {/* Current Rating Label */}
          <Text className='text-secondary text-5xl font-nunitoBold mt-2 leading-tight'>
            {rating.toFixed(1)}
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
        <TextField isRequired>
          <Label>Tenant Review:</Label>
          <TextArea
            placeholder="Type your experience and review about the apartment.."
            value={reviewText}
            onChangeText={setReviewText}
            multiline
            numberOfLines={4}
            className='p-3'
          />
        </TextField>

        {/* Review Photos */}
        <UploadImageField
          label="Photos (optional)"
          images={reviewImages}
          onAdd={handleAddImages}
          onRemove={handleRemoveImage}
          maxImages={5}
        />

        <Separator className='my-4' />

        {/* Duration of Stay */}
        <View>
          <Text className='text-foreground text-base font-interMedium'>
            Duration of Stay:
          </Text>

          <View className='flex-row gap-3 mt-3'>
            <View className='flex-1'>
              <DateField
                label="From"
                placeholder="Select date"
                value={fromDate}
                onChange={setFromDate}
              />
            </View>

            <View className='flex-1'>
              <DateField
                label="To"
                placeholder="Select date"
                value={toDate}
                onChange={setToDate}
              />
            </View>
          </View>
        </View>

        <Button className='mt-5'>
          <Button.Label>
            Submit Review
          </Button.Label>
        </Button>
      </View>
    </ScreenWrapper>
  )
}
