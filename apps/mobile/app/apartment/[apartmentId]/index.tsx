import {
  View,
  Text,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  TouchableOpacity
} from 'react-native'
import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import ScreenWrapper from 'components/layout/ScreenWrapper'
import IconButton from 'components/buttons/IconButton';
import PillButton from 'components/buttons/PillButton';
import IconDetail from 'components/display/IconDetail';
import SmallRatingCard from 'components/display/SmallRatingCard';
import LandlordCard from 'components/display/LandlordCard';

import { COLORS } from 'constants/colors';
import { IMAGES } from 'constants/images';

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
  IconWifi,
  IconScanEye,
  IconSwimming,
  IconBarbellFilled,
  IconParking,
  IconMap,
  IconStar,
  IconUser,
  IconFileDescription,
  IconCalendarEvent,
} from "@tabler/icons-react-native";

import { formatCurrency } from 'utils/formatCurrency';

export default function ApartmentScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();
  const router = useRouter();

  const { width } = Dimensions.get('window');

  const [isReadMore, setIsReadMore] = useState<boolean>(false);

  // Refs for ScrollView
  const imageScrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  // Dummy Data for apartment images
  const apartmentImages = [
    {id: 1, image: IMAGES.defaultThumbnail},
    {id: 2, image: IMAGES.defaultThumbnail},
    {id: 3, image: IMAGES.defaultThumbnail},
  ]

  // Dummy Data for Apartment Details
  const apartmentDetails = {
    name: 'Sample Apartment',
    type: 'Condominium',
    ratings: '4.5',
    location: 'Sample Location',
    monthlyRent: 1200,
    noBedroom: 2,
    noBathroom: 1,
    areaSqm: 85,
    perks: [
      {text: 'Free Wi-Fi', icon: IconWifi},
      {text: '24/7 Security', icon: IconScanEye},
      {text: 'Swimming Pool Access', icon: IconSwimming},
      {text: 'Gym Membership', icon: IconBarbellFilled},
      {text: 'Parking Space', icon: IconParking},
    ],
    description: `Good day! I am renting out my 2-bedroom fully furnished apartment located in a safe and accessible area. The unit is on the 5th floor of a well-maintained building with 24/7 security and CCTV.

The apartment includes a spacious living room with sofa set and TV, a dining area, and a modern kitchen equipped with a refrigerator, electric stove, microwave, and cabinets. Both bedrooms are air-conditioned and come with built-in closets. The master bedroom has its own bathroom, while there is also a separate common bathroom for guests.

The unit has a balcony with good ventilation and natural lighting, and a dedicated laundry area with washing machine provision. Water and electricity are individually metered.

The building is near malls, schools, hospitals, and public transportation, making it very convenient for working professionals or small families.

Monthly Rent: ₱25,000
Terms: 1 month advance + 2 months deposit
Minimum stay: 6 months
No pets / No smoking inside the unit

Serious tenants only. Please message me for viewing and inquiries.`,
    landlordId: 1,
  };

  const toggleReadMoreDescription = () => {
    setIsReadMore(!isReadMore);
  }

  // TODO: Implement this Functions
  const handleFavoriteToggle = () => {
    console.log("Favorite Button Pressed!");
  }

  const handleRequestVisit = () => {
    console.log("Request a Visit Button Pressed!");
  }

  const handleApplyNow = () => {
    console.log("Apply Now Button Pressed!");
  }

  const handleMessageLandlord = () => {
    console.log("Message Landlord Button Pressed!");
  }

  const handleLandlordProfileNavigation = () => {
    router.push(`/landlord-profile/${apartmentDetails.landlordId}`);
  }

  const handleSeeAllRatings = () => {
    router.push(`/apartment/${apartmentId}/ratings`);
  }

  return (
    <View className='flex-1'>
      <ScreenWrapper
        scrollable
        backgroundColor={COLORS.white}
        safeAreaEdges={['left', 'right']}
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
              apartmentImages.map((item) => (
                <View
                  className='w-screen h-full'
                  key={item.id}
                >
                  <Image
                    source={item.image}
                    style={{height: '100%', width:  '100%'}}
                  />
                </View>
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
                {apartmentDetails.name}
              </Text>

              <View className='flex-row items-center mt-2 gap-2'>
                <IconMapPin
                  size={24}
                  color={COLORS.lightLightLightGrey}
                />
                <Text className='text-grey-100 font-interMedium text-base'>
                  {apartmentDetails.location}
                </Text>
              </View>

              <View className='flex-row items-center justify-between mt-8 gap-6'>
                <View className='flex-row items-center gap-2'>
                  <IconHome2
                    size={24}
                    color={COLORS.lightLightLightGrey}
                  />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartmentDetails.type}
                  </Text>
                </View>

                <View className='flex-row items-center gap-2'>
                  <IconStarFilled
                    size={20}
                    color={COLORS.secondary}
                  />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartmentDetails.ratings}  (70)
                  </Text>
                </View>
              </View>

              <View className='flex-row items-center justify-between my-5 gap-6'>
                <View className='flex-row items-center gap-2'>
                  <IconBed
                    size={24}
                    color={COLORS.lightLightLightGrey}
                  />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartmentDetails.noBedroom} Bedrooms
                  </Text>
                </View>

                <View className='flex-row items-center gap-2'>
                  <IconBath
                    size={24}
                    color={COLORS.lightLightLightGrey}
                  />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartmentDetails.noBathroom} Bathrooms
                  </Text>
                </View>

                <View className='flex-row items-center gap-2'>
                  <IconMaximize
                    size={24}
                    color={COLORS.lightLightLightGrey}
                  />
                  <Text className='text-grey-100 font-interMedium text-base'>
                    {apartmentDetails.areaSqm} Sqm
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
          <Text>
            {
              isReadMore 
              ? apartmentDetails.description
              : `${apartmentDetails.description.slice(0, 500)}...`
            }
          </Text>

          <View className='mt-5'>
            <PillButton 
              label={isReadMore ? 'Read Less' : 'Read More'}
              type='outline'
              size='sm'
              onPress={toggleReadMoreDescription}
            />
          </View>
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
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => {
                console.log("Included Perks See All was Pressed!");
              }}
            >
              <Text className='font-interMedium text-base text-primary'>
                See All
              </Text>
            </TouchableOpacity>
          </View>

          <Text>
            These are already included in your rent.
          </Text>
        </View>

        {/* List of Perks */}
        <View className='flex-row flex-wrap px-5 mt-5'>
          {
            apartmentDetails.perks.map((perk, index) => (
              <View
                key={index}
                className='w-1/2 mb-4'
              >
                <IconDetail 
                  detailText={perk.text} 
                  icon={perk.icon}
                  iconColor={COLORS.primary}
                />
              </View>
            ))
          }
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
        <View className='h-56 mx-5 mt-3 bg-amber-200 rounded-2xl relative'>
          {/* // TODO: Implement Google Maps API here */}

          <TouchableOpacity
          activeOpacity={0.7}
          className='absolute bottom-4 right-4 bg-white px-4 py-2 rounded-full'
          onPress={() => {
            console.log("Get Directions was Pressed!");
          }}
          >
            <Text className='font-interMedium text-base text-primary'>
              Get Directions
            </Text>
          </TouchableOpacity>
        </View>

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
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSeeAllRatings}
          >
            <Text className='font-interMedium text-base text-primary'>
              See All
            </Text>
          </TouchableOpacity>
        </View>

        {/* Render List of Top 2/3 Ratings */}
        <View className='mt-5 px-5 flex gap-3'>
            <SmallRatingCard 
              accountName='John Doe'
              rating={4.5}
              comment='Great place to stay! Very clean and well-maintained.'
              date='March 15, 2023'
            />
            <SmallRatingCard 
              accountName='Jane Smith'
              rating={4.0}
              comment='Good location and friendly staff. Would recommend!'
              date='April 2, 2023'
            />
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
            fullName={'John Doe'} 
            email={'johndoe@yahoo.com'} 
            phoneNumber={'09123456789'} 
            withRentalInfo
            averageRating={4.5}
            totalRentals={25}
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
          <View className='flex-row items-center'>
            <Text className='text-3xl font-poppinsSemiBold text-primary'>
              ₱ {formatCurrency(apartmentDetails.monthlyRent)}
            </Text>
            <Text className='text-base font-interMedium text-grey-500'>
              /month
            </Text>
          </View>

          <View className='flex-1 flex-row gap-5'>
            <View className='flex-1'>
              <PillButton 
                label='Request a Visit'
                size='md'
                type='outline'
                leftIconName={IconCalendarEvent}
                onPress={handleRequestVisit}
              />
            </View>

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
        className='absolute left-4'
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
        className='absolute right-4'
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
