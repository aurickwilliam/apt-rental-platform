import { useState, useMemo } from 'react'
import { View, Text } from 'react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { Chip, SearchField, Separator } from 'heroui-native'

import {
  X
} from 'lucide-react-native'

import { PERKS } from '@/constants/perks'

import { useApartmentFormStore } from '@/stores/useApartmentFormStore'

import { useColors } from '@/hooks/useTheme'

export default function Amenities() {
  const { colors } = useColors()

  const [searchValue, setSearchValue] = useState('')

  const amenities = useApartmentFormStore((s) => s.amenities)
  const toggleAmenity = useApartmentFormStore((s) => s.toggleAmenity)

  const allPerks = useMemo(() => Object.values(PERKS), [])

  const filteredUnselected = useMemo(() => {
    const query = searchValue.toLowerCase().trim()
    return allPerks.filter((perk) => {
      const isSelected = amenities.includes(perk.id)
      const matchesSearch = query === '' || perk.name.toLowerCase().includes(query)
      return !isSelected && matchesSearch
    })
  }, [allPerks, amenities, searchValue])

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
      header={<StandardHeader title='Add Perks & Amenities' />}
    >
      <SearchField value={searchValue} onChange={setSearchValue}>
        <SearchField.Group className='bg-darkerWhite'>
          <SearchField.SearchIcon />
          <SearchField.Input placeholder='Search a perk' />
          <SearchField.ClearButton />
        </SearchField.Group>
      </SearchField>

      {amenities.length === 0 && (
        <Text className='text-danger text-sm font-inter mt-2'>
          Please select at least one amenity.
        </Text>
      )}

      <Separator className='my-4' />

      {filteredSelected.length > 0 && (
        <View className='flex gap-3'>
          <Text className='text-foreground text-base font-interMedium'>
            Added Perks ({amenities.length})
          </Text>
          <View className='flex-row flex-wrap gap-3'>
            {filteredSelected.map((perk) => (
              <Chip
                key={perk.id}
                variant='secondary'
                color='accent'
                onPress={() => toggleAmenity(perk.id)}
              >
                <perk.icon size={16} color={colors.primary} />
                <Chip.Label>{perk.name}</Chip.Label>
                <X size={12} />
              </Chip>
            ))}
          </View>
        </View>
      )}

      {filteredSelected.length > 0 && filteredUnselected.length > 0 && (
        <Separator className='my-4' />
      )}

      {filteredUnselected.length > 0 ? (
        <View className='flex gap-3 mt-3'>
          <Text className='text-foreground text-base font-interMedium'>
            All Perks
          </Text>
          <View className='flex-row flex-wrap gap-3'>
            {filteredUnselected.map((perk) => (
              <Chip
                key={perk.id}
                variant='secondary'
                onPress={() => toggleAmenity(perk.id)}
              >
                <perk.icon size={16} color={colors.textPrimary} />
                <Chip.Label className='text-foreground'>{perk.name}</Chip.Label>
              </Chip>
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