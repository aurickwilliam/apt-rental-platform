import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'
import UploadImageField from '@/components/inputs/UploadImageField';
import UploadFileField from '@/components/inputs/UploadFileField';

import {
  Button,
} from 'heroui-native';

import { useColors } from '@/hooks/useTheme';

import { useApplicationFormStore } from '@/stores/useApplicationFormStore'

export default function ThirdProcess() {
  const { colors } = useColors();
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  const { 
    documents, 
    updateImageDocument, 
    updateFileDocument 
  } = useApplicationFormStore()

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
          <UploadImageField
            images={documents.govId}
            onAdd={(asset) => updateImageDocument('govId', Array.isArray(asset) ? asset : [asset])}
            onRemove={(uri) => updateImageDocument('govId', documents.govId.filter(i => i.uri !== uri))}
            required single label="Valid Government-issued ID:"
          />

          <UploadFileField
            label="Proof of Income:"
            placeholder="Upload COE, payslip, or ITR"
            value={documents.proofOfIncome}
            onChange={(asset) => updateFileDocument('proofOfIncome', asset)}
            required
          />

          <UploadImageField
            images={documents.proofOfBilling}
            onAdd={(asset) => updateImageDocument('proofOfBilling', Array.isArray(asset) ? asset : [asset])}
            onRemove={(uri) => updateImageDocument('proofOfBilling', documents.proofOfBilling.filter(i => i.uri !== uri))}
            required single label="Proof of Billing:"
          />

          <UploadFileField
            label="NBI Clearance:"
            placeholder="Upload your NBI clearance"
            value={documents.nbiClearance}
            onChange={(asset) => updateFileDocument('nbiClearance', asset)}
          />
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