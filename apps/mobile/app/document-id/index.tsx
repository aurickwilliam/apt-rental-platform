import { View, Text, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import ImageViewing from 'react-native-image-viewing'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button, Chip, Separator, Spinner } from 'heroui-native'

import {
  IconFileUpload,
  IconPlus,
  IconShieldCheck,
} from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import DocumentCard from './components/DocumentCard'

import { useColors } from '@/hooks/useTheme'
import { useDocumentUrls } from '@/hooks/applications'
import {
  useLinkApprovedVerification,
  usePassportDocuments,
} from '@/hooks/passport'

export default function Index() {
  const router = useRouter();
  const { colors } = useColors();

  const { documents, loading, refreshing, error, refetch } = usePassportDocuments();
  const { mutate: linkVerifiedId } = useLinkApprovedVerification();
  const didAttemptLink = useRef(false);

  // Link the approved verification ID into the passport once per mount.
  useEffect(() => {
    if (!loading && !didAttemptLink.current) {
      didAttemptLink.current = true;
      linkVerifiedId();
    }
  }, [loading, linkVerifiedId]);

  const [isIdVisible, setIsIdVisible] = useState<boolean>(false);

  const verifiedDoc = useMemo(
    () => documents.find((doc) => doc.is_primary) ?? documents.find((doc) => doc.is_verified) ?? null,
    [documents]
  );
  const supportingDocs = useMemo(
    () => documents.filter((doc) => doc.id !== verifiedDoc?.id),
    [documents, verifiedDoc]
  );

  const passportEntries = useMemo(
    () => supportingDocs.map((doc) => ({ label: doc.doc_type, path: doc.storage_path })),
    [supportingDocs]
  );
  const { resolved: resolvedDocs, loading: docsLoading } = useDocumentUrls(passportEntries);

  const { resolved: resolvedVerified } = useDocumentUrls(
    verifiedDoc
      ? [
          { label: verifiedDoc.doc_type, path: verifiedDoc.storage_path },
          ...(verifiedDoc.storage_path_back
            ? [{ label: `${verifiedDoc.doc_type} (back)`, path: verifiedDoc.storage_path_back }]
            : []),
        ]
      : [],
    verifiedDoc?.verification_id ? 'user-verification' : 'application-documents'
  );
  const verifiedSignedUrl = resolvedVerified[0]?.signedUrl ?? null;
  const verifiedViewerImages = useMemo(
    () => resolvedVerified.map((doc) => ({ uri: doc.signedUrl })).filter((img): img is { uri: string } => !!img.uri),
    [resolvedVerified]
  );

  const signedByPath = useMemo(
    () => new Map(resolvedDocs.map((doc) => [doc.path, doc.signedUrl])),
    [resolvedDocs]
  );

  const hasDocuments = documents.length > 0;

  return (
    <ScreenWrapper
      header={
        <StandardHeader
          title='APT Passport'
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
      refreshing={refreshing}
      onRefresh={() => void refetch()}
    >
      {/* Verified ID linked from account verification */}
      {verifiedDoc ? (
        <>
          <View className='gap-3'>
            <View className='flex-row items-center justify-between gap-3'>
              <View className='flex-1 gap-0.5'>
                <Text className='text-foreground text-lg font-nunitoSemiBold'>
                  Valid ID / Government ID
                </Text>
                <Text className='text-muted text-sm font-inter'>
                  {verifiedDoc.id_type ?? verifiedDoc.doc_type}
                </Text>
              </View>

              <Chip variant="secondary" color="success" size="sm">
                <IconShieldCheck size={14} color={colors.success} />
                <Chip.Label className='text-success font-nunitoSemiBold'>
                  Verified
                </Chip.Label>
              </Chip>
            </View>

            <TouchableOpacity
              className='bg-surface border border-border rounded-3xl shadow-none overflow-hidden'
              activeOpacity={0.7}
              onPress={() => verifiedSignedUrl && setIsIdVisible(true)}
            >
              <View className='w-full bg-gray-100 min-h-40 items-center justify-center'>
                {verifiedSignedUrl ? (
                  <Image
                    source={{ uri: verifiedSignedUrl }}
                    style={{ width: '100%', aspectRatio: 16 / 9 }}
                    contentFit='contain'
                    cachePolicy='disk'
                    transition={150}
                  />
                ) : (
                  <Spinner size="sm" color={colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          </View>

          <Separator className='my-3' />
        </>
      ) : null}

      {loading || docsLoading ? (
        <View className='flex-1 items-center justify-center py-16'>
          <Spinner size="lg" color={colors.primary} />
        </View>
      ) : error ? (
        <View className='flex-1 items-center gap-4 pt-16 px-4'>
          <Text className='text-foreground text-xl font-nunitoBold text-center'>
            Couldn&apos;t load your documents
          </Text>
          <Text className='text-gray-400 text-base font-inter text-center px-8 leading-relaxed'>
            {error}
          </Text>
          <Button size='lg' onPress={() => void refetch()}>
            <Button.Label className='text-white font-nunitoSemiBold'>
              Try Again
            </Button.Label>
          </Button>
        </View>
      ) : !hasDocuments ? (
        <View className='flex-1 items-center gap-4 pt-16 px-4'>
          <IconFileUpload size={64} color={colors.primary} />
          <Text className='text-foreground text-xl font-nunitoBold text-center'>
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
            <Button.Label className='text-white font-nunitoSemiBold'>
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
                <Text className='text-foreground text-base font-nunitoSemiBold leading-snug'>
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
          <Text className='text-foreground text-lg font-nunitoSemiBold mb-3'>
            Uploaded Documents
          </Text>

          <View className='flex-row flex-wrap gap-x-4 gap-y-5'>
            {
              supportingDocs.map(doc => {
                const signedUrl = signedByPath.get(doc.storage_path) ?? null;
                return (
                  <DocumentCard
                    key={doc.id}
                    filePath={signedUrl ?? doc.storage_path}
                    label={doc.doc_type}
                    verified={doc.is_verified}
                    onPress={() => router.push(`/document-id/${doc.id}`)}
                  />
                );
              })
            }
          </View>
        </>
      )}

      {/* Need help */}
      <View className='w-full items-center justify-center py-10'>
        <Text className='text-foreground text-base font-nunitoSemiBold'>
          Need help?
        </Text>
        <TouchableOpacity
          className='flex-row items-center justify-center mt-1'
          activeOpacity={0.7}
        >
          <Text className='text-accent text-base font-nunitoSemiBold'>
            Contact Support
          </Text>
        </TouchableOpacity>
      </View>

      <ImageViewing
        images={verifiedViewerImages}
        imageIndex={0}
        visible={isIdVisible}
        onRequestClose={() => setIsIdVisible(false)}
        presentationStyle='overFullScreen'
        backgroundColor='rgb(0, 0, 0, 0.8)'
      />
    </ScreenWrapper>
  )
}
