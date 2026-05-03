import {
  View,
  Text,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity,
  Modal,
  Linking,
  Platform,
  StyleProp,
  ViewStyle,
  Alert
} from 'react-native'
import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ImageViewing from 'react-native-image-viewing';
import { MapView, Camera, ShapeSource, CircleLayer, setAccessToken } from '@maplibre/maplibre-react-native';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import IconButton from 'components/buttons/IconButton';
import PillButton from 'components/buttons/PillButton';
import SmallRatingCard from 'components/cards/SmallRatingCard';
import LandlordCard from 'components/cards/LandlordCard';
import PerkItem from 'components/display/PerkItem';

import { COLORS } from '@repo/constants';
import { supabase } from '@repo/supabase';

import {
  IconMapPin,
  IconHome2,
  IconStarFilled,
  IconBed,
  IconBath,
  IconMaximize,
  IconChevronLeft,
  IconHeart,
  IconBuildingCommunity,
  IconSquareCheck,
  IconMap,
  IconStar,
  IconUser,
  IconFileDescription,
  IconUsers,
  IconBuildingSkyscraper,
  IconCalendar,
  IconX,
} from "@tabler/icons-react-native";

import { formatCurrency } from '@repo/utils';

import { useApartmentDetails } from '@/hooks/useApartmentDetails';

// Suppress the missing API key warning since we're using free OSM tiles
setAccessToken(null); 

const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
}

const DEFAULT_COORDS = {
  latitude: 14.6700,
  longitude: 120.9600,
}

type DirectionMode = 'driving' | 'walking' | 'transit' | 'motorcycle';

export default function ApartmentScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const router = useRouter();

  const { width } = Dimensions.get('window');

  const [isReadMore, setIsReadMore] = useState<boolean>(false);
  const [isImageViewVisible, setIsImageViewVisible] = useState<boolean>(false);
  const [isDirectionsModalVisible, setIsDirectionsModalVisible] = useState<boolean>(false);
  const [isMoveInCostModalVisible, setIsMoveInCostModalVisible] = useState<boolean>(false);
  const [imageIndex, setImageIndex] = useState<number>(0);
  const skeletonOpacity = useRef(new Animated.Value(0.45)).current;

  const { apartment, reviews, loading, error } = useApartmentDetails(apartmentId);

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonOpacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonOpacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [skeletonOpacity]);

  // Refs for ScrollView
  const imageScrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const apartmentImages = apartment?.apartment_images.map(img => ({
    id: img.id,
    image: { uri: img.url },
  })) ?? [];

  const location = apartment
    ? `${apartment.street_address}, Brgy. ${apartment.barangay}, ${apartment.city}`
    : '';

  const hasPerks = (apartment?.amenities?.length ?? 0) > 0;
  const hasReviews = reviews?.length > 0;
  const hasApartmentCoords = apartment?.latitude != null && apartment?.longitude != null;

  const toggleReadMoreDescription = () => {
    setIsReadMore(!isReadMore);
  }

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

  const openDirections = async (mode: DirectionMode) => {
    const latitude = apartment?.latitude;
    const longitude = apartment?.longitude;

    if (latitude == null || longitude == null) {
      handleMapViewNavigation();
      return;
    }

    const label = encodeURIComponent(apartment?.name || 'Apartment');
    const destination = `${latitude},${longitude}`;

    const googleMapsTravelMode =
      mode === 'walking'    ? 'walking'    :
      mode === 'transit'    ? 'transit'    :
      mode === 'motorcycle' ? 'two-wheeler':
      'driving'; // driving

    const googleMapsWebUrl =
      `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=${googleMapsTravelMode}`;

    // Apple Maps — no motorcycle or two-wheeler mode, fall back to Google Maps web
    const iosDirFlag =
      mode === 'walking' ? 'w' :
      mode === 'transit' ? 'r' :
      'd'; // driving (also used as closest for motorcycle)

    const iosUrl =
      mode === 'motorcycle'
        ? googleMapsWebUrl // Apple Maps has no motorcycle mode
        : `http://maps.apple.com/?daddr=${destination}&dirflg=${iosDirFlag}&q=${label}`;

    // Android navigation intent — no motorcycle mode, fall back to Google Maps web
    const androidNavMode =
      mode === 'walking' ? 'w' :
      'd'; // driving

    const androidUrl =
      mode === 'transit' || mode === 'motorcycle'
        ? googleMapsWebUrl // No transit/motorcycle in navigation intent
        : `google.navigation:q=${destination}&mode=${androidNavMode}`;

    const url = Platform.select({
      ios: iosUrl,
      android: androidUrl,
      default: googleMapsWebUrl,
    });

    if (!url) return;

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return;
    }

    await Linking.openURL(googleMapsWebUrl);
  };

  const handleGetDirections = () => {
    setIsDirectionsModalVisible(true);
  }

  const handleSelectDirectionMode = (mode: DirectionMode) => {
    setIsDirectionsModalVisible(false);
    openDirections(mode);
  }

  const handleLeaseAgreementNavigation = async () => {
    if (!apartment?.lease_agreement_url) {
      Alert.alert('Not Found', 'This apartment does not have a lease agreement uploaded.');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('lease-agreements')
        .createSignedUrl(apartment.lease_agreement_url, 3600);

      if (error || !data?.signedUrl) throw error;

      router.push({
        pathname: '/apartment/[apartmentId]/view-lease',
        params: { apartmentId, fileUrl: data.signedUrl },
      });
    } catch (err) {
      Alert.alert('Error', 'Could not open lease agreement.');
      console.error(err);
    }
  }

  const handleViewFullImage = (index: number) => {
    setImageIndex(index);
    setIsImageViewVisible(true);
  }

  const SkeletonBlock = ({
    className,
    style,
  }: {
    className?: string;
    style?: StyleProp<ViewStyle>;
  }) => (
    <Animated.View
      className={`bg-grey-200 rounded-xl ${className ?? ''}`}
      style={[{ opacity: skeletonOpacity }, style]}
    />
  );

  if (loading) {
    return (
      <View className='flex-1'>
        <ScreenWrapper
          scrollable
          bottomPadding={100}
          noTopPadding
        >
          <View className='h-[42rem] bg-darkerWhite p-5 justify-end'>
            <View className='gap-3'>
              <SkeletonBlock className='h-8 w-3/4' />
              <SkeletonBlock className='h-5 w-11/12' />
              <SkeletonBlock className='h-5 w-40 mt-2' />

              <View className='flex-row mt-3 gap-3'>
                <SkeletonBlock className='h-5 flex-1' />
                <SkeletonBlock className='h-5 flex-1' />
                <SkeletonBlock className='h-5 flex-1' />
              </View>

              <View className='flex-row mt-3 gap-3'>
                <SkeletonBlock className='h-5 flex-1' />
                <SkeletonBlock className='h-5 flex-1' />
              </View>
            </View>
          </View>

          <View className='px-5 mt-6 gap-4'>
            <SkeletonBlock className='h-6 w-2/3' />
            <View className='p-4 bg-darkerWhite rounded-2xl gap-2'>
              <SkeletonBlock className='h-4 w-full' />
              <SkeletonBlock className='h-4 w-full' />
              <SkeletonBlock className='h-4 w-5/6' />
              <SkeletonBlock className='h-9 w-32 mt-3' />
            </View>

            <SkeletonBlock className='h-6 w-1/2 mt-2' />
            <View className='flex-row flex-wrap'>
              <View className='w-1/2 pr-2 mb-3'>
                <SkeletonBlock className='h-10 w-full' />
              </View>
              <View className='w-1/2 pl-2 mb-3'>
                <SkeletonBlock className='h-10 w-full' />
              </View>
              <View className='w-1/2 pr-2 mb-3'>
                <SkeletonBlock className='h-10 w-full' />
              </View>
              <View className='w-1/2 pl-2 mb-3'>
                <SkeletonBlock className='h-10 w-full' />
              </View>
            </View>

            <SkeletonBlock className='h-56 w-full rounded-2xl mt-2' />

            <SkeletonBlock className='h-6 w-1/3 mt-2' />
            <SkeletonBlock className='h-24 w-full rounded-2xl' />
            <SkeletonBlock className='h-24 w-full rounded-2xl' />

            <SkeletonBlock className='h-6 w-1/2 mt-2' />
            <SkeletonBlock className='h-28 w-full rounded-2xl' />

            <SkeletonBlock className='h-6 w-1/2 mt-2' />
            <SkeletonBlock className='h-10 w-52' />
          </View>

          <View className='h-20' />
        </ScreenWrapper>

        <View className='absolute bottom-0 left-0 right-0 bg-white z-10 px-5 py-4 border-t border-grey-200'>
          <SafeAreaView
            className='flex items-start justify-between gap-3'
            edges={['bottom']}
          >
            <View className='flex-1 flex-row gap-5 items-center w-full'>
              <SkeletonBlock className='h-9 w-36' />
              <View className='flex-1'>
                <SkeletonBlock className='h-11 w-full rounded-full' />
              </View>
            </View>
          </SafeAreaView>
        </View>

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
    );
  }

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
        <View className='h-[42rem] bg-white relative'>
          {/* Image Carousel */}
          <ScrollView
            ref={imageScrollViewRef}
            horizontal
            pagingEnabled
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsHorizontalScrollIndicator={false}
          >
            {/* Render Individual Images */}
            {
              apartmentImages.map((item, index) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  className='w-screen h-full'
                  key={item.id}
                  onPress={() => handleViewFullImage(index)}
                >
                  <Image
                    source={item.image}
                    style={{height: '100%', width:  '100%'}}
                  />
                </TouchableOpacity>
              ))
            }
          </ScrollView>

          {/* Text Details on top of the Carousel*/}
          {/* Linear Gradient Overlay*/}
          <LinearGradient
            colors={['transparent', '#000000']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              justifyContent: 'flex-end',
              padding: 20,
            }}
            pointerEvents='none'
          >

            {/* Apartment Details*/}
            <View>
              <Text className='text-white font-poppinsSemiBold text-2xl'>
                {apartment?.name || 'Unnamed Apartment'}
              </Text>

              <View className='flex-row items-center mt-2 gap-2'>
                <IconMapPin size={24} color={COLORS.lightLightLightGrey} />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {location || 'No location provided'}
                </Text>
              </View>

              <View className='flex-row items-center mt-5 gap-2'>
                <IconStarFilled size={20} color={COLORS.secondary} />
                <Text className='text-grey-100 font-interMedium text-base'>
                  No ratings yet
                </Text>
              </View>

              <View className='flex-row items-center justify-between mt-5 gap-6'>
                <View className='flex-row items-center gap-2'>
                  <IconBed size={24} color={COLORS.lightLightLightGrey} />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartment?.no_bedrooms} {apartment?.no_bedrooms === 1 ? 'Bed' : 'Beds'}
                  </Text>
                </View>

                <View className='flex-row items-center gap-2'>
                  <IconBath size={24} color={COLORS.lightLightLightGrey} />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartment?.no_bathrooms} {apartment?.no_bathrooms === 1 ? 'Bath' : 'Baths'}
                  </Text>
                </View>

                <View className='flex-row items-center gap-2'>
                  <IconMaximize size={24} color={COLORS.lightLightLightGrey} />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartment?.area_sqm ? `${apartment?.area_sqm} Sqm` : 'N/A'}
                  </Text>
                </View>
              </View>

              <View className='flex-row mt-4 gap-6'>
                <View className='flex-1 flex-row items-center gap-2'>
                  <IconUsers size={24} color={COLORS.lightLightLightGrey} />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    Max {apartment?.max_occupants} {apartment?.max_occupants === 1 ? 'Occupant' : 'Occupants'}
                  </Text>
                </View>

                <View className='flex-1 flex-row items-center gap-2'>
                  <IconBuildingSkyscraper size={24} color={COLORS.lightLightLightGrey} />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartment?.floor_level ? `Floor ${apartment?.floor_level}` : 'N/A'}
                  </Text>
                </View>
              </View>

              <View className='flex-row mt-4 mb-5 gap-6'>
                <View className='flex-1 flex-row items-center gap-2'>
                  <IconHome2 size={24} color={COLORS.lightLightLightGrey} />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartment?.type || 'N/A'}
                  </Text>
                </View>

                <View className='flex-1 flex-row items-center gap-2'>
                  <IconCalendar size={24} color={COLORS.lightLightLightGrey} />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartment?.lease_duration || 'N/A'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Pagination Dots */}
            <View className='flex-row justify-center items-center'>
              {apartmentImages.map((_, index) => {
                const inputRange = [
                  (index - 1) * width,
                  index * width,
                  (index + 1) * width,
                ];

                const dotWidth = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 24, 8],
                  extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.3, 1, 0.3],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={index}
                    className='h-2 bg-darkerWhite rounded mx-1'
                    style={[
                      {
                        width: dotWidth,
                        opacity,
                      },
                    ]}
                  />
                );
              })}
            </View>
          </LinearGradient>
        </View>

        {/* Apartment Description */}
        <View className='mt-5 px-5 flex-row items-center gap-2'>
          <IconBuildingCommunity
            size={26}
            color={COLORS.text}
          />
          <Text className='font-poppinsSemiBold text-xl text-text'>
            Everything About Your Apartment
          </Text>
        </View>

        <View className='mt-3 mx-5 p-4 bg-darkerWhite rounded-2xl'>
          <Text numberOfLines={isReadMore ? undefined : 10}>
            {apartment?.description}
          </Text>

          {
            apartment?.description && apartment.description.split(' ').length > 50 && (
              <View className='mt-5'>
                <PillButton
                  label={isReadMore ? 'Read Less' : 'Read More'}
                  type='outline'
                  size='sm'
                  onPress={toggleReadMoreDescription}
                />
              </View>
            )
          }
        </View>

        {/* Included Perks */}
        <View className='mt-10 px-5 flex gap-2'>
          <View className='flex-row items-center justify-between'>
            {/* Title */}
            <View className='flex-row items-center gap-2'>
              <IconSquareCheck
                size={26}
                color={COLORS.text}
              />
              <Text className='font-poppinsSemiBold text-xl text-text'>
                Included Perks
              </Text>
            </View>

            {/* See All Button */}
            {/* <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleIncludedPerksNavigation}
            >
              <Text className='font-interMedium text-base text-primary'>
                See All
              </Text>
            </TouchableOpacity> */}
          </View>

          <Text>
            These are already included in your rent.
          </Text>
        </View>

        {/* List of Perks */}
        <View className='flex-row flex-wrap px-5 mt-5'>
          {hasPerks ? (
            apartment?.amenities.map((amenity, index) => (
              <View key={index} className='w-1/2 mb-4'>
                <PerkItem perkId={amenity} />
              </View>
            ))
          ) : (
            <View className='w-full items-center py-6'>
              <Text className='text-grey-500 font-interMedium text-base'>
                No perks included for this apartment.
              </Text>
            </View>
          )}
        </View>

        {/* Map View */}
        <View className='flex-row items-center gap-2 mt-10 px-5'>
          <IconMap
            size={26}
            color={COLORS.text}
          />
          <Text className='font-poppinsSemiBold text-xl text-text'>
            View on Map
          </Text>
        </View>

        {/* Map */}
        <TouchableOpacity
          activeOpacity={0.7}
          className='h-56 mx-5 mt-3 rounded-2xl overflow-hidden'
          onPress={handleMapViewNavigation}
        >
          <View style={{ flex: 1 }} pointerEvents='none'>
            <MapView
              style={{ flex: 1 }}
              mapStyle={MAP_STYLE}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
            >
              <Camera
                centerCoordinate={[
                  apartment?.longitude ?? DEFAULT_COORDS.longitude,
                  apartment?.latitude ?? DEFAULT_COORDS.latitude,
                ]}
                zoomLevel={15}
                animationDuration={0}
                maxZoomLevel={19}
              />

              {hasApartmentCoords && (
                <ShapeSource
                  id='pin-source'
                  shape={{
                    type: 'Feature',
                    geometry: {
                      type: 'Point',
                      coordinates: [
                        apartment.longitude as number,
                        apartment.latitude as number,
                      ],
                    },
                    properties: {},
                  }}
                >
                  <CircleLayer
                    id='pin-ring'
                    style={{
                      circleRadius: 10,
                      circleColor: '#ffffff',
                    }}
                  />
                  <CircleLayer
                    id='pin-dot'
                    style={{
                      circleRadius: 7,
                      circleColor: COLORS.primary,
                    }}
                  />
                </ShapeSource>
              )}
            </MapView>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            className='absolute bottom-4 right-4 bg-white px-4 py-2 rounded-full'
            onPress={(event) => {
              event.stopPropagation();
              handleGetDirections();
            }}
          >
            <Text className='font-interMedium text-base text-primary'>
              Get Directions
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Ratings */}
        <View className='px-5 mt-10 flex-row items-center justify-between'>
          <View className='flex-row items-center gap-2'>
            <IconStar
              size={26}
              color={COLORS.text}
            />
            <Text className='font-poppinsSemiBold text-xl text-text'>
              Ratings
            </Text>
          </View>

          {/* See All Button */}
          {hasReviews && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSeeAllRatings}
            >
              <Text className='font-interMedium text-base text-primary'>
                See All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Render List of Top 2/3 Ratings */}
        <View className='mt-5 px-5 flex gap-3'>
          {hasReviews ? (
            reviews.map(review => (
              <SmallRatingCard
                key={review.id}
                accountName={`${review.tenant?.first_name} ${review.tenant?.last_name}`}
                rating={review.rating}
                comment={review.comment ?? ''}
                date={new Date(review.created_at).toLocaleDateString('en-PH', {
                  year: 'numeric', month: 'long', day: 'numeric'
                })}
              />
            ))
          ) : (
            <View className='items-center py-8 opacity-70'>
              <IconStar size={32} color={COLORS.grey} />
              <Text className='mt-2 text-grey-500 font-interMedium'>
                No ratings yet
              </Text>
            </View>
          )}
        </View>

        {/* Landlord Card */}
        <View className='flex-row items-center gap-2 mt-10 px-5'>
          <IconUser
            size={26}
            color={COLORS.text}
          />
          <Text className='font-poppinsSemiBold text-xl text-text'>
            Meet Your Rental Owner
          </Text>
        </View>

        <View className='px-5 mt-3'>
          <LandlordCard
            fullName={apartment?.landlord?.first_name + ' ' + apartment?.landlord?.last_name}
            email={apartment?.landlord?.email ?? 'N/A'}
            phoneNumber={apartment?.landlord?.mobile_number ?? 'N/A'}
            // withRentalInfo
            // averageRating={apartment?.average_rating}
            totalRentals={apartment?.no_ratings}
            onPress={handleLandlordProfileNavigation}
            onMessagePress={handleMessageLandlord}
          />
        </View>

        {/* Lease Agreement */}
        <View className=' mt-10 px-5 flex gap-2'>
          <View className='flex-row items-center gap-2'>
            <IconFileDescription
              size={26}
              color={COLORS.text}
            />
            <Text className='font-poppinsSemiBold text-xl text-text'>
              Lease Agreement & Rules
            </Text>
          </View>

          <Text className='text-text text-base font-inter'>
            Please review the rental owner’s property rules before applying.
          </Text>

          <PillButton
            label='View Full Lease Agreement'
            type='outline'
            size='sm'
            isDisabled={!apartment?.lease_agreement_url}
            onPress={handleLeaseAgreementNavigation}
          />
        </View>

        {/* Spacer */}
        <View className='h-20' />

      </ScreenWrapper>

      {/* Fixed Footer */}
      <View className='absolute bottom-0 left-0 right-0 bg-white z-10 px-5 py-4 border-t border-grey-200'>
        <SafeAreaView
          className='flex items-start justify-between gap-3'
          edges={['bottom']}
        >
          <View className='flex-1 flex-row gap-4 items-center'>
            <TouchableOpacity 
              activeOpacity={0.7}
              className='flex-col shrink-0'
              onPress={() => setIsMoveInCostModalVisible(true)}
            >
              <View className='flex-row items-baseline'>
                <Text className='text-2xl font-poppinsSemiBold text-primary'>
                  ₱ {formatCurrency(apartment?.monthly_rent ?? 0)}
                </Text>
                <Text className='text-sm font-interMedium text-grey-500 ml-1'>
                  /month
                </Text>
              </View>
              <Text className='text-xs font-inter text-grey-500 mt-1 underline'>
                Move-in cost breakdown
              </Text>
            </TouchableOpacity>

            <View className='flex-1'>
              <PillButton
                label='Apply Now'
                size='md'
                onPress={handleApplyNow}
              />
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Fixed Icon Buttons */}
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

      {/* Image Viewer */}
      <ImageViewing
        key={imageIndex}
        images={apartmentImages.map(img => (img.image))}
        imageIndex={imageIndex}
        visible={isImageViewVisible}
        onRequestClose={() => setIsImageViewVisible(false)}
        FooterComponent={({ imageIndex }) => (
          <View className='p-10 items-center'>
            <Text className='text-white font-interMedium'>
              {imageIndex + 1} / {apartmentImages.length}
            </Text>
          </View>
        )}
        presentationStyle='overFullScreen'
        backgroundColor='rgb(0, 0, 0, 0.9)'
      />

      {/* Get Directions Modal */}
      <Modal
        visible={isDirectionsModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setIsDirectionsModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className='flex-1 bg-black/40 justify-center px-6'
          onPress={() => setIsDirectionsModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className='bg-white rounded-2xl p-5'
            onPress={(event) => event.stopPropagation()}
          >
            <Text className='text-text font-poppinsSemiBold text-lg'>
              Choose Route Type
            </Text>
            <Text className='text-grey-500 font-inter mt-1'>
              Select how you want to get there.
            </Text>

            <View className='mt-4 gap-3'>
              <PillButton
                label='Drive/4-Wheels'
                size='sm'
                onPress={() => handleSelectDirectionMode('driving')}
              />
              <PillButton
                label='Motorcycle'
                size='sm'
                type='outline'
                onPress={() => handleSelectDirectionMode('motorcycle')}
              />
              <PillButton
                label='Transit'
                size='sm'
                type='outline'
                onPress={() => handleSelectDirectionMode('transit')}
              />
              <PillButton
                label='Walk/Bike'
                size='sm'
                type='outline'
                onPress={() => handleSelectDirectionMode('walking')}
              />
            </View>

            <View className='mt-4'>
              <PillButton
                label='Cancel'
                size='sm'
                type='danger'
                onPress={() => setIsDirectionsModalVisible(false)}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Move-in Cost Modal */}
      <Modal
        visible={isMoveInCostModalVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setIsMoveInCostModalVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          className='flex-1 bg-black/40 justify-center px-6'
          onPress={() => setIsMoveInCostModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            className='bg-white rounded-2xl p-5 relative'
            onPress={(event) => event.stopPropagation()}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              className='absolute top-4 right-4 z-10 bg-grey-100 p-1.5 rounded-full'
              onPress={() => setIsMoveInCostModalVisible(false)}
            >
              <IconX size={20} color={COLORS.text} />
            </TouchableOpacity>

            <Text className='text-text font-poppinsSemiBold text-xl pr-8'>
              Move-in Cost Breakdown
            </Text>
            <Text className='text-grey-500 font-inter mt-1 mb-4'>
              Estimated initial payment required to move in.
            </Text>

            <View className='gap-3 bg-darkerWhite p-4 rounded-xl'>
              <View className='flex-row justify-between items-center'>
                <Text className='text-grey-500 font-inter text-base'>Monthly Rent</Text>
                <Text className='text-text font-interMedium text-base'>
                  ₱ {formatCurrency(apartment?.monthly_rent ?? 0)}
                </Text>
              </View>

              <View className='flex-row justify-between items-center'>
                <Text className='text-grey-500 font-inter text-base'>Security Deposit</Text>
                <Text className='text-text font-interMedium text-base'>
                  {apartment?.security_deposit != null ? `₱ ${formatCurrency(apartment.security_deposit)}` : 'None'}
                </Text>
              </View>
              
              <View className='flex-row justify-between items-center'>
                <Text className='text-grey-500 font-inter text-base'>Advance Rent</Text>
                <Text className='text-text font-interMedium text-base'>
                  {apartment?.advance_rent != null ? `₱ ${formatCurrency(apartment.advance_rent)}` : 'None'}
                </Text>
              </View>

              <View className='h-px bg-grey-200 my-1' />

              <View className='flex-row justify-between items-center'>
                <Text className='text-text font-poppinsSemiBold text-lg'>Total Move-in</Text>
                <Text className='text-primary font-poppinsSemiBold text-lg'>
                  ₱ {formatCurrency((apartment?.monthly_rent ?? 0) + (apartment?.security_deposit ?? 0) + (apartment?.advance_rent ?? 0))}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
