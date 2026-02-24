import { View, Text } from 'react-native'
import { useRef } from 'react'
import { useRouter } from 'expo-router'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import OptionButton from '@/components/buttons/OptionButton'

import { DOCUMENT_TYPES } from '@repo/constants'

export default function SelectDocument() {
  const documentType = useRef('');

  const router = useRouter();

  const handleDocumentTypeSelect = (docType: string) => {
    documentType.current = docType;
    console.log('====================================');
    console.log(documentType.current);
    console.log('====================================');

    router.push(`/document-id/upload?docType=${documentType.current}`);
  }

  return (
    <ScreenWrapper
      scrollable
      header={
        <StandardHeader title='Select Document Type' />
      }
      className='p-5'
    >
      <View className='flex gap-3'>
        {
          DOCUMENT_TYPES.map((docType) => (
            <OptionButton
              key={docType}
              title={docType}
              onPress={() => handleDocumentTypeSelect(docType)}
            />
          ))
        }
      </View>

      <View className='mt-5'>
        <Text className='text-grey-500 text-sm font-inter text-center'>
          Make sure your document is clear and not expired.
        </Text>
      </View>
    </ScreenWrapper>
  )
}