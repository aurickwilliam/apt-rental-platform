import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'

import { 
  Button,
} from 'heroui-native';

import { useColors } from '@/hooks/useTheme';

export default function ThirdProcess() {
  const { colors } = useColors();
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  return (
    <ScreenWrapper
      scrollable
    >
      <ApplicationHeader
        currentTitle="Upload Required Documents"
        nextTitle="Review Application"
        step={3}
      />

      <View className='p-5'>
        <View className='flex gap-3'>
          {/* <UploadImageField
            label="Valid Government-issued ID:"
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
            required
          />

          <UploadGeneralFile
            label="Birth Certificate:"
            placeholder="Select files"
            onChange={(uri) => console.log(uri)}
            required
          /> */}
        </View>

        {/* Back or Next Button */}
        <View className='flex-1 flex-row mt-16 gap-4'>
          <Button 
            onPress={() => router.back()} 
            variant='danger-soft'
            className="flex-1"
          >
            <Button.Label>
              Cancel
            </Button.Label>
          </Button>

          <Button 
            onPress={() => {
              router.push(`/apartment/${apartmentId}/apply/review-information`);
            }}
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
