import { useState, useEffect, useMemo, useCallback } from 'react'
import { View, Text, ScrollView, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import SearchField from '@/components/inputs/SearchField'
import Divider from '@/components/display/Divider'
import PerkButton from '../../components/PerkButton'
import PillButton from '@/components/buttons/PillButton'

import { COLORS } from '@repo/constants'
import { PERKS } from '@/constants/perks'
import { supabase } from '@repo/supabase'

export default function EditPerks() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()
  const router = useRouter()

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
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    )
  }

  if (fetchError) {
    return (
      <ScreenWrapper header={<StandardHeader title='Edit Perks' />}>
        <View className='flex-1 items-center justify-center px-5'>
          <Text className='text-red-500 text-sm font-inter text-center'>
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
          <SearchField
            searchPlaceholder='Search a perk'
            onChangeSearch={setSearchValue}
            searchValue={searchValue}
            backgroundColor={COLORS.darkerWhite}
          />

          {amenities.length === 0 && (
            <Text className='text-red-500 text-sm font-inter mt-2'>
              Please select at least one amenity.
            </Text>
          )}

          <Divider />

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
        </ScrollView>

        <View className='p-5 border-t border-gray-100 bg-white'>
          <PillButton
            label={isSaving ? 'Saving…' : 'Save Changes'}
            onPress={handleSave}
            isDisabled={amenities.length === 0 || isSaving}
          />
        </View>

      </View>
    </ScreenWrapper>
  )
}