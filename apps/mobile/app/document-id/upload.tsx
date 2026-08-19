import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'

import { Accordion, Button, Checkbox, ControlField, Label } from 'heroui-native'

import { IconFileInfo } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import UploadDocumentField, {
  type UploadedDocument,
} from '@/components/inputs/UploadDocumentField'

import { useColors } from '@/hooks/useTheme'

export default function Upload() {
  const { docType } = useLocalSearchParams();
  const { colors } = useColors();
  const router = useRouter();

  const [isVerified, setIsVerified] = useState(false);
  const [document, setDocument] = useState<UploadedDocument | null>(null);

  const handleAddDocument = () => {
    // TODO: Persist the uploaded document to Supabase Storage and store its
    // storage path in the database, then refresh the documents list.
    router.replace('/document-id');
  }

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Upload Document' />
      }
      className='p-5'
    >
      <View className='flex gap-1.5'>
        {/* Name of Document */}
        <Text className='text-accent text-2xl font-nunitoBold'>
          {docType}
        </Text>

        <View className='flex-row items-center gap-1.5'>
          <IconFileInfo size={16} color={colors.gray400} />
          <Text className='text-gray-500 text-sm font-inter'>
            Accepted formats: JPG, PNG, or PDF (max 5MB each)
          </Text>
        </View>
      </View>

      {/* Upload field */}
      <View className='mt-6'>
        <UploadDocumentField
          label='Document'
          required
          value={document}
          onChange={setDocument}
        />
      </View>

      {/* Verification */}
      <View className='mt-8 flex gap-4'>
        <ControlField
          isSelected={isVerified}
          onSelectedChange={() => setIsVerified(!isVerified)}
        >
          <ControlField.Indicator>
            <Checkbox className='size-5 border border-border shadow-none' />
          </ControlField.Indicator>

          <Label>
            <Label.Text className='text-sm text-foreground font-nunitoSemiBold leading-snug'>
              I confirm that the information provided is true and the ID belongs to me.
            </Label.Text>
          </Label>
        </ControlField>

        <View className='flex'>
          <Text className='text-sm text-gray-500 font-inter leading-relaxed'>
            <Text className='text-danger'>*</Text> By uploading, you confirm this document is valid and belongs to you. Fraudulent documents may lead to account suspension.
          </Text>

          <Accordion>
            <Accordion.Item value='legal-notice'>
              <Accordion.Trigger className='self-start'>
                <Accordion.Indicator />
                <Text className='text-sm text-gray-500 font-inter underline'>
                  Legal notice
                </Text>
              </Accordion.Trigger>
              <Accordion.Content>
                <Text className='text-sm text-gray-500 font-inter leading-relaxed'>
                  By uploading your documents, you certify that all information is true and valid. Any fraudulent or falsified documents may result in account suspension and legal action in accordance with applicable Philippine laws on fraud and identity theft, including the Cybercrime Prevention Act (Republic Act No. 10175).
                </Text>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </View>
      </View>

      <View className='flex-1' />

      <Button
        className='mt-8'
        isDisabled={!isVerified}
        onPress={handleAddDocument}
      >
        <Button.Label className='text-white font-nunitoSemiBold'>
          Add Document
        </Button.Label>
      </Button>
    </ScreenWrapper>
  )
}
