import { View, Text, Image } from 'react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { COLORS } from '@repo/constants'
import { SAMPLE_IMAGES, DEFAULT_IMAGES } from '@/constants/images';

import { IconMessage, IconRosetteDiscountCheckFilled } from '@tabler/icons-react-native';
import PillButton from '@/components/buttons/PillButton';
import PastApartmentCard from './components/PastApartmentCard';

export default function TenantProfile() {

  // TODO: Change this to fetch user's photo
  const backgroundPhotoUri = SAMPLE_IMAGES.sampleBackgroundPhoto;
  const profilePhotoUri = SAMPLE_IMAGES.sampleProfilePicture;

  const backgroundColor = backgroundPhotoUri ? COLORS.transparent : COLORS.primary;

  // Dummy data for now of Tenant
  const tenantData = {
    fullName: 'Jane Doe',
    email: 'jane.doe@example.com',
    phoneNumber: '(987) 654-3210',
    location: 'Los Angeles, CA',
    memberSinceYear: '2021',
    isVerified: true,
    noReviews: 25,
  }

  // Dummy Data of Past Apartments - to be fetched later
  const tenantPastApartment = [
    {
      id: 1,
      name: 'Apartment 1',
      city: 'Caloocan',
      barangay: 'Barangay 1',
      leaseStartMonth: 'January',
      leaseStartYear: '2022',
      leaseEndMonth: 'December',
      leaseEndYear: '2022',
      thumbnailUrl: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail).uri,
    },
    {
      id: 2,
      name: 'Apartment 2',
      city: 'Malabon',
      barangay: 'Barangay 2',
      leaseStartMonth: 'February',
      leaseStartYear: '2021',
      leaseEndMonth: 'November',
      leaseEndYear: '2021',
      thumbnailUrl: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail2).uri,
    },
    {
      id: 3,
      name: 'Apartment 3',
      city: 'Navotas',
      barangay: 'Barangay 3',
      leaseStartMonth: 'March',
      leaseStartYear: '2020',
      leaseEndMonth: 'October',
      leaseEndYear: '2020',
      thumbnailUrl: Image.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail3).uri,
    }
  ]

  const getFirstName = (fullName: string) => {
    return fullName.split(' ')[0];
  }

  return (
    <ScreenWrapper
      bottomPadding={50}
      scrollable
      header={
        <StandardHeader title="Tenant Profile" />
      }
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
              {tenantData.fullName}
            </Text>
            <Text className='text-grey-500 text-lg font-inter'>
              {tenantData.email}
            </Text>
          </View>
        </View>
      </View>
      
      {/* Tenant Stats */}
      <View className='mx-5 p-4 border-t border-b border-grey-300 flex-row items-center justify-between'>
        {/* No. of Properties */}
        <View className='flex items-center gap-1 w-1/3'>
          <Text className='text-base text-grey-500 font-inter'>
            Reviews
          </Text>
          <Text className='text-3xl text-text font-interMedium'>
            {tenantData.noReviews}
          </Text>
          <Text className='text-base text-grey-500 font-inter'>
            Total
          </Text>
        </View>

        <View
          className='w-[1px] h-full bg-grey-300'
        />

        <View className='flex items-center gap-1 w-1/3'>
          <Text className='text-base text-grey-500 font-inter'>
            Member
          </Text>
          <Text className='text-2xl text-text font-interMedium'>
            {tenantData.memberSinceYear}
          </Text>
          <Text className='text-base text-grey-500 font-interMedium'>
            Since
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
      <View className='mx-5'>
        <View className='flex-row items-center mt-5'>
          <View className='flex w-1/2'>
            <Text className='text-sm text-grey-500 font-inter'>
              Contact Number
            </Text>
            <Text className='text-lg text-text font-interMedium'>
              {tenantData.phoneNumber}
            </Text>
          </View>

          <View className='flex w-1/2'>
            <Text className='text-sm text-grey-500 font-inter'>
              Location/Based In:
            </Text>
            <Text className='text-lg text-text font-interMedium'>
              {tenantData.location}
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

      {/* Past/Previous Apartments */}
      <View className='m-5'>
        <Text className='text-text text-xl font-poppinsMedium'>
          {getFirstName(tenantData.fullName)}&apos;s Listings
        </Text>

        <View className='flex mt-3 gap-3'>
          {/* Render all the listings */}
          {
            tenantPastApartment.map((apartment) => (
              <PastApartmentCard 
                key={apartment.id}
                apartmentName={apartment.name}
                barangay={apartment.barangay}
                city={apartment.city}
                leaseStartMonth={apartment.leaseStartMonth}
                leaseStartYear={apartment.leaseStartYear}
                leaseEndMonth={apartment.leaseEndMonth}
                leaseEndYear={apartment.leaseEndYear}
                thumbnailUrl={apartment.thumbnailUrl}
                onPress={() => {
                    console.log(`Pressed on apartment ${apartment.name}`);
                }}
              />
            ))
          }
        </View>
      </View>
    </ScreenWrapper>
  )
}