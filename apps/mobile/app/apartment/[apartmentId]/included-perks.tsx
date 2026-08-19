import { View, Text } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { SkeletonGroup } from 'heroui-native'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import PerkItem from 'components/display/PerkItem'

import { useApartmentDetails } from '@/hooks/apartments'

export default function IncludedPerks() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { apartment, loading, error } = useApartmentDetails(apartmentId, { includeReviews: false });

  const amenities = apartment?.amenities ?? [];

  if (error) {
    return (
      <ScreenWrapper header={<StandardHeader title='Included Perks' />} className='p-5'>
        <View className='flex-1 items-center justify-center'>
          <Text className='text-gray-500 font-nunitoSemiBold text-base'>
            Failed to load perks.
          </Text>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Included Perks' />
      }
      className='p-5'
      bottomPadding={50}
    >
      <SkeletonGroup isLoading={loading}>
        <View className='flex items-start gap-3'>
          {amenities.length > 0 ? (
            amenities.map(perkId => (
              <PerkItem key={perkId} perkId={perkId} />
            ))
          ) : (
            <Text className='text-gray-500 font-nunitoSemiBold text-base'>
              No perks included for this apartment.
            </Text>
          )}
        </View>

        <View className='flex items-start gap-3'>
          {Array.from({ length: 10 }).map((_, i) => (
            <SkeletonGroup.Item
              key={i}
              className='h-10 w-full rounded-lg'
            />
          ))}
        </View>
      </SkeletonGroup>
    </ScreenWrapper>
  )
}