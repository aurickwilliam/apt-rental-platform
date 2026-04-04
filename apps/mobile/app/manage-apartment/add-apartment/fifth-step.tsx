import { View, Text, ScrollView, TouchableOpacity, Image, Animated, Dimensions, ActivityIndicator } from 'react-native'
import ImageViewing from 'react-native-image-viewing'
import { useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { MapView, Camera, ShapeSource, CircleLayer, setAccessToken } from '@maplibre/maplibre-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/display/ApplicationHeader'
import PillButton from '@/components/buttons/PillButton'
import PerkItem from '@/components/display/PerkItem'
import LandlordCard from '@/components/display/LandlordCard'

import { COLORS } from '@repo/constants'

import {
  IconMapPin,
  IconHome2,
  IconStarFilled,
  IconBed,
  IconBath,
  IconMaximize,
  IconBuildingCommunity,
  IconSquareCheck,
  IconMap,
  IconUser,
  IconFileDescription,
  IconUsers,
  IconBuildingSkyscraper,
  IconCalendar,
} from '@tabler/icons-react-native'

import { useApartmentFormStore } from '@/store/useApartmentFormStore'

import { formatCurrency } from '@repo/utils'

import { useProfile } from '@/hooks/useProfile'
import { useLandlordStats } from '@/hooks/useLandlordStats'
import { usePublishApartment } from '@/hooks/usePublishApartment'

setAccessToken(null)  // Suppress the missing API key warning since we're using free OSM tiles

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


export default function FifthStep() {
  const router = useRouter();

  const [isReadMore, setIsReadMore] = useState<boolean>(false);
  const [isImageViewVisible, setIsImageViewVisible] = useState<boolean>(false);
  const [imageIndex, setImageIndex] = useState<number>(0);

  const { profile, loading: profileLoading } = useProfile()
  const { stats, loading: statsLoading } = useLandlordStats(profile?.id)
  const { 
    publish, 
    loading: publishing, 
    error: publishError 
  } = usePublishApartment()

  const isLoading = profileLoading || statsLoading;

  const { width } = Dimensions.get('window');

  // Refs for ScrollView
  const imageScrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Pull data from Zustand store
  const {
    name,
    thumbnail,
    additionalPhotos,
    apartmentType,
    streetName,
    barangay,
    city,
    province,
    bedrooms,
    bathrooms,
    floorArea,
    amenities,
    description,
    monthlyRent,
    latitude,
    longitude,
    maxOccupants,
    floorLevel,
    leaseDuration,
  } = useApartmentFormStore();

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  // Build image list from thumbnail + additionalPhotos
  const apartmentImages = [
    ...(thumbnail ? [{ id: 'thumbnail', uri: thumbnail.uri }] : []),
    ...additionalPhotos.map((photo, index) => ({ id: `photo-${index}`, uri: photo.uri })),
  ];

  // Build location string from address fields
  const locationString = [streetName, barangay, city, province]
    .filter(Boolean)
    .join(', ');

  const handleViewFullImage = (index: number) => {
    setImageIndex(index);
    setIsImageViewVisible(true);
  }

  const toggleReadMoreDescription = () => {
    setIsReadMore(!isReadMore);
  }

  const handlePublish = async () => {
    const success = await publish()
    if (success) {
      router.push('/manage-apartment/add-apartment/success')
    }
  }

  return (
    <ScreenWrapper
      scrollable
      backgroundColor={COLORS.darkerWhite}
    >
      <ApplicationHeader
        currentTitle={'Preview & Publish'}
        nextTitle={'Publish the Apartment'}
        step={5}
        totalSteps={5}
      />

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
          {apartmentImages.map((item, index) => (
            <TouchableOpacity
              activeOpacity={0.9}
              className='w-screen h-full'
              key={item.id}
              onPress={() => handleViewFullImage(index)}
            >
              <Image
                source={{ uri: item.uri }}
                style={{ height: '100%', width: '100%' }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Text Details on top of the Carousel */}
        {/* Linear Gradient Overlay */}
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
          {/* Apartment Details */}
          <View>
            <Text className='text-white font-poppinsSemiBold text-2xl'>
              {name || 'Unnamed Apartment'}
            </Text>

            <View className='flex-row items-center mt-2 gap-2'>
              <IconMapPin size={24} color={COLORS.lightLightLightGrey} />
              <Text className='text-grey-100 font-interMedium text-base'>
                {locationString || 'No location provided'}
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
                  {bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}
                </Text>
              </View>

              <View className='flex-row items-center gap-2'>
                <IconBath size={24} color={COLORS.lightLightLightGrey} />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}
                </Text>
              </View>

              <View className='flex-row items-center gap-2'>
                <IconMaximize size={24} color={COLORS.lightLightLightGrey} />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {floorArea ? `${floorArea} Sqm` : 'N/A'}
                </Text>
              </View>
            </View>

            <View className='flex-row mt-4 gap-6'>
              <View className='flex-1 flex-row items-center gap-2'>
                <IconUsers size={24} color={COLORS.lightLightLightGrey} />
                <Text className='text-grey-100 font-interMedium text-base'>
                  Max {maxOccupants} {maxOccupants === 1 ? 'Occupant' : 'Occupants'}
                </Text>
              </View>

              <View className='flex-1 flex-row items-center gap-2'>
                <IconBuildingSkyscraper size={24} color={COLORS.lightLightLightGrey} />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {floorLevel ? `Floor ${floorLevel}` : 'N/A'}
                </Text>
              </View>
            </View>

            <View className='flex-row mt-4 mb-5 gap-6'>
              <View className='flex-1 flex-row items-center gap-2'>
                <IconHome2 size={24} color={COLORS.lightLightLightGrey} />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {apartmentType || 'N/A'}
                </Text>
              </View>

              <View className='flex-1 flex-row items-center gap-2'>
                <IconCalendar size={24} color={COLORS.lightLightLightGrey} />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {leaseDuration || 'N/A'}
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
                  style={[{ width: dotWidth, opacity }]}
                />
              );
            })}
          </View>
        </LinearGradient>
      </View>

      {/* Apartment Description */}
      <View className='mt-5 px-5 flex-row items-center gap-2'>
        <IconBuildingCommunity size={26} color={COLORS.text} />
        <Text className='font-poppinsSemiBold text-xl text-text'>
          Everything About Your Apartment
        </Text>
      </View>

      <View className='mt-3 mx-5 p-4 bg-white rounded-2xl'>
        <Text>
          {description
            ? isReadMore
              ? description
              : `${description.slice(0, 500)}${description.length > 500 ? '...' : ''}`
            : 'No description provided.'}
        </Text>

        {description.length > 500 && (
          <View className='mt-5'>
            <PillButton
              label={isReadMore ? 'Read Less' : 'Read More'}
              type='outline'
              size='sm'
              onPress={toggleReadMoreDescription}
            />
          </View>
        )}
      </View>

      {/* Included Perks */}
      <View className='mt-10 px-5 flex gap-2'>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center gap-2'>
            <IconSquareCheck size={26} color={COLORS.text} />
            <Text className='font-poppinsSemiBold text-xl text-text'>
              Included Perks
            </Text>
          </View>

          <TouchableOpacity activeOpacity={0.7}>
            <Text className='font-interMedium text-base text-primary'>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        <Text>These are already included in your rent.</Text>
      </View>

      {/* List of Perks */}
      <View className='flex-row flex-wrap px-5 mt-5'>
        {amenities.length > 0
          ? amenities.map(perkId => (
              <View key={perkId} className='w-1/2 mb-4'>
                <PerkItem perkId={perkId} />
              </View>
            ))
          : (
            <Text className='text-text font-inter'>No amenities selected.</Text>
          )
        }
      </View>

      {/* Map View */}
      <View className='flex-row items-center gap-2 mt-10 px-5'>
        <IconMap size={26} color={COLORS.text} />
        <Text className='font-poppinsSemiBold text-xl text-text'>
          View on Map
        </Text>
      </View>

      {/* Map */}
      <View className='h-56 mx-5 mt-3 rounded-2xl overflow-hidden'>
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
                longitude ?? DEFAULT_COORDS.longitude,
                latitude ?? DEFAULT_COORDS.latitude
              ]}
              zoomLevel={15}
              animationDuration={0}
              maxZoomLevel={19}
            />

            {latitude && longitude && (
              <ShapeSource
                id='pin-source'
                shape={{
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [longitude, latitude],
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
      </View>

      {/* Landlord Card */}
      <View className='flex-row items-center gap-2 mt-10 px-5'>
        <IconUser size={26} color={COLORS.text} />
        <Text className='font-poppinsSemiBold text-xl text-text'>
          Meet Your Rental Owner
        </Text>
      </View>

      <View className='px-5 mt-3'>
        {isLoading ? (
          <View className='h-40 items-center justify-center'>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : profile ? (
          <LandlordCard
            fullName={`${profile.first_name} ${profile.last_name}`}
            email={profile.email ?? ''}
            phoneNumber={profile.mobile_number}
            profilePictureUrl={profile.avatar_url}
            withRentalInfo
            averageRating={stats.averageRating}
            totalRentals={stats.totalProperties}
          />
        ) : null}
      </View>

      {/* Lease Agreement */}
      <View className='mt-10 px-5 flex gap-2'>
        <View className='flex-row items-center gap-2'>
          <IconFileDescription size={26} color={COLORS.text} />
          <Text className='font-poppinsSemiBold text-xl text-text'>
            Lease Agreement & Rules
          </Text>
        </View>

        <Text className='text-text text-base font-inter'>
          Please review the rental owner&apos;s property rules before applying.
        </Text>

        <PillButton
          label='View Full Lease Agreement'
          type='outline'
          size='sm'
        />
      </View>

      {/* Footer */}
      <View className='bg-white mt-20 px-5 py-4 border border-grey-200'>
        <View className='flex-row gap-5 items-center'>
          <View className='flex-row items-center'>
            <Text className='text-3xl font-poppinsSemiBold text-primary'>
              ₱ {formatCurrency(Number(monthlyRent))}
            </Text>
            <Text className='text-base font-interMedium text-grey-500'>
              /month
            </Text>
          </View>

          <View className='flex-1'>
            <PillButton
              label='Apply Now'
              size='md'
              isDisabled
            />
          </View>
        </View>
      </View>

      <View className='flex-row w-full gap-4 p-5'>
        <View className='flex-1'>
          <PillButton
            label='Back'
            type='outline'
            isFullWidth
            onPress={() => router.back()}
          />
        </View>
        <View className='flex-1'>
          <PillButton
            label={publishing ? 'Publishing...' : 'Publish'}
            isFullWidth
            isDisabled={publishing}
            onPress={handlePublish}
          />
        </View>
      </View>

      {/* Optionally show the error */}
      {publishError && (
        <Text className='text-red-500 text-sm text-center mt-2'>
          {publishError}
        </Text>
      )}

      {/* Image Viewer */}
      <ImageViewing
        key={imageIndex}
        images={apartmentImages.map(img => ({ uri: img.uri }))}
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
    </ScreenWrapper>
  )
}