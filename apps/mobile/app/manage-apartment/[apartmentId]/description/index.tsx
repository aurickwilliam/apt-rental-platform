import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import Divider from '@/components/display/Divider'
import PerkItem from '@/components/display/PerkItem'
import PillButton from '@/components/buttons/PillButton'

import {
  IconHome,
  IconBath,
  IconBed,
  IconMaximize,
  IconCar,
  IconFileText,
  IconEdit,
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'

export default function Index() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams();


  // Dummy data for included perks
  const includedPerks = [
    'wifi',
    'ac',
    'tv',
    'kitchen',
    'parking',
    'hotwater',
    'bath'
  ]

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
      header={
        <StandardHeader title='Apartment Description' />
      }
    >
      {/* Name and Address */}
      <View className='flex-row items-center justify-between'>
        <Text className='text-text text-lg font-poppinsMedium'>
          Main Information
        </Text>

        <TouchableOpacity
          onPress={() => router.push(`/manage-apartment/${apartmentId}/description/edit-main`)}
        >
          <IconEdit 
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View className='mt-3'>
        <Text className='text-2xl font-interSemiBold text-text'>
          Apartment Name
        </Text>
        <Text className='text-base text-text'>
          Apartment Address
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
            June 2023
          </Text>
        </View>

        {/* End */}
        <View className='flex w-1/2'>
          <Text className='text-text text-sm font-inter'>
            Lease End
          </Text>
          <Text className='text-text text-lg font-interMedium'>
            May 2024
          </Text>
        </View>
      </View>

      {/* Monthly Rent */}
      <View className='mt-5'>
        <Text className='text-text text-sm font-inter'>
          Monthly Rent
        </Text>
        <Text className='text-text text-lg font-interMedium'>
          ₱ 25,000
        </Text>
      </View>

      {/* Divider */}
      <Divider />

      {/* Full Description */}
      <View className='flex-row items-center justify-between'>
        <Text className='text-text text-lg font-poppinsMedium'>
          Apartment Full Description
        </Text>

        <TouchableOpacity
          onPress={() => router.push(`/manage-apartment/${apartmentId}/description/edit-description`)}
        >
          <IconEdit 
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View className='mt-3 bg-darkerWhite p-4 rounded-2xl'>
        <Text className='text-text text-base font-inter'>
          Consectetur veniam incididunt enim occaecat qui cillum ullamco eiusmod. Dolore excepteur incididunt esse quis proident consectetur nostrud velit consequat occaecat sunt. Reprehenderit proident irure dolor labore elit ipsum dolor cupidatat minim culpa aliqua nisi dolore ad. Id cillum excepteur esse dolor sit in do ut qui aliqua elit consectetur excepteur voluptate. Adipisicing est exercitation aliqua Lorem pariatur sint ullamco consequat pariatur pariatur aliquip nisi. Pariatur magna nostrud Lorem quis ullamco nulla esse ut adipisicing reprehenderit. Voluptate ad qui labore consequat officia dolore anim ex proident in in ad nulla enim. Culpa qui in nostrud deserunt.
        </Text>
      </View>

      {/* Room/Unit Details */}
      <View className='flex-row items-center justify-between'>
        <Text className='text-text text-lg font-poppinsMedium mt-5'>
          Room/Unit Details
        </Text>

        <TouchableOpacity
          onPress={() => router.push(`/manage-apartment/${apartmentId}/description/edit-specs`)}
        >
          <IconEdit 
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View className='flex-row flex-wrap justify-between mt-5'>
        <View className='w-1/2 mb-5'>
          <PerkItem
            customIcon={IconHome}
            customText={'Apartment Type'}
            iconColor={COLORS.mediumGrey}
          />
        </View>

        <View className='w-1/2 mb-5'>
          <PerkItem
            customIcon={IconBath}
            customText={`1 Bathrooms`}
            iconColor={COLORS.mediumGrey}
          />
        </View>

        <View className='w-1/2 mb-5'>
          <PerkItem
            customIcon={IconBed}
            customText={`2 Bedrooms`}
            iconColor={COLORS.mediumGrey}
          />
        </View>

        <View className='w-1/2 mb-5'>
          <PerkItem
            customIcon={IconMaximize}
            customText={`50 sqm`}
            iconColor={COLORS.mediumGrey}
          />
        </View>

        <View className='w-1/2 mb-5'>
          <PerkItem
            customIcon={IconCar}
            customText={'Parking Available'}
            iconColor={COLORS.mediumGrey}
          />
        </View>
      </View>

      {/* Included Perks */}
      <View className='flex-row items-center justify-between'>
        <Text className='text-text text-lg font-poppinsMedium mt-5'>
          Included Perks
        </Text>

        <TouchableOpacity
          onPress={() => router.push(`/manage-apartment/${apartmentId}/description/edit-perks`)}
        >
          <IconEdit 
            size={24}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <View className='flex-row flex-wrap justify-between mt-5'>
        {
          includedPerks.map((perk, index) => (
            <View className='w-1/2 mb-5' key={index}>
              <PerkItem
                iconColor={COLORS.primary}
                perkId={perk}
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
          onPress={() => {}}
        />
      </View>
    </ScreenWrapper>
  )
}