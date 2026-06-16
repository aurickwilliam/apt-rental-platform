import { useState } from 'react'
import { View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'

import ScreenWrapper from 'components/layout/ScreenWrapper'
import ApplicationHeader from '@/components/layout/ApplicationHeader'

import {
  Button,
} from 'heroui-native';

import { useColors } from '@/hooks/useTheme';
import UploadImageField from '@/components/inputs/UploadImageField';
import UploadFileField from '@/components/inputs/UploadFileField';

export default function ThirdProcess() {
  const { colors } = useColors();
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>();

  // Government ID (single image)
  const [govId, setGovId] = useState<ImagePicker.ImagePickerAsset[]>([]);

  // Proof of Income (file)
  const [proofOfIncome, setProofOfIncome] = useState<string>('');

  // Proof of Billing (file)
  const [proofOfBilling, setProofOfBilling] = useState<ImagePicker.ImagePickerAsset[]>([])

  // NBI Clearance (single image, optional)
  const [nbiClearance, setNbiClearance] = useState<string>('')

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
            label="Valid Government-issued ID:"
            required
            single
            images={govId}
            onAdd={(asset) =>
              setGovId(Array.isArray(asset) ? asset : [asset])
            }
            onRemove={() => setGovId([])}
          />

          <UploadFileField
            label="Proof of Income:"
            placeholder="Upload COE, payslip, or ITR"
            onChange={(uri) => setProofOfIncome(uri)}
            value={proofOfIncome}
            required
          />

          <UploadImageField
            label="Proof of Billing:"
            required
            single
            images={proofOfBilling}
            onAdd={(asset) =>
              setProofOfBilling(Array.isArray(asset) ? asset : [asset])
            }
            onRemove={() => setProofOfBilling([])}
          />

          <UploadFileField
            label="NBI Clearance:"
            placeholder="Upload your NBI clearance"
            onChange={(uri) => setNbiClearance(uri)}
            value={nbiClearance}
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