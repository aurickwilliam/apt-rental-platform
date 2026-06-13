import { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import Divider from '@/components/display/Divider'

import { Button, Chip, SearchField } from "heroui-native"

import { PERKS } from '@/constants/perks'

import { supabase } from '@repo/supabase'

import Ionicons from '@expo/vector-icons/build/Ionicons'

import { useColors } from '@/hooks/useTheme'

export default function EditPerks() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()
  const router = useRouter()
  const { colors } = useColors()

  const [searchValue, setSearchValue] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    if (!apartmentId) return

    const fetchAmenities = async () => {
      setIsLoading(true)
      setFetchError(false)

      const { data, error } = await supabase
        .from('apartments')
        .select('amenities')
        .eq('id', apartmentId)
        .single()

      if (error) {
        setFetchError(true)
      } else {
        setAmenities(data?.amenities ?? [])
      }

      setIsLoading(false)
    }

    fetchAmenities()
  }, [apartmentId])

  const toggleAmenity = useCallback((perkId: string) => {
    setAmenities((prev) =>
      prev.includes(perkId)
        ? prev.filter((id) => id !== perkId)
        : [...prev, perkId]
    )
  }, [])

  const allPerks = useMemo(() => Object.values(PERKS), [])

  const filteredSelected = useMemo(() => {
    const query = searchValue.toLowerCase().trim()
    return allPerks.filter((perk) => {
      const isSelected = amenities.includes(perk.id)
      const matchesSearch = query === '' || perk.name.toLowerCase().includes(query)
      return isSelected && matchesSearch
    })
  }, [allPerks, amenities, searchValue])

  const filteredUnselected = useMemo(() => {
    const query = searchValue.toLowerCase().trim()
    return allPerks.filter((perk) => {
      const isSelected = amenities.includes(perk.id)
      const matchesSearch = query === '' || perk.name.toLowerCase().includes(query)
      return !isSelected && matchesSearch
    })
  }, [allPerks, amenities, searchValue])

  const handleSave = async () => {
    if (!apartmentId || isSaving) return

    setIsSaving(true)

    const { error } = await supabase
      .from('apartments')
      .update({ amenities, updated_at: new Date().toISOString() })
      .eq('id', apartmentId)

    setIsSaving(false)

    if (error) {
      console.error('Failed to save amenities:', error)
      return
    }

    router.back()
  }

  if (isLoading) {
    return (
      <ScreenWrapper header={<StandardHeader title='Edit Perks' />}>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator color={colors.primary} />
        </View>
      </ScreenWrapper>
    )
  }

  if (fetchError) {
    return (
      <ScreenWrapper header={<StandardHeader title='Edit Perks' />}>
        <View className='flex-1 items-center justify-center px-5'>
          <Text className='text-danger text-sm font-inter text-center'>
            Failed to load amenities. Please try again.
          </Text>
        </View>
      </ScreenWrapper>
    )
  }

  return (
    <ScreenWrapper header={<StandardHeader title='Edit Perks' />}>
      <View className='flex-1'>

        {/* Scrollable content */}
        <ScrollView
          className='flex-1 p-5 pb-20'
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps='handled'
        >
          <SearchField value={searchValue} onChange={setSearchValue}>
            <SearchField.Group className="bg-darkerWhite">
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Search a perk" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>

          {amenities.length === 0 && (
            <Text className='text-danger text-sm font-inter mt-2'>
              Please select at least one amenity.
            </Text>
          )}

          <Divider />

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
                    <Ionicons name='close' size={12} color={colors.textPrimary} />
                  </Chip>
                ))}
              </View>
            </View>
          )}

          {filteredSelected.length > 0 && filteredUnselected.length > 0 && (
            <Divider />
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
                    <Chip.Label className='text-foreground'>
                      {perk.name}
                    </Chip.Label>
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
        </ScrollView>

        <View className='p-5'>
          <Button
            onPress={handleSave}
            isDisabled={amenities.length === 0 || isSaving}
          >
            <Button.Label>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  )
}