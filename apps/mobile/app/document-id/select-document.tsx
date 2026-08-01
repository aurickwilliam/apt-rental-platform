import { View, Text } from 'react-native'
import { useRef } from 'react'
import { useRouter } from 'expo-router'

import { ListGroup, Separator } from 'heroui-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { DOCUMENT_TYPES } from '@repo/constants'

import { useColors } from '@/hooks/useTheme'

export default function SelectDocument() {
  const documentType = useRef('');
  const { colors } = useColors();

  const router = useRouter();

  const handleDocumentTypeSelect = (docType: string) => {
    documentType.current = docType;

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
      <ListGroup className='shadow-none border border-border'>
        {
          DOCUMENT_TYPES.map((docType, index) => (
            <View key={docType}>
              {index > 0 && <Separator className='mx-4' />}

              <ListGroup.Item onPress={() => handleDocumentTypeSelect(docType)}>
                <ListGroup.ItemContent>
                  <ListGroup.ItemTitle className='font-interMedium'>
                    {docType}
                  </ListGroup.ItemTitle>
                </ListGroup.ItemContent>

                <ListGroup.ItemSuffix iconProps={{ size: 20, color: colors.textPrimary }} />
              </ListGroup.Item>
            </View>
          ))
        }
      </ListGroup>

      <View className='mt-5'>
        <Text className='text-gray-500 text-sm font-inter text-center'>
          Make sure your document is clear and not expired.
        </Text>
      </View>
    </ScreenWrapper>
  )
}
