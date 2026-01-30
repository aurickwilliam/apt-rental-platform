import { View, Text, Image, TouchableOpacity } from 'react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'

import { COLORS } from '../../constants/colors'
import { IMAGES } from '../../constants/images'

import {
  IconRosetteDiscountCheckFilled,
  IconMessage,
  IconFlag,
} from '@tabler/icons-react-native';
import PillButton from 'components/buttons/PillButton'
import ApartmentCard from 'components/display/ApartmentCard'

export default function LandlordProfile() {
  // Change this to fetch user's photo
  const backgroundPhotoUri = IMAGES.sampleBackgroundPhoto;
  const profilePhotoUri = IMAGES.sampleProfilePicture;
  
  // Dummy data for now of Landlord
  const landlordData = {
    fullName: 'Jonathan Ma',
    email: 'jonathan.ma@example.com',
    noProperties: 12,
    averageRating: 4.7,
    isVerified: true,
    location: 'San Francisco, CA',
    contactNumber: '(123) 456-7890',
    memberSince: 'March 2020',
  }

  // Dummy Data of Listings - to be fetched later
  const landlordListings = [
    {
      id: 1,
      name: 'Apartment 1',
      monthlyRent: 1000,
      location: 'Caloocan',
      noBedroom: 2,
      noBathroom: 1,
      areaSqm: 100,
      isFavorite: true,
    },
    {
      id: 2,
      name: 'Apartment 2',
      monthlyRent: 1200,
      location: 'Malabon',
      noBedroom: 3,
      noBathroom: 2,
      areaSqm: 120,
      isFavorite: true,
    },
    {
      id: 3,
      name: 'Apartment 3',
      monthlyRent: 1500,
      location: 'Navotas',
      noBedroom: 4,
      noBathroom: 3,
      areaSqm: 150,
      isFavorite: false,
    },
  ]

  // Function to get the first name from full name
  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  }

  // TODO: Implement function to handle report landlord
  const handleReportLandlord = () => {
    console.log("Report Landlord Pressed");
  }
  
  const backgroundColor = backgroundPhotoUri ? COLORS.transparent : COLORS.primary;

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title="Landlord Profile" />
      }
      headerBackgroundColor={COLORS.primary}
      backgroundColor={COLORS.darkerWhite}
    >
      {/* Header Information */}
      <View className='relative h-[20rem]'>
        {/* Background Photo */}
        <View 
          className='w-full h-[10rem]' 
          style={{ backgroundColor: backgroundColor }}
        >
          {
            backgroundPhotoUri && (
              <Image 
                source={backgroundPhotoUri}
                style={{ width: '100%', height: '100%' }}
              />
            )
          }
        </View>

        {/* Profile Picture */}
        <View 
          className='absolute bottom-0 
            left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center'
        >
          <View 
            className='size-44 rounded-full overflow-hidden border-[6px] border-primary mb-5'
          >
            <Image 
              source={profilePhotoUri}
              style={{ width: '100%', height: '100%'}}
            />
          </View>

          {/* Name and Email */}
          <View className='flex items-center justify-center'>
            <Text className='text-text text-2xl font-poppinsMedium'>
              {landlordData.fullName}
            </Text>
            <Text className='text-grey-500 text-lg font-inter'>
              {landlordData.email}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Landlord Stats */}
      <View className='mx-5 mt-5 p-4 border-t border-b border-grey-300 flex-row items-center justify-between'>
        {/* No. of Properties */}
        <View className='flex items-center gap-1 w-1/3'>
          <Text className='text-base text-grey-500 font-inter'>
            No. of
          </Text>
          <Text className='text-3xl text-text font-interMedium'>
            {landlordData.noProperties}
          </Text>
          <Text className='text-base text-grey-500 font-interMedium'>
            Properties
          </Text>
        </View>

        <View 
          className='w-[1px] h-full bg-grey-300'
        />

        <View className='flex items-center gap-1 w-1/3'>
          <Text className='text-base text-grey-500 font-inter'>
            Ratings
          </Text>
          <Text className='text-3xl text-secondary font-interMedium'>
            {landlordData.averageRating}/5
          </Text>
          <Text className='text-base text-grey-500 font-interMedium'>
            Average
          </Text>
        </View>

        <View 
          className='w-[1px] h-full bg-grey-300'
        />

        <View className='flex items-center gap-1 w-1/3'>
          <Text className='text-base text-grey-500 font-inter'>
            Identity
          </Text>
          <IconRosetteDiscountCheckFilled
            size={32}
            color={COLORS.primary}
          />
          
          <Text className='text-base text-grey-500 font-interMedium'>
            Verified
          </Text>
        </View>
      </View>
      
      {/* Personal Information */}
      <View className='mt-8 mx-5'>
        <View className='flex'>
          <Text className='text-sm text-grey-500 font-inter'>
            Location/Based In
          </Text>
          <Text className='text-lg text-text font-interMedium'>
            {landlordData.location}
          </Text>
        </View>

        <View className='flex-row items-center mt-5'>
          <View className='flex w-1/2'>
            <Text className='text-sm text-grey-500 font-inter'>
              Contact Number
            </Text>
            <Text className='text-lg text-text font-interMedium'>
              {landlordData.contactNumber}
            </Text>
          </View>

          <View className='flex w-1/2'>
            <Text className='text-sm text-grey-500 font-inter'>
              Member Since
            </Text>
            <Text className='text-lg text-text font-interMedium'>
              {landlordData.memberSince}
            </Text>
          </View>
        </View>

        <View className='mt-5'>
          <PillButton 
            label='Message'
            type='outline'
            size='sm'
            leftIconName={IconMessage}
            onPress={() => {
              // TODO: Implement route navigation to chatting page
              console.log("Message was Pressed");
            }}
          />
        </View>
      </View>
      
      {/* Listings */}
      <View className='mt-8 mx-5'>
        <Text className='text-text text-xl font-poppinsMedium'>
          {getFirstName(landlordData.fullName)}&apos;s Listings
        </Text>
        
        <View className='flex-row flex-wrap mt-3 gap-y-3'>
          {/* Render all the listings */}
          {
            landlordListings.map((listing) => (
              <ApartmentCard 
                key={listing.id}
                id={listing.id}
                name={listing.name}
                location={listing.location}
                monthlyRent={listing.monthlyRent}
                noBedroom={listing.noBedroom}
                noBathroom={listing.noBathroom}
                areaSqm={listing.areaSqm}
                isFavorite={listing.isFavorite}
                isGrid={true}
              />
            ))
          }
        </View>
      </View>

      {/* Report Button */}
      <View className='mt-20 mx-5 flex items-center justify-center
      '>
        <TouchableOpacity
          activeOpacity={0.7}
          className='flex-row items-center justify-center gap-2'
          onPress={handleReportLandlord}
        >
          <IconFlag 
            size={26}
            color={COLORS.lightRedHead}
          />
          <Text className='text-redHead-100 text-lg font-interMedium'>
            Report {getFirstName(landlordData.fullName)}
          </Text>
        </TouchableOpacity>
      </View>

    </ScreenWrapper>
  )
}