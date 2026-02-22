import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from 'components/display/ApplicationHeader'
import UploadImageField from 'components/inputs/UploadImageField'
import UploadGeneralFile from 'components/inputs/UploadGeneralFileField'
import PillButton from 'components/buttons/PillButton'

import { COLORS } from '@repo/constants'

export default function ThirdProcess() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  return (
    <ScreenWrapper
      scrollable
      bottomPadding={50}
      backgroundColor={COLORS.darkerWhite}
    >
      <ApplicationHeader
        currentTitle="Upload Required Documents"
        nextTitle="Review Application"
        step={3}
      />

      <View className='p-5'>
        <View className='flex gap-3'>
          <UploadImageField
            label="Valid Government-issued ID:"
            placeholder="Select files"
            onChange={(uri) => console.log(uri)}
            value=""
            required
          />

          <UploadGeneralFile
            label="Proof of Income:"
            placeholder="Select files"
            onChange={(uri) => console.log(uri)}
            required
          />

          <UploadImageField
            label="NBI Clearance:"
            placeholder="Select files"
            onChange={(uri) => console.log(uri)}
            value=""
            required
          />

          <UploadGeneralFile
            label="Birth Certificate:"
            placeholder="Select files"
            onChange={(uri) => console.log(uri)}
            required
          />
        </View>

        {/* Back or Next Button */}
        <View className='flex-1 flex-row mt-16 gap-4'>
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
              onPress={() => {
                router.push(`/apartment/${apartmentId}/apply/review-information`);
              }}
            />
          </View>
        </View>
      </View>
    </ScreenWrapper>
  )
}
