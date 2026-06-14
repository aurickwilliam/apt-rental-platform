import { useState } from 'react'
import { View, Text } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/app/manage-apartment/add-apartment/components/ApplicationHeader'
import PerkButton from '../components/PerkButton'

import { TextField, Label, TextArea, FieldError, Button, Chip } from 'heroui-native'

import { COLORS } from '@repo/constants'
import { useApartmentFormStore } from '@/stores/useApartmentFormStore'
import { PERKS } from '@/constants/perks'

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
        <TextField
          isRequired
          isInvalid={!!errors.description}
        >
          <Label>Apartment Description:</Label>
          <TextArea
            placeholder='Write a detailed description of the apartment, including its features, amenities, and any other relevant information that would attract potential renters.'
            value={description}
            onChangeText={(text) => {
              setDescription(text)
              if (errors.description) setErrors((e) => ({ ...e, description: undefined }))
            }}
            className='h-50'
          />
          {errors.description && <FieldError>{errors.description}</FieldError>}
        </TextField>

        {/* Amenities Section */}
        <View className='mt-5 flex gap-3'>
          <View>
            <Text className='text-text text-xl font-interSemiBold'>
              Add Included Perks & Amenities
            </Text>
            <Text className='text-text text-base font-inter'>
              Highlight features that make this property stand out
            </Text>
          </View>

          {/* Selected amenities preview */}
          {amenities.length > 0 ? (
            <View className='flex-row flex-wrap gap-3'>
              {amenities.map((perkId) => {
                const perk = PERKS[perkId]
                if (!perk) return null
                return (
                  <Chip
                    key={perkId}
                    variant='secondary'
                    color='accent'
                    onPress={() => router.push('/manage-apartment/add-apartment/amenities')}
                  >
                    <perk.icon size={16} color={COLORS.primary} />
                    <Chip.Label>{perk.name}</Chip.Label>
                  </Chip>
                )
              })}
            </View>
          ) : (
            errors.amenities && (
              <Text className='text-red-500 text-sm font-inter'>
                {errors.amenities}
              </Text>
            )
          )}
          
          <Button
            size='sm'
            variant='tertiary'
            onPress={() => router.push('/manage-apartment/add-apartment/amenities')}
          >
            <Button.Label>
              {amenities.length > 0 ? `Edit Amenities (${amenities.length})` : 'Add Amenities'}
            </Button.Label>
          </Button>
        </View>

        {/* Back or Next Button */}
        <View className='flex-row mt-auto pt-10 gap-4'>
          <Button
            variant="outline"
            onPress={() => router.back()}
            className="flex-1"
          >
            <Button.Label>
              Back
            </Button.Label>
          </Button>

          <Button
            onPress={handleNext}
            className="flex-1"
          >
            <Button.Label>
              Next
            </Button.Label>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  )
}