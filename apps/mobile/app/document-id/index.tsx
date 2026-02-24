import { View, Text, Image, TouchableOpacity } from 'react-native'
import ImageViewing from 'react-native-image-viewing'
import { useRouter } from 'expo-router'
import { useState } from 'react'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PillButton from '@/components/buttons/PillButton'
import DocumentCard from '@/components/display/DocumentCard'

import { SAMPLE_IMAGES } from '@/constants/images'
import { COLORS } from '@repo/constants'

import { IconHomeQuestion } from '@tabler/icons-react-native'

type UploadedDocument = {
  id: number;
  type: string;
  image: string; 
}

export default function Index() {
  const router = useRouter();

  const [isIdVisible, setIsIdVisible] = useState<boolean>(false);

  // TODO: Fetch and display user's uploaded documents and IDs here. This may include government-issued IDs, proof of income, or any other relevant documents required for the rental application process. Each document can be displayed with its name, type, and upload date, along with options to view or delete the document.

  // Dummy data for testing
  const uploadedDocuments: UploadedDocument[] = [
    {
      id: 1,
      type: 'Proof of Income',
      image: Image.resolveAssetSource(SAMPLE_IMAGES.sampleProofOfIncome).uri,
    },
    {
      id: 2,
      type: 'Proof of Residency',
      image: Image.resolveAssetSource(SAMPLE_IMAGES.sampleProofOfResidency).uri,
    },
    {
      id: 3,
      type: 'Birth Certificate',
      image: Image.resolveAssetSource(SAMPLE_IMAGES.sampleBirthCertificate).uri,
    }
  ]

  const mainValidId = {
    id: 67,
    type: 'National ID',
    image: Image.resolveAssetSource(SAMPLE_IMAGES.sampleNationalID).uri,
  }

  // uploadedDocuments.pop();
  // uploadedDocuments.pop();
  // uploadedDocuments.pop();

  return (
    <ScreenWrapper
      header={
        <StandardHeader 
          title='Document & IDs' 
          onBackPress={() => router.replace('/(tabs)/(tenant)/profile')}
        />
      }
      className='p-5'
      scrollable
    >
      {/* User ID upon account validation */}
      <View>
        <View className='flex gap-1'>
          <Text className='text-text text-xl font-poppinsMedium'>
            Valid ID/Government ID
          </Text>
          <Text className='text-grey-500 text-lg font-inter'>
            {mainValidId.type}
          </Text>
        </View>

        <TouchableOpacity
          className='w-full h-72 mt-3 border-2 border-primary rounded-2xl'
          activeOpacity={0.7}
          onPress={() => setIsIdVisible(!isIdVisible)}
        >
          <Image 
            source={{ uri: mainValidId.image }}
            style={{
              width: '100%',
              height: '100%',
            }}
            resizeMode='cover'
          />
        </TouchableOpacity>
      </View>

      {
        uploadedDocuments.length <= 0 ? (
          <>
            <View>
              <Text className='text-text text-xl font-poppinsMedium mt-5 mb-3'>
                Other Documents
              </Text>

              <View>
                <Text className='text-text text-base font-interMedium'>
                  Upload additional documents such as:
                </Text>
                <Text className='text-text text-base font-inter mt-1'>
                  - Proof of Income (e.g., payslips, bank statements)
                </Text>
                <Text className='text-text text-base font-inter mt-1'>
                  - Proof of Residency (e.g., utility bills, lease agreements)
                </Text>
                <Text className='text-text text-base font-inter mt-1'>
                  - Birth Certificate (if applicable)
                </Text>
              </View>

              <View className='mt-5 flex gap-3'>
                <Text className='text-text text-base font-interMedium'>
                  Uploading your documents early allows for faster and easier submission when applying for rentals.
                </Text>
                <Text className='text-text text-base font-interMedium'>
                  Note: Uploaded documents will be securely stored and only shared with landlords during the application process.
                </Text>

                <PillButton 
                  label='Add a Document'
                  size='sm'
                  onPress={() => {
                    router.push('/document-id/select-document')
                  }}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            <Text className='text-text text-xl font-poppinsMedium mt-8 mb-3'>
              Uploaded Documents
            </Text>

            <View className='flex-row flex-wrap gap-4 gap-y-5 mb-10'>
              {
                uploadedDocuments.map(doc => (
                  <DocumentCard 
                    key={doc.id}
                    image={doc.image}
                    label={doc.type}
                    onPress={() => router.push(`/document-id/details?docImage=${doc.image}&docType=${doc.type}`)}
                  />
                ))
              }
            </View>
          </>
        )
      }

      <View className='flex-1'/>

      <View className='w-full flex items-center justify-center h-20 '>
        <Text className='text-text text-base font-interMedium'>
          Need help?
        </Text>
        {
          // TODO: Implement contact support functionality, such as opening a chat with customer support or redirecting to a help center page.
        }
        <TouchableOpacity 
          className='flex-row gap-1 items-center justify-center'
          activeOpacity={0.7}
        >
          <IconHomeQuestion 
            size={20} 
            color={COLORS.primary} 
          />
          <Text className='text-primary text-base font-interMedium'>
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
    </ScreenWrapper>
  )
}