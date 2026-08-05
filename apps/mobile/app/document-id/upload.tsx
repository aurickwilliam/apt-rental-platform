import { View, Text } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'

import { Button, Checkbox, ControlField, Label, Separator } from 'heroui-native'

import { IconFileInfo } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import UploadImageField from '@/components/inputs/UploadImageField'
import UploadFileField from '@/components/inputs/UploadFileField'

import { useColors } from '@/hooks/useTheme'

export default function Upload() {
  const { docType } = useLocalSearchParams();
  const { colors } = useColors();
  const router = useRouter();

  const [isVerified, setIsVerified] = useState(false);
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

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
        <Text className='text-secondary text-2xl font-nunitoSemiBold'>
          {docType}
        </Text>

        <View className='flex-row items-center gap-1.5'>
          <IconFileInfo size={16} color={colors.gray400} />
          <Text className='text-gray-500 text-sm font-inter'>
            Accepted formats: JPG, PNG, or PDF (max 5MB each)
          </Text>
        </View>
      </View>

      {/* Upload fields */}
      <View className='mt-6 flex gap-6'>
        <UploadImageField
          label='Document Image'
          required
          single
          images={images}
          onAdd={(asset) => setImages(Array.isArray(asset) ? asset : [asset])}
          onRemove={(uri) => setImages((prev) => prev.filter((item) => item.uri !== uri))}
        />

        <Separator />

        <UploadFileField
          label='Document File'
          placeholder='Upload a PDF'
          value={file}
          onChange={setFile}
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
            <Label.Text className='text-base text-foreground font-interMedium leading-snug'>
              I confirm that the information provided is true and the ID belongs to me.
            </Label.Text>
          </Label>
        </ControlField>

        <Text className='text-sm text-gray-500 font-inter leading-relaxed'>
          <Text className='text-danger'>*</Text> By uploading your documents, you certify that all information is true and valid. Any fraudulent or falsified documents may result in account suspension and legal action in accordance applicable Philippine laws on fraud and identity theft, including the Cybercrime Prevention Act (Republic Act No. 10175).
        </Text>
      </View>

      <View className='flex-1' />

      <Button
        className='mt-8'
        isDisabled={!isVerified}
        onPress={handleAddDocument}
      >
        <Button.Label className='text-white font-interSemiBold'>
          Add Document
        </Button.Label>
      </Button>
    </ScreenWrapper>
  )
}