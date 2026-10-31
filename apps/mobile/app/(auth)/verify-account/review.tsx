import { Pressable, View, Text } from 'react-native'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image } from 'expo-image'
import ImageViewing from 'react-native-image-viewing'

import { CloseButton, Button } from 'heroui-native'

import { IconChevronLeft, IconCheck } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StepProgress from '@/components/display/StepProgress'
import ErrorDialog from '@/components/display/ErrorDialog'
import ConfirmDialog from '@/components/display/ConfirmDialog'

import { useColors } from '@/hooks/useTheme'
import { buildVerificationInput, useSubmitSessionVerification, useSubmitVerification } from '@/hooks/verification'
import { useVerificationStore } from '@/stores/useVerificationStore'
import { getCaptureSequence, SELFIE_STEP } from '@/constants/verification/captureSequences'
import { getCaptureProgress } from '@/utils/verification/gating'
import { useTranslation } from '@/hooks/i18n'

export default function Review() {
  const router = useRouter();
  const { colors } = useColors();
  const { t } = useTranslation();

  const selectedId = useVerificationStore((state) => state.selectedId);
  const captures = useVerificationStore((state) => state.captures);
  const sessionClaim = useVerificationStore((state) => state.sessionClaim);

  const sequence = getCaptureSequence(selectedId);
  const idStepsComplete = getCaptureProgress(sequence, captures).isComplete;
  const selfie = captures[SELFIE_STEP.id] ?? null;

  const { mutateAsync: submitStandalone, isPending: isStandalonePending } = useSubmitVerification();
  const { mutateAsync: submitSession, isPending: isSessionPending } =
    useSubmitSessionVerification(sessionClaim?.token ?? null);
  const isPending = isStandalonePending || isSessionPending;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Guard against landing here with an incomplete session — e.g. a deep
  // link straight to this screen. Redirect to the correct step rather than
  // rendering a review over captures that were never taken.
  useEffect(() => {
    if (selectedId === null) {
      router.replace('/(auth)/verify-account/select-id');
    } else if (!idStepsComplete) {
      router.replace('/(auth)/verify-account/upload-id');
    } else if (selfie === null) {
      router.replace('/(auth)/verify-account/upload-selfie');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, idStepsComplete, selfie]);

  const handleEditIdStep = (stepId: string) => {
    router.push(`/(auth)/verify-account/live-capture?idType=${encodeURIComponent(selectedId ?? '')}&stepId=${encodeURIComponent(stepId)}`);
  };

  const handleRetakeSelfie = () => {
    router.push(`/(auth)/verify-account/live-capture?stepId=${SELFIE_STEP.id}`);
  };

  interface ReviewPhotoItem {
    key: string
    label: string
    photoLabel: string
    uri: string
    /** Card shape: true ID proportions for documents, square for the selfie. */
    aspectRatio: number
    onRetake: () => void
  }

  // Display order drives both the summary cards and the fullscreen viewer
  // so tapping a card opens the viewer on that exact photo.
  const idItems: ReviewPhotoItem[] = sequence.flatMap((step) => {
    const result = captures[step.id] ?? null;
    if (result === null) return [];
    return [{
      key: step.id,
      label: t("authMobile.verify.review.idLabel", { label: t(step.labelKey) }),
      photoLabel: t("authMobile.verify.review.idPhotoLabel", {
        label: t(step.labelKey),
      }),
      uri: result.uri,
      aspectRatio: step.aspectRatio,
      onRetake: () => handleEditIdStep(step.id),
    }];
  });

  const viewerItems: ReviewPhotoItem[] =
    selfie === null
      ? idItems
      : [...idItems, {
        key: SELFIE_STEP.id,
        label: t("authMobile.verify.review.selfieLabel"),
        photoLabel: t("authMobile.verify.review.selfiePhotoLabel"),
        uri: selfie.uri,
        aspectRatio: 1,
        onRetake: handleRetakeSelfie,
      }];

  const handleSubmit = async () => {
    setErrorMessage(null);

    let input;
    try {
      input = buildVerificationInput(selectedId, captures);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : t("authMobile.verify.review.missingPhotos"),
      );
      return;
    }

    try {
      // A claimed desktop session consumes the session row so the desktop
      // modal observes completion; otherwise the standalone flow applies.
      if (sessionClaim) {
        await submitSession(input);
      } else {
        await submitStandalone(input);
      }
      router.push('/(auth)/verify-account/success');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : t("authMobile.verify.review.submitFailed"),
      );
      console.error('Verification submit failed', err);
    }
  };

  return (
    <ScreenWrapper
      className='p-5'
      scrollable
      footer={
        <Button
          isDisabled={isPending}
          onPress={() => setConfirmOpen(true)}
          className='mx-5'
        >
          <Button.Label>
            {isPending
              ? t("authMobile.verify.review.submitting")
              : t("authMobile.verify.review.submit")}
          </Button.Label>
        </Button>
      }
    >
      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={(value) => {
          if (!value && !isPending) setConfirmOpen(false);
        }}
        title={t("authMobile.verify.review.confirmTitle")}
        description={t("authMobile.verify.review.confirmBody")}
        checklistItems={[
          ...(idStepsComplete
            ? [t("authMobile.verify.review.confirmPhotos")]
            : []),
          ...(selfie ? [t("authMobile.verify.review.confirmSelfie")] : []),
        ]}
        confirmLabel={
          isPending
            ? t("authMobile.verify.review.submitting")
            : t("authMobile.verify.review.confirmAction")
        }
        confirmVariant="primary"
        isConfirmDisabled={isPending}
        cancelLabel={t("authMobile.verify.review.cancel")}
        onConfirm={() => {
          setConfirmOpen(false);
          void handleSubmit();
        }}
      />
      <CloseButton
        variant="ghost"
        className="-ml-2 mb-2"
        onPress={router.back}
      >
        <IconChevronLeft size={26} color={colors.textPrimary} />
      </CloseButton>

      <StepProgress
        currentStep={4}
        totalSteps={5}
        stepName={t("authMobile.verify.reviewAndSubmit")}
      />

      <View className='flex gap-1'>
        <Text className='text-2xl text-accent font-nunitoMedium'>
          {selectedId}
        </Text>
        <Text className='text-sm text-gray-500 font-inter'>
          {t("authMobile.verify.review.title")}
        </Text>
      </View>

      <View className='flex gap-5 mt-5'>
        {viewerItems.map((item, index) => (
          <ReviewPhotoCard
            key={item.key}
            label={item.label}
            photoLabel={item.photoLabel}
            uri={item.uri}
            aspectRatio={item.aspectRatio}
            onView={() => setViewingIndex(index)}
            onRetake={item.onRetake}
          />
        ))}
      </View>

      <ImageViewing
        images={viewerItems.map(({ uri }) => ({ uri }))}
        imageIndex={viewingIndex ?? 0}
        visible={viewingIndex !== null}
        onRequestClose={() => setViewingIndex(null)}
        presentationStyle="overFullScreen"
        backgroundColor="rgb(0, 0, 0, 0.8)"
        FooterComponent={({ imageIndex: idx }) => (
          <View className="p-10 items-center">
            <Text className="text-white font-nunitoSemiBold">
              {idx + 1} / {viewerItems.length}
            </Text>
          </View>
        )}
      />

      <View className='mt-5 rounded-2xl border border-border bg-surface p-4'>
        <Text className='text-sm font-inter text-gray-500 text-center'>
          {t("authMobile.verify.review.notice")}
        </Text>
      </View>

      <ErrorDialog
        isOpen={errorMessage !== null}
        onClose={() => setErrorMessage(null)}
        message={errorMessage ?? ''}
        title={t("authMobile.verify.review.errorTitle")}
      />
    </ScreenWrapper>
  )
}

interface ReviewPhotoCardProps {
  label: string
  photoLabel: string
  uri: string
  aspectRatio: number
  onView: () => void
  onRetake: () => void
}

function ReviewPhotoCard({ label, photoLabel, uri, aspectRatio, onView, onRetake }: ReviewPhotoCardProps) {
  const { colors } = useColors();
  const { t } = useTranslation();
  const [loadFailed, setLoadFailed] = useState(false);

  return (
    <View className='gap-2'>
      <View className='flex-row items-center gap-2'>
        <Text className='text-base font-nunitoSemiBold text-foreground'>
          {label}:
        </Text>
        <IconCheck size={18} color={colors.primary} />
        <View className='flex-1' />
        <Button variant="tertiary" size="sm" onPress={onRetake}>
          <Button.Label>{t("authMobile.verify.review.retake")}</Button.Label>
        </Button>
      </View>

      {loadFailed ? (
        <View
          style={{ width: '100%', aspectRatio }}
          className='rounded-2xl border border-border items-center justify-center p-4'
        >
          <Text className='text-sm text-gray-500 font-inter text-center'>
            {t("authMobile.verify.review.photoLoadFailed")}
          </Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("authMobile.verify.review.viewFullscreen", {
            label: photoLabel,
          })}
          onPress={onView}
          className='w-full rounded-2xl border border-border overflow-hidden'
        >
          <Image
            source={{ uri }}
            style={{ width: '100%', aspectRatio }}
            contentFit="cover"
            accessibilityLabel={photoLabel}
            onError={() => setLoadFailed(true)}
          />
        </Pressable>
      )}
    </View>
  )
}
