import { View, Text } from 'react-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import Divider from 'components/display/Divider'

import { formatCurrency } from 'utils/formatCurrency'

import { COLORS } from 'constants/colors'

import {
  IconHome,
  IconBath,
  IconBed,
  IconMaximize,
  IconCar,
  IconScanEye,
  IconSwimming,
  IconBarbell,
  IconWifi,
  IconDeviceDesktop,
  IconFileText,
} from '@tabler/icons-react-native';
import IconDetail from 'components/display/IconDetail'
import PillButton from 'components/buttons/PillButton'

export default function ApartmentDetails() {

  // Dummy data for illustration; replace with actual data fetching logic
  const apartmentDetails = {
    apartmentName: 'Apartment Name',
    apartmentAddress: 'Apartment Address',
    leaseStartMonth: 'January',
    leaseStartYear: '2023',
    leaseEndMonth: 'December',
    leaseEndYear: '2023',
    monthlyRent: 1000,
  }

  const apartmentFullDescription = `Good day! I am renting out my 2-bedroom fully furnished apartment located in a safe and accessible area. The unit is on the 5th floor of a well-maintained building with 24/7 security and CCTV.

The apartment includes a spacious living room with sofa set and TV, a dining area, and a modern kitchen equipped with a refrigerator, electric stove, microwave, and cabinets. Both bedrooms are air-conditioned and come with built-in closets. The master bedroom has its own bathroom, while there is also a separate common bathroom for guests.

The unit has a balcony with good ventilation and natural lighting, and a dedicated laundry area with washing machine provision. Water and electricity are individually metered.

The building is near malls, schools, hospitals, and public transportation, making it very convenient for working professionals or small families.

Monthly Rent: ₱25,000
Terms: 1 month advance + 2 months deposit
Minimum stay: 6 months
No pets / No smoking inside the unit`

  const unitDetails = {
    type: 'Bungalow',
    bedrooms: 2,
    bathrooms: 2,
    floorAreaSQM: 850,
    parking: '1 slot',
  }

  const includedPerks = [
    { icon: IconScanEye, detailText: '24/7 Security' },
    { icon: IconSwimming, detailText: 'Swimming Pool' },
    { icon: IconBarbell, detailText: 'Gym Access' },
    { icon: IconWifi, detailText: 'Wi-Fi' },
    { icon: IconDeviceDesktop, detailText: 'TV/Smart TV' },
  ]

  const formattedMonthlyRent = formatCurrency(apartmentDetails.monthlyRent);

  const handleViewLeaseAgreement = () => {
    // Navigate to or display the lease agreement
  }

  return (
    <ScreenWrapper 
      scrollable 
      className='p-5'
      header={
        <StandardHeader 
          title="Apartment Details" 
          showBack 
        />
      }
      headerBackgroundColor={COLORS.primary}
    >
      {/* Name and Address */}
      <View>
        <Text className='text-2xl font-interSemiBold text-text'>
          {apartmentDetails.apartmentName}
        </Text>
        <Text className='text-base text-text'>
          {apartmentDetails.apartmentAddress}
        </Text>
      </View>

      {/* Landlord */}
      <View className='mt-5'>
        <Text className='text-text text-sm font-inter'>
          Landlord
        </Text>
        <Text className='text-text text-lg font-interMedium'>
          John Doe
        </Text>
      </View>

      {/* Lease Duration */}
      <View className='flex-row mt-5'>
        {/* Start */}
        <View className='flex w-1/2'>
          <Text className='text-text text-sm font-inter'>
            Lease Start
          </Text>
          <Text className='text-text text-lg font-interMedium'>
            {`${apartmentDetails.leaseStartMonth} ${apartmentDetails.leaseStartYear}`}
          </Text>
        </View>

        {/* End */}
        <View className='flex w-1/2'>
          <Text className='text-text text-sm font-inter'>
            Lease End
          </Text>
          <Text className='text-text text-lg font-interMedium'>
            {`${apartmentDetails.leaseEndMonth} ${apartmentDetails.leaseEndYear}`}
          </Text>
        </View>
      </View>

      {/* Monthly Rent */}
      <View className='mt-5'>
        <Text className='text-text text-sm font-inter'>
          Monthly Rent
        </Text>
        <Text className='text-text text-lg font-interMedium'>
          {`₱ ${formattedMonthlyRent}`}
        </Text>
      </View>

      {/* Divider */}
      <Divider />

      {/* Full Description */}
      <Text className='text-text text-base font-poppinsMedium'>
        Apartment Full Description
      </Text>

      <View className='mt-3 bg-darkerWhite p-4 rounded-2xl'>
        <Text className='text-text text-base font-inter'>
          {apartmentFullDescription}
        </Text>
      </View>

      {/* Room/Unit Details */}
      <Text className='text-text text-lg font-poppinsMedium mt-5'>
        Room/Unit Details
      </Text>

      <View className='flex-row flex-wrap justify-between mt-5'>
        <View className='w-1/2 mb-5'>
          <IconDetail 
            icon={IconHome} 
            detailText={unitDetails.type}            
          />
        </View>

        <View className='w-1/2 mb-5'>
          <IconDetail 
            icon={IconBath} 
            detailText={`${unitDetails.bathrooms} Bathrooms`}            
          />
        </View>       

        <View className='w-1/2 mb-5'>
          <IconDetail 
            icon={IconBed} 
            detailText={`${unitDetails.bedrooms} Bedrooms`}            
          />
        </View>

        <View className='w-1/2 mb-5'>
          <IconDetail 
            icon={IconMaximize} 
            detailText={`${unitDetails.floorAreaSQM} sqm`}            
          />
        </View>     

        <View className='w-1/2 mb-5'>
          <IconDetail 
            icon={IconCar} 
            detailText={unitDetails.parking}            
          />
        </View>     
      </View>

      {/* Included Perks */}
      <Text className='text-text text-lg font-poppinsMedium mt-5'>
        Included Perks
      </Text>

      <View className='flex-row flex-wrap justify-between mt-5'>
        {
          includedPerks.map((perk, index) => (
            <View className='w-1/2 mb-5' key={index}>
              <IconDetail 
                icon={perk.icon} 
                iconColor={COLORS.primary}
                detailText={perk.detailText}            
              />
            </View> 
          ))
        }
      </View>

      {/* Divider */}
      <Divider />

      {/* Button for View Lease Agreement */}
      <View className='mt-5'>
        <PillButton 
          label='View Lease Agreement'
          isFullWidth
          type='outline'
          leftIconName={IconFileText}
          onPress={handleViewLeaseAgreement}
        />
      </View>

    </ScreenWrapper>
  )
}