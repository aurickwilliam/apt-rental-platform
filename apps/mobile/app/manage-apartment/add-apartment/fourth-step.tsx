import { useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from './components/ApplicationHeader'
import TextBox from '@/components/inputs/TextBox'
import PillButton from '@/components/buttons/PillButton'
import PerkButton from '../components/PerkButton'

import { COLORS } from '@repo/constants'
import { useApartmentFormStore } from '@/store/useApartmentFormStore'

export default function FourthStep() {
  const router = useRouter()

  const description = useApartmentFormStore((s) => s.description)
  const setDescription = useApartmentFormStore((s) => s.setDescription)
  const amenities = useApartmentFormStore((s) => s.amenities)

  const [errors, setErrors] = useState<{ description?: string; amenities?: string }>({})

  const validate = () => {
    const newErrors: typeof errors = {}

    if (!description.trim()) {
      newErrors.description = 'Apartment description is required.'
    }

    if (amenities.length === 0) {
      newErrors.amenities = 'Please add at least one amenity.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validate()) return
    router.push('/manage-apartment/add-apartment/fifth-step')
  }

  return (
    <ScreenWrapper
      scrollable
      backgroundColor={COLORS.darkerWhite}
    >
      <ApplicationHeader
        currentTitle={'Description & Amenities'}
        nextTitle={'Preview & Publish'}
        step={4}
        totalSteps={5}
      />

      <View className='p-5 flex-1'>
        {/* Description Field */}
        <TextBox
          label='Apartment Description:'
          required
          placeholder='Write a detailed description of the apartment, including its features, amenities, and any other relevant information that would attract potential renters.'
          boxHeight={200}
          value={description}
          onChangeText={(text) => {
            setDescription(text)
            if (errors.description) setErrors((e) => ({ ...e, description: undefined }))
          }}
        />
        {errors.description && (
          <Text className='text-red-500 text-sm font-inter mt-1'>
            {errors.description}
          </Text>
        )}

        {/* Amenities Section */}
        <View className='mt-5 flex gap-3'>
          <View>
            <Text className='text-text text-xl font-poppinsMedium'>
              Add Included Perks & Amenities
            </Text>
            <Text className='text-text text-base font-inter'>
              Highlight features that make this property stand out
            </Text>
          </View>

          {/* Selected amenities preview */}
          {amenities.length > 0 ? (
            <View className='flex-row flex-wrap gap-3'>
              {amenities.map((perkId) => (
                <PerkButton
                  key={perkId}
                  perkId={perkId}
                  isSelected
                  // Tapping opens the amenities editor for quick edits
                  onPress={() => router.push('/manage-apartment/add-apartment/amenities')}
                />
              ))}
            </View>
          ) : (
            errors.amenities && (
              <Text className='text-red-500 text-sm font-inter'>
                {errors.amenities}
              </Text>
            )
          )}

          <PillButton
            label={amenities.length > 0 ? `Edit Amenities (${amenities.length})` : 'Add Amenities'}
            size='sm'
            type='outline'
            onPress={() => router.push('/manage-apartment/add-apartment/amenities')}
          />
        </View>

        {/* Back or Next Button */}
        <View className='flex-row mt-auto pt-10 gap-4'>
          <View className='flex-1'>
            <PillButton
              label={'Back'}
              type='outline'
              isFullWidth
              onPress={() => router.back()}
            />
          </View>
          <View className='flex-1'>
            <PillButton
              label={'Next'}
              isFullWidth
              onPress={handleNext}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}