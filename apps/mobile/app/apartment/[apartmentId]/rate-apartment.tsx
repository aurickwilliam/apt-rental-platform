import { View, Text, TouchableOpacity, type GestureResponderEvent } from 'react-native'
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState, useEffect } from 'react'
import * as ImagePicker from 'expo-image-picker'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import UploadImageField from 'components/inputs/UploadImageField'
import DetailField from '@/components/display/DetailField';
import ErrorDialog from 'components/display/ErrorDialog';
import RateApartmentSkeleton from './components/RateApartmentSkeleton';

import { useColors } from 'hooks/useTheme';
import { useSubmitReview } from '@/hooks/ratings';
import { useApartmentDetails } from '@/hooks/apartments';

import { supabase } from '@repo/supabase';
import { formatDate } from '@repo/utils';

import {
  IconStar,
  IconStarHalfFilled,
  IconStarFilled,
  IconPhotoOff,
} from '@tabler/icons-react-native';

import {
  Button,
  FieldError,
  Label,
  Separator,
  TextArea,
  TextField
} from 'heroui-native';

const STAR_SIZE = 45;

type FormErrors = {
  rating?: string;
  reviewText?: string;
};

type TenancyLeasePeriod = {
  lease_start: string;
  lease_end: string | null;
};

type ErrorDialogState = {
  visible: boolean;
  title?: string;
  message: string | null;
  navigateOnClose: boolean;
};

export default function RateApartment() {
  const { apartmentId, tenancyId } = useLocalSearchParams<{
    apartmentId: string;
    tenancyId: string;
  }>();
  const { colors } = useColors();
  const router = useRouter();

  const { submitReview, isSubmitting } = useSubmitReview();

  const {
    apartment,
    loading: apartmentLoading,
    error: apartmentError,
  } = useApartmentDetails(apartmentId);

  const [reviewText, setReviewText] = useState<string>('');
  const [rating, setRating] = useState<number>(0); // supports .5 increments

  const [reviewImages, setReviewImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const [errors, setErrors] = useState<FormErrors>({});

  const [errorDialog, setErrorDialog] = useState<ErrorDialogState>({
    visible: false,
    message: null,
    navigateOnClose: false,
  });

  // Lease period, sourced from the tenancy record rather than manual input
  const [tenancy, setTenancy] = useState<TenancyLeasePeriod | null>(null);
  const [tenancyLoading, setTenancyLoading] = useState(true);
  const [tenancyError, setTenancyError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenancyId) {
      setTenancyLoading(false);
      setTenancyError('Missing tenancy reference');
      return;
    }

    let isMounted = true;

    const fetchTenancy = async () => {
      setTenancyLoading(true);
      setTenancyError(null);

      const { data, error } = await supabase
        .from('tenancies')
        .select('lease_start, lease_end')
        .eq('id', tenancyId)
        .single();

      if (!isMounted) return;

      if (error || !data) {
        setTenancyError('Unable to load stay duration');
      } else {
        setTenancy(data);
      }
      setTenancyLoading(false);
    };

    fetchTenancy();

    return () => {
      isMounted = false;
    };
  }, [tenancyId]);

  // Surface a hard apartment-fetch failure — nothing to review if this didn't load
  useEffect(() => {
    if (apartmentError) {
      setErrorDialog({
        visible: true,
        title: 'Unable to load apartment',
        message: 'We couldn\u2019t load this apartment\u2019s details. Please try again.',
        navigateOnClose: true,
      });
    }
  }, [apartmentError]);

  const stayDurationLabel = tenancyLoading
    ? 'Loading...'
    : tenancyError
      ? tenancyError
      : tenancy
        ? `${formatDate(tenancy.lease_start, 'medium')} - ${tenancy.lease_end ? formatDate(tenancy.lease_end, 'medium') : 'Present'}`
        : '—';

  const isSubmitDisabled = tenancyLoading || !!tenancyError || isSubmitting;

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (rating <= 0) {
      newErrors.rating = 'Please select a rating';
    }

    if (!reviewText.trim()) {
      newErrors.reviewText = 'Please write a review';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitDisabled) return;
    if (!validate()) return;

    const stayedDate = tenancy?.lease_end ?? new Date().toISOString();

    const result = await submitReview({
      tenancyId: tenancyId!,
      rating,
      comment: reviewText,
      stayedDate,
      images: reviewImages,
    });

    if (result.success) {
      router.back();
      return;
    }

    setErrorDialog({
      visible: true,
      title: 'Something went wrong',
      message: result.error ?? 'Failed to submit your review. Please try again.',
      navigateOnClose: false,
    });
  };

  const handleErrorDialogClose = () => {
    const shouldNavigate = errorDialog.navigateOnClose;
    setErrorDialog({ visible: false, message: null, navigateOnClose: false });
    if (shouldNavigate) {
      router.back();
    }
  };

  const handleStarPress = (starIndex: number, event: GestureResponderEvent) => {
    const { locationX } = event.nativeEvent;
    const isHalf = locationX < STAR_SIZE / 2;
    setRating(isHalf ? starIndex - 0.5 : starIndex);
    if (errors.rating) setErrors((prev) => ({ ...prev, rating: undefined }));
  };

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

  const handleReviewTextChange = (text: string) => {
    setReviewText(text);
    if (errors.reviewText) setErrors((prev) => ({ ...prev, reviewText: undefined }));
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

  // Block on the apartment fetch — nothing below is safe to render without it
  if (apartmentLoading || !apartment) {
    return <RateApartmentSkeleton />;
  }

  const coverImage =
    apartment.apartment_images.find((img) => img.is_cover)?.url ??
    apartment.apartment_images[0]?.url ??
    null;

  const landlordName = apartment.landlord
    ? `${apartment.landlord.first_name} ${apartment.landlord.last_name}`.trim()
    : 'Unknown Landlord';

  const address = [apartment.street_address, apartment.barangay, apartment.city]
    .filter(Boolean)
    .join(', ');

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
        {coverImage ? (
          <Image
            source={coverImage}
            style={{ width: '100%', height: '100%' }}
            contentFit='cover'
            cachePolicy='disk'
          />
        ) : (
          <View className='w-full h-full items-center justify-center bg-gray50 border border-dashed border-gray300'>
            <IconPhotoOff size={32} color={colors.gray300} />
            <Text className='text-muted text-sm font-inter mt-2'>
              No photo available
            </Text>
          </View>
        )}
      </View>

      {/* Main Content */}
      <View className='flex mt-3 gap-3'>
        {/* Apartment Name and Address */}
        <View className='flex gap-1'>
          <Text className='text-xl font-interSemiBold text-accent'>
            {apartment.name}
          </Text>

          <Text className='text-foreground text-base font-interMedium'>
            {address}
          </Text>
        </View>

        {/* Rental Owner */}
        <DetailField
          label='Landlord'
          value={landlordName}
        />

        {/* Type and Ratings */}
        <View className='flex-row justify-between items-center'>
          <DetailField
            label='Apartment Type'
            value={apartment.type}
          />

          <View className='flex-row gap-2'>
            <IconStarFilled
              size={22}
              color={colors.secondary}
            />
            <Text className='text-foreground text-base font-interMedium'>
              {(apartment.average_rating ?? 0).toFixed(1)} ({apartment.no_ratings})
            </Text>
          </View>
        </View>

        {/* Duration of Stay — read-only, sourced from tenancy lease dates */}
        <View>
          <Text className='text-muted text-sm font-interMedium'>
            Duration of Stay
          </Text>

          <View className='mt-3 rounded-2xl bg-gray50 flex-row items-center justify-between'>
            <Text className='text-foreground text-base font-interMedium'>
              {stayDurationLabel}
            </Text>

            {tenancy && !tenancy.lease_end && (
              <Text className='text-muted text-xs font-inter'>
                Ongoing
              </Text>
            )}
          </View>
        </View>

        <Separator className='my-4' />

        {/* Rating Input */}
        <View className='flex items-center'>
          <Text className='text-foreground text-lg font-interMedium'>
            Overall Rating
          </Text>

          <Text className='text-secondary text-5xl font-nunitoBold mt-2 leading-tight'>
            {rating.toFixed(1)}
          </Text>

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

          {errors.rating && (
            <Text className='text-red-500 text-xs mt-1'>
              {errors.rating}
            </Text>
          )}
        </View>

        {/* Review Text Box */}
        <TextField isRequired isInvalid={!!errors.reviewText}>
          <Label>Tenant Review:</Label>
          <TextArea
            placeholder="Type your experience and review about the apartment.."
            value={reviewText}
            onChangeText={handleReviewTextChange}
            multiline
            numberOfLines={4}
            className='p-3'
          />
          {errors.reviewText && (
            <FieldError>
              {errors.reviewText}
            </FieldError>
          )}
        </TextField>

        {/* Review Photos */}
        <UploadImageField
          label="Photos (optional)"
          images={reviewImages}
          onAdd={handleAddImages}
          onRemove={handleRemoveImage}
          maxImages={5}
        />

        <Button
          className='mt-15'
          onPress={handleSubmit}
          isDisabled={isSubmitDisabled}
        >
          <Button.Label>
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button.Label>
        </Button>
      </View>

      <ErrorDialog
        isOpen={errorDialog.visible}
        onClose={handleErrorDialogClose}
        title={errorDialog.title}
        message={errorDialog.message}
      />
    </ScreenWrapper>
  )
}
