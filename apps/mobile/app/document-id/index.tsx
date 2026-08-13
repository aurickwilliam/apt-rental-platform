import { View, Text, TouchableOpacity, Image as RNImage, Linking } from 'react-native'
import { Image } from 'expo-image'
import ImageViewing from 'react-native-image-viewing'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import { Button, Chip, Separator } from 'heroui-native'

import {
  IconFileUpload,
  IconPlus,
  IconShieldCheck,
} from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DocumentCard from './components/DocumentCard'

import { SAMPLE_IMAGES } from '@/constants/images'

import { useColors } from '@/hooks/useTheme'

import { isImageUri } from './utils/fileType'

type UploadedDocument = {
  id: number;
  type: string;
  filePath: string;
}

export default function Index() {
  const router = useRouter();
  const { colors } = useColors();

  const [isIdVisible, setIsIdVisible] = useState<boolean>(false);
  const [selectedDocUri, setSelectedDocUri] = useState<string | null>(null);

  // TODO: Fetch and display user's uploaded documents and IDs here. This may include government-issued IDs, proof of income, or any other relevant documents required for the rental application process. Each document can be displayed with its name, type, and upload date, along with options to view or delete the document.

  // Dummy data for testing
  const uploadedDocuments: UploadedDocument[] = [
    {
      id: 1,
      type: 'Proof of Income',
      filePath: RNImage.resolveAssetSource(SAMPLE_IMAGES.sampleProofOfIncome).uri,
    },
    {
      id: 2,
      type: 'Proof of Residency',
      filePath: RNImage.resolveAssetSource(SAMPLE_IMAGES.sampleProofOfResidency).uri,
    },
    {
      id: 3,
      type: 'Birth Certificate',
      filePath: RNImage.resolveAssetSource(SAMPLE_IMAGES.sampleBirthCertificate).uri,
    }
  ]

  const mainValidId = {
    id: 67,
    type: 'National ID',
    image: RNImage.resolveAssetSource(SAMPLE_IMAGES.sampleNationalID).uri,
  }

  const hasDocuments = uploadedDocuments.length > 0

  const handleDocumentPress = (filePath: string) => {
    if (isImageUri(filePath)) {
      setSelectedDocUri(filePath);
    } else {
      Linking.openURL(filePath);
    }
  };

  return (
    <ScreenWrapper
      header={
        <StandardHeader
          title='Document & IDs'
          onBackPress={() => router.replace('/(tabs)/(tenant)/profile')}
          rightComponent={
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push('/document-id/select-document')}
            >
              <IconPlus size={24} color='#FFFFFF' />
            </TouchableOpacity>
          }
        />
      }
      className='p-5'
      scrollable
      noBottomPadding
    >
      {/* User ID upon account validation */}
      <View className='gap-3'>
        <View className='flex-row items-center justify-between gap-3'>
          <View className='flex-1 gap-0.5'>
            <Text className='text-foreground text-lg font-interSemiBold'>
              Valid ID / Government ID
            </Text>
            <Text className='text-muted text-sm font-inter'>
              {mainValidId.type}
            </Text>
          </View>

          <Chip variant="secondary" color="success" size="sm">
            <IconShieldCheck size={14} color={colors.success} />
            <Chip.Label className='text-success font-interMedium'>
              Verified
            </Chip.Label>
          </Chip>
        </View>

        <TouchableOpacity
          className='bg-surface border border-border rounded-3xl shadow-none overflow-hidden'
          activeOpacity={0.7}
          onPress={() => setIsIdVisible(!isIdVisible)}
        >
          <View className='w-full bg-gray-100'>
            <Image
              source={{ uri: mainValidId.image }}
              style={{ width: '100%', aspectRatio: 16 / 9 }}
              contentFit='contain'
              cachePolicy='disk'
              transition={150}
            />
          </View>
        </TouchableOpacity>
      </View>

      <Separator className='my-3'/>

      {!hasDocuments ? (
        <View className='flex-1 items-center gap-4 pt-16 px-4'>
          <IconFileUpload size={64} color={colors.primary} />
          <Text className='text-foreground text-xl font-interSemiBold text-center'>
            No documents yet
          </Text>
          <Text className='text-gray-400 text-base font-inter text-center px-8 leading-relaxed'>
            Add your IDs and supporting documents so they&apos;re ready when you apply for an apartment.
          </Text>

          <Button
            size='lg'
            onPress={() => router.push('/document-id/select-document')}
          >
            <IconPlus size={20} color='#FFFFFF' />
            <Button.Label className='text-white font-interSemiBold'>
              Add a Document
            </Button.Label>
          </Button>

          {/* Info card */}
          <View className='mt-8 w-full bg-surface border border-border rounded-3xl p-4 gap-3'>
            <View className='flex-row gap-3'>
              <View className='size-11 rounded-2xl bg-primary-light items-center justify-center'>
                <IconFileUpload size={22} color={colors.primary} />
              </View>

              <View className='flex-1 gap-1'>
                <Text className='text-foreground text-base font-interMedium leading-snug'>
                  Uploading your documents early allows for faster and easier submission when applying for rentals.
                </Text>
                <Text className='text-muted text-sm font-inter leading-snug'>
                  Note: Uploaded documents will be securely stored and only shared with landlords during the application process.
                </Text>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <>
          <Text className='text-foreground text-lg font-interSemiBold mb-3'>
            Uploaded Documents
          </Text>

          <View className='flex-row flex-wrap gap-x-4 gap-y-5'>
            {
              uploadedDocuments.map(doc => (
                <DocumentCard
                  key={doc.id}
                  filePath={doc.filePath}
                  label={doc.type}
                  onPress={() => handleDocumentPress(doc.filePath)}
                />
              ))
            }
          </View>
        </>
      )}

      {/* Need help */}
      <View className='w-full items-center justify-center py-10'>
        <Text className='text-foreground text-base font-interMedium'>
          Need help?
        </Text>
        {
          // TODO: Implement contact support functionality,
          // such as opening a chat with customer support or
          // redirecting to a help center page.
        }
        <TouchableOpacity
          className='flex-row items-center justify-center mt-1'
          activeOpacity={0.7}
        >
          <Text className='text-accent text-base font-interMedium'>
            Contact Support
          </Text>
        </TouchableOpacity>
      </View>

      <ImageViewing
        images={[{ uri: mainValidId.image }]}
        imageIndex={0}
        visible={isIdVisible}
        onRequestClose={() => setIsIdVisible(false)}
        presentationStyle='overFullScreen'
        backgroundColor='rgb(0, 0, 0, 0.8)'
      />

      <ImageViewing
        images={selectedDocUri ? [{ uri: selectedDocUri }] : []}
        imageIndex={0}
        visible={!!selectedDocUri}
        onRequestClose={() => setSelectedDocUri(null)}
        presentationStyle='overFullScreen'
        backgroundColor='rgb(0, 0, 0, 0.8)'
      />
    </ScreenWrapper>
  )
}
