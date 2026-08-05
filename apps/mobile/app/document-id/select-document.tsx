import { View, Text } from 'react-native'
import { useRef } from 'react'
import { useRouter } from 'expo-router'

import { ListGroup, Separator } from 'heroui-native'

import {
  IconAddressBook,
  IconBriefcase2,
  IconCertificate,
  IconFingerprint,
  IconFileCertificate,
  IconId,
  IconLicense,
  IconProps,
} from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'

import { DOCUMENT_TYPES } from '@repo/constants'

import { useColors } from '@/hooks/useTheme'

const DOCUMENT_TYPE_ICONS: Record<string, React.ComponentType<IconProps>> = {
  'Proof of Income': IconBriefcase2,
  'Proof of Residency': IconAddressBook,
  'Birth Certificate': IconCertificate,
  'National ID': IconId,
  'NBI Clearance': IconFingerprint,
  'Certificate of Employment': IconFileCertificate,
  'Business Permit': IconLicense,
}

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
      <Text className='text-foreground text-sm font-interMedium leading-relaxed'>
        Choose the type of document you want to add. Your files will be kept securely and ready for your rental applications.
      </Text>

      <ListGroup className='shadow-none border border-border mt-5'>
        {
          DOCUMENT_TYPES.map((docType, index) => {
            const DocumentIcon = DOCUMENT_TYPE_ICONS[docType] ?? IconFileCertificate;

            return (
              <View key={docType}>
                {index > 0 && <Separator className='mx-4' />}

                <ListGroup.Item onPress={() => handleDocumentTypeSelect(docType)}>
                  <ListGroup.ItemPrefix>
                    <View className='size-10 rounded-xl bg-primary-light items-center justify-center'>
                      <DocumentIcon size={22} color={colors.primary} />
                    </View>
                  </ListGroup.ItemPrefix>

                  <ListGroup.ItemContent>
                    <ListGroup.ItemTitle className='font-interMedium'>
                      {docType}
                    </ListGroup.ItemTitle>
                  </ListGroup.ItemContent>

                  <ListGroup.ItemSuffix iconProps={{ size: 20, color: colors.textPrimary }} />
                </ListGroup.Item>
              </View>
            )
          })
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