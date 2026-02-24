import { View, Text, Image, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import PillButton from '@/components/buttons/PillButton'

import { SAMPLE_IMAGES } from '@/constants/images'

import { IconHomeQuestion } from '@tabler/icons-react-native'
import { COLORS } from '@repo/constants'
import DocumentCard from '@/components/display/DocumentCard'

export default function Index() {
  const router = useRouter();

  // TODO: Fetch and display user's uploaded documents and IDs here. This may include government-issued IDs, proof of income, or any other relevant documents required for the rental application process. Each document can be displayed with its name, type, and upload date, along with options to view or delete the document.

  // Dummy data for testing
  const uploadedDocuments = [
    {
      id: 1,
      type: 'Proof of Income',
      image: SAMPLE_IMAGES.sampleProofOfIncome,
    },
    {
      id: 2,
      type: 'Proof of Residency',
      image: SAMPLE_IMAGES.sampleProofOfResidency,
    },
    {
      id: 3,
      type: 'Birth Certificate',
      image: SAMPLE_IMAGES.sampleBirthCertificate,
    }
  ]

  const mainValidId = {
    id: 67,
    type: 'National ID',
    image: SAMPLE_IMAGES.sampleNationalID,
  }

  uploadedDocuments.pop();
  uploadedDocuments.pop();
  uploadedDocuments.pop();

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
        >
          <Image 
            source={mainValidId.image}
            style={{
              width: '100%',
              height: '100%',
            }}
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

            <View className='flex-row flex-wrap gap-2 gap-y-5 mb-10'>
              {
                uploadedDocuments.map(doc => (
                  <DocumentCard 
                    key={doc.id}
                    image={doc.image}
                    label={doc.type}
                    onPress={() => router.push(`/document-id/details?docId=${doc.id}`)}
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
    </ScreenWrapper>
  )
}