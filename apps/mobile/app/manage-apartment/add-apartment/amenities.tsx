import { useState, useMemo } from 'react'
import { View, Text } from 'react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import SearchField from '@/components/inputs/SearchField'
import Divider from '@/components/display/Divider'
import PerkButton from '@/components/buttons/PerkButton'

import { COLORS } from '@repo/constants'
import { PERKS } from '@/constants/perks'
import { useApartmentFormStore } from '@/store/useApartmentFormStore'

export default function Amenities() {
  const [searchValue, setSearchValue] = useState('')

  const amenities = useApartmentFormStore((s) => s.amenities)
  const toggleAmenity = useApartmentFormStore((s) => s.toggleAmenity)

  // All perk entries as an array
  const allPerks = useMemo(() => Object.values(PERKS), [])

  // Filter unselected perks by search query
  const filteredUnselected = useMemo(() => {
    const query = searchValue.toLowerCase().trim()
    return allPerks.filter((perk) => {
      const isSelected = amenities.includes(perk.id)
      const matchesSearch = query === '' || perk.name.toLowerCase().includes(query)
      return !isSelected && matchesSearch
    })
  }, [allPerks, amenities, searchValue])

  // Filter selected perks by search query
  const filteredSelected = useMemo(() => {
    const query = searchValue.toLowerCase().trim()
    return allPerks.filter((perk) => {
      const isSelected = amenities.includes(perk.id)
      const matchesSearch = query === '' || perk.name.toLowerCase().includes(query)
      return isSelected && matchesSearch
    })
  }, [allPerks, amenities, searchValue])

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      header={
        <StandardHeader title='Add Perks & Amenities' />
      }
    >
      <SearchField
        searchPlaceholder='Search a perk'
        onChangeSearch={setSearchValue}
        searchValue={searchValue}
        backgroundColor={COLORS.darkerWhite}
      />

      {/* Validation hint */}
      {amenities.length === 0 && (
        <Text className='text-red-500 text-sm font-inter mt-2'>
          Please select at least one amenity.
        </Text>
      )}

      <Divider />

      {/* Added / Selected Perks */}
      {filteredSelected.length > 0 && (
        <View className='flex gap-3'>
          <Text className='text-text text-lg font-interMedium'>
            Added Perks ({amenities.length})
          </Text>

          <View className='flex-row flex-wrap gap-5'>
            {filteredSelected.map((perk) => (
              <PerkButton
                key={perk.id}
                perkId={perk.id}
                isSelected
                onPress={() => toggleAmenity(perk.id)}
              />
            ))}
          </View>
        </View>
      )}

      {filteredSelected.length > 0 && filteredUnselected.length > 0 && (
        <Divider />
      )}

      {/* All Remaining Perks */}
      {filteredUnselected.length > 0 ? (
        <View className='flex gap-3 mt-3'>
          <Text className='text-text text-lg font-interMedium'>
            All Perks
          </Text>

          <View className='flex-row flex-wrap gap-5'>
            {filteredUnselected.map((perk) => (
              <PerkButton
                key={perk.id}
                perkId={perk.id}
                onPress={() => toggleAmenity(perk.id)}
              />
            ))}
          </View>
        </View>
      ) : (
        searchValue !== '' && filteredSelected.length === 0 && (
          <Text className='text-gray-400 text-sm font-inter text-center mt-4'>
            No perks found for &quot;{searchValue}&quot;.
          </Text>
        )
      )}
    </ScreenWrapper>
  )
}