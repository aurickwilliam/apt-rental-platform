import {
  View,
  Text
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import IconButton from 'components/buttons/IconButton';
import PillButton from 'components/buttons/PillButton';

import {
  IconChevronLeft,
  IconHeart,
} from "@tabler/icons-react-native";

import {
  ApartmentHeroSection,
  ApartmentDescriptionSection,
  PerksSection,
  MapPreviewSection,
  RatingsSection,
  LandlordSection,
  LeaseAgreementSection,
  MoveInCostFooter,
  ApartmentSkeleton,
  ApartmentDetailsSection,
} from './components';

import { useApartmentDetails } from '@/hooks/useApartmentDetails';

export default function ApartmentScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const router = useRouter();

  const { apartment, reviews, loading, error } = useApartmentDetails(apartmentId);

  const apartmentImages = apartment?.apartment_images.map(img => ({
    id: img.id,
    image: { uri: img.url },
  })) ?? [];

  // Handlers for User Navigation and Actions
  // TODO: Implement this Functions
  const handleFavoriteToggle = () => {
    console.log("Favorite Button Pressed!");
  }

  const handleApplyNow = () => {
    router.push(`/apartment/${apartmentId}/apply/apartment-summary`);
  }

  const handleMessageLandlord = () => {
    console.log("Message Landlord Button Pressed!");
  }

  const handleLandlordProfileNavigation = () => {
    if (apartment?.landlord) {
      router.push(`/landlord-profile/${apartment.landlord.id}`);
    }
  }

  const handleSeeAllRatings = () => {
    router.push(`/apartment/${apartmentId}/ratings`);
  }

  const handleMapViewNavigation = () => {
    router.push(`/apartment/${apartmentId}/map-view`);
  }

  // Loading State
  if (loading) {
    return (
      <ApartmentSkeleton
        onBackPress={() => router.back()}
        onFavoritePress={handleFavoriteToggle}
      />
    );
  }

  // Error State
  if (error && !apartment) {
    return (
      <View className='flex-1 bg-white items-center justify-center px-8'>
        <Text className='text-text font-poppinsSemiBold text-lg text-center'>
          Unable to load apartment details
        </Text>
        <Text className='text-grey-500 font-inter text-center mt-2'>
          Please try again in a moment.
        </Text>
        <View className='mt-6'>
          <PillButton
            label='Go Back'
            size='sm'
            onPress={() => router.back()}
          />
        </View>
      </View>
    );
  }

  return (
    <View className='flex-1'>
      <ScreenWrapper
        scrollable
        bottomPadding={100}
        noTopPadding
      >
        <ApartmentHeroSection
          apartment={apartment}
          images={apartmentImages}
        />

        <ApartmentDetailsSection 
          apartment={apartment}
        />

        <ApartmentDescriptionSection 
          description={apartment?.description} 
        />

        <PerksSection 
          amenities={apartment?.amenities}
        />

        <MapPreviewSection
          apartmentName={apartment?.name}
          latitude={apartment?.latitude}
          longitude={apartment?.longitude}
          onOpenMap={handleMapViewNavigation}
        />

        <RatingsSection 
          reviews={reviews} 
          onSeeAll={handleSeeAllRatings} 
        />

        <LandlordSection
          landlord={apartment?.landlord ?? null}
          totalRentals={apartment?.no_ratings}
          onPress={handleLandlordProfileNavigation}
          onMessagePress={handleMessageLandlord}
        />

        <LeaseAgreementSection
          apartmentId={apartmentId}
          leaseAgreementUrl={apartment?.lease_agreement_url}
        />

        {/* Spacer */}
        <View className='h-20' />

      </ScreenWrapper>

      <MoveInCostFooter
        monthlyRent={apartment?.monthly_rent ?? 0}
        securityDeposit={apartment?.security_deposit}
        advanceRent={apartment?.advance_rent}
        onApplyNow={handleApplyNow}
      />

      {/* Fixed Icon Buttons */}
      {/* Back Button */}
      <SafeAreaView
        className='absolute left-4 top-5'
        edges={['top']}
      >
        <IconButton
          iconName={IconChevronLeft}
          onPress={() => {
            router.back();
          }}
        />
      </SafeAreaView>

      {/* Favorite Button */}
      <SafeAreaView
        className='absolute right-4 top-5'
        edges={['top']}
      >
        <IconButton
          iconName={IconHeart}
          onPress={handleFavoriteToggle}
        />
      </SafeAreaView>

    </View>
  )
}
