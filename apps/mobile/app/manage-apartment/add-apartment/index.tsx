import { View } from 'react-native'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/display/ApplicationHeader'
import UploadImageField from '@/components/inputs/UploadImageField'
import TextField from '@/components/inputs/TextField'
import PillButton from '@/components/buttons/PillButton'

import { COLORS } from '@repo/constants'
import { useApartmentFormStore } from '@/store/useApartmentFormStore'

interface FormErrors {
  name?: string
  thumbnail?: string
  additionalPhotos?: string
}

const MIN_ADDITIONAL_PHOTOS = 3

export default function Index() {
  const router = useRouter()
  const [errors, setErrors] = useState<FormErrors>({})

  const name = useApartmentFormStore((s) => s.name)
  const thumbnail = useApartmentFormStore((s) => s.thumbnail)
  const additionalPhotos = useApartmentFormStore((s) => s.additionalPhotos)

  const setName = useApartmentFormStore((s) => s.setName)
  const setThumbnail = useApartmentFormStore((s) => s.setThumbnail)
  const addAdditionalPhoto = useApartmentFormStore((s) => s.addAdditionalPhoto)
  const removeAdditionalPhoto = useApartmentFormStore((s) => s.removeAdditionalPhoto)

  const reset = useApartmentFormStore((s) => s.reset)

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validateStep = (): FormErrors => {
    const errs: FormErrors = {}

    if (!name.trim()) errs.name = 'Apartment name is required'
    if (!thumbnail) errs.thumbnail = 'A thumbnail photo is required'
    if (additionalPhotos.length < MIN_ADDITIONAL_PHOTOS)
      errs.additionalPhotos = `At least ${MIN_ADDITIONAL_PHOTOS} additional photos are required (${additionalPhotos.length}/${MIN_ADDITIONAL_PHOTOS} added)`

    return errs
  }

  const handleNext = () => {
    const validationErrors = validateStep()

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors({})
    router.push('/manage-apartment/add-apartment/second-step')
  }

  const handleCancel = () => {
    reset();
    router.back();
  }

  return (
    <ScreenWrapper scrollable backgroundColor={COLORS.darkerWhite}>
      <ApplicationHeader
        currentTitle='Photos & Title'
        nextTitle='Basic Info'
        step={1}
        totalSteps={5}
      />

      <View className='p-5 flex-1'>
        <View className='flex-1 gap-5'>
          <TextField
            label='Apartment Name:'
            required
            placeholder='Enter apartment name'
            value={name}
            error={errors.name}
            onChangeText={(value) => {
              setName(value)
              clearError('name')
            }}
          />

          <UploadImageField
            label='Add a Thumbnail:'
            required
            single
            images={thumbnail ? [thumbnail] : []}
            error={errors.thumbnail}
            onAdd={(image) => {
              setThumbnail(image)
              clearError('thumbnail')
            }}
            onRemove={() => setThumbnail(null)}
          />

          <UploadImageField
            label='Add Additional Photos:'
            required
            images={additionalPhotos}
            error={errors.additionalPhotos}
            onAdd={(image) => {
              addAdditionalPhoto(image)
              const newCount = additionalPhotos.length + 1
              if (newCount >= MIN_ADDITIONAL_PHOTOS) {
                clearError('additionalPhotos')
              } else if (errors.additionalPhotos) {
                setErrors((prev) => ({
                  ...prev,
                  additionalPhotos: `At least ${MIN_ADDITIONAL_PHOTOS} additional photos are required (${newCount}/${MIN_ADDITIONAL_PHOTOS} added)`,
                }))
              }
            }}
            onRemove={(uri) => {
              removeAdditionalPhoto(uri)
              // Re-validate count after removal
              if (additionalPhotos.length - 1 < MIN_ADDITIONAL_PHOTOS) {
                setErrors((prev) => ({
                  ...prev,
                  additionalPhotos: `At least ${MIN_ADDITIONAL_PHOTOS} additional photos are required`,
                }))
              }
            }}
          />
        </View>

        <View className='flex-row mt-16 gap-4'>
          <View className='flex-1'>
            <PillButton
              label='Cancel'
              type='danger'
              isFullWidth
              onPress={handleCancel}
            />
          </View>
          <View className='flex-1'>
            <PillButton
              label='Next'
              isFullWidth
              onPress={handleNext}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}