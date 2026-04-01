import { View } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/display/ApplicationHeader'
import UploadImageField from '@/components/inputs/UploadImageField'
import TextField from '@/components/inputs/TextField'
import PillButton from '@/components/buttons/PillButton'

import { COLORS } from '@repo/constants'

import { useApartmentFormStore } from '@/store/useApartmentFormStore'

export default function Index() {
  const router = useRouter()

  const name = useApartmentFormStore((s) => s.name)
  const thumbnail = useApartmentFormStore((s) => s.thumbnail)
  const additionalPhotos = useApartmentFormStore((s) => s.additionalPhotos)

  const setName = useApartmentFormStore((s) => s.setName)
  const setThumbnail = useApartmentFormStore((s) => s.setThumbnail)
  const addAdditionalPhoto = useApartmentFormStore((s) => s.addAdditionalPhoto)
  const removeAdditionalPhoto = useApartmentFormStore((s) => s.removeAdditionalPhoto)

  const canProceed = name.trim().length > 0 && thumbnail !== null

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
            onChangeText={setName}
          />

          <UploadImageField
            label='Add a Thumbnail:'
            required
            single                              
            images={thumbnail ? [thumbnail] : []}
            onAdd={setThumbnail}
            onRemove={() => setThumbnail(null)}
          />

          <UploadImageField
            label='Add Additional Photos:'
            required
            images={additionalPhotos}
            onAdd={addAdditionalPhoto}
            onRemove={removeAdditionalPhoto}
          />
        </View>

        <View className='flex-row mt-16 gap-4'>
          <View className='flex-1'>
            <PillButton
              label='Cancel'
              type='danger'
              isFullWidth
              onPress={() => router.back()}
            />
          </View>
          <View className='flex-1'>
            <PillButton
              label='Next'
              isFullWidth
              isDisabled={!canProceed}
              onPress={() => router.push('/manage-apartment/add-apartment/second-step')}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}