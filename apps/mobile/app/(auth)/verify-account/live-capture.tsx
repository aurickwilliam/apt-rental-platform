import { useCallback, useEffect, useRef, useState } from 'react'
import { Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { CameraView } from 'expo-camera'
import { Image } from 'expo-image'

import { Button, CloseButton } from 'heroui-native'

import { IconChevronLeft } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import GuidedFrameOverlay, { computeGuidedFrameRect } from '@/components/display/GuidedFrameOverlay'
import { useCameraPermission, useFrameQualityCheck } from '@/hooks/verification'

import { useColors } from '@/hooks/useTheme'
import { useVerificationStore } from '@/stores/useVerificationStore'
import { getCaptureSequence, getNextCaptureStep, SELFIE_STEP } from './constants/captureSequences'

type ScreenState = 'preview' | 'reviewing'

interface CapturedPhoto {
  uri: string
  width: number
  height: number
}

/**
 * Live_Capture_Screen — in-app camera capture for a single Capture_Step of
 * the tenant's Selected_Id_Type, with a guided frame sized to that step's
 * configured aspect ratio, real-time quality feedback, auto-capture, a
 * manual shutter, and a retake/confirm review step.
 *
 * Validates: Requirements 2.6, 2.7, 3.1-3.9, 4.1-4.6
 */
export default function LiveCapture() {
  const router = useRouter();
  const { colors } = useColors();
  const { idType, stepId } = useLocalSearchParams<{ idType: string; stepId: string }>();

  const setCaptureResult = useVerificationStore((state) => state.setCaptureResult);
  const reset = useVerificationStore((state) => state.reset);

  // The reserved "selfie" step id reuses this screen with a front-camera,
  // circular guide (see SELFIE_STEP); every other stepId resolves against the
  // selected ID type's capture sequence.
  const captureStep =
    stepId === SELFIE_STEP.id ? SELFIE_STEP : getCaptureSequence(idType ?? null).find((step) => step.id === stepId);

  const { state: permissionState, requestPermission, openSettings } = useCameraPermission();

  const cameraRef = useRef<CameraView>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [screenState, setScreenState] = useState<ScreenState>('preview');
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);

  // Guards — see Task 14.4 for the rationale behind each.
  const isCapturingRef = useRef(false);
  const autoCaptureTriggeredRef = useRef(false);

  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const guidedFrameRect = computeGuidedFrameRect(viewportWidth, viewportHeight, captureStep?.aspectRatio);

  const qualityCheckEnabled = permissionState === 'granted' && screenState === 'preview' && captureStep != null;

  const { status, reasons, isStable } = useFrameQualityCheck(cameraRef, {
    enabled: qualityCheckEnabled,
    guidedFrameRect,
    viewportWidth,
    viewportHeight,
  });

  const resetCameraLifecycleState = useCallback(() => {
    setCameraReady(false);
    isCapturingRef.current = false;
    autoCaptureTriggeredRef.current = false;
  }, []);

  const handleMountError = useCallback(
    (event: { message: string }) => {
      setCameraError(event.message);
      resetCameraLifecycleState();
    },
    [resetCameraLifecycleState],
  );

  const handleRetryCamera = useCallback(() => {
    setCameraError(null);
    resetCameraLifecycleState();
  }, [resetCameraLifecycleState]);

  /**
   * The single code path allowed to call `takePictureAsync()` for an actual
   * (non-sampling) capture. Both the manual shutter and the auto-capture
   * trigger call this function — there is no duplicate capture logic.
   */
  const capturePhoto = useCallback(async () => {
    if (!cameraReady) return;
    if (isCapturingRef.current) return;

    const camera = cameraRef.current;
    if (camera == null) return;

    isCapturingRef.current = true;
    try {
      const photo = await camera.takePictureAsync({ quality: 0.9, shutterSound: true });
      setCapturedPhoto({ uri: photo.uri, width: photo.width, height: photo.height });
      setScreenState('reviewing');
    } catch (err) {
      setCameraError(err instanceof Error ? err.message : 'Failed to capture photo.');
    } finally {
      isCapturingRef.current = false;
    }
  }, [cameraReady]);

  const handleManualCapture = useCallback(() => {
    void capturePhoto();
  }, [capturePhoto]);

  // Auto-capture: trigger capturePhoto() once isStable becomes true, guarded
  // against duplicate triggers across re-renders/samples within one preview
  // session (Req 2.5).
  useEffect(() => {
    if (
      isStable &&
      screenState === 'preview' &&
      cameraReady &&
      !autoCaptureTriggeredRef.current
    ) {
      autoCaptureTriggeredRef.current = true;
      void capturePhoto();
    }
  }, [isStable, screenState, cameraReady, capturePhoto]);

  const handleRetake = useCallback(() => {
    setCapturedPhoto(null);
    setScreenState('preview');
    isCapturingRef.current = false;
    autoCaptureTriggeredRef.current = false;
  }, []);

  const handleUsePhoto = useCallback(() => {
    if (capturedPhoto == null || stepId == null) return;

    setCaptureResult(stepId, {
      uri: capturedPhoto.uri,
      width: capturedPhoto.width,
      height: capturedPhoto.height,
    });

    const nextStep =
      stepId === SELFIE_STEP.id ? null : getNextCaptureStep(idType ?? null, stepId);

    if (nextStep !== null) {
      router.replace(
        `/(auth)/verify-account/live-capture?idType=${encodeURIComponent(idType ?? '')}&stepId=${encodeURIComponent(nextStep.id)}`,
      );
      return;
    }

    router.back();
  }, [capturedPhoto, idType, stepId, router, setCaptureResult]);

  // Closing out of the camera always abandons the in-progress verification
  // session, then dismisses the entire flow back to select-id.tsx (skipping
  // upload-id's null-selectedId guard, which exists only as a deep-link
  // safety net now that close no longer backs into this screen).
  const handleClose = useCallback(() => {
    reset();
    router.dismissTo('/(auth)/verify-account/select-id');
  }, [reset, router]);

  // Permission gating (Req 4.1, 4.2, 4.4, 4.5, 4.6)
  useEffect(() => {
    if (permissionState === 'undetermined') {
      void requestPermission();
    }
  }, [permissionState, requestPermission]);

  const stepLabel = captureStep?.label ?? 'ID';
  const stepNotFound = captureStep == null;

  return (
    <ScreenWrapper noTopPadding>
      <View className="absolute top-14 left-3 z-10">
        <CloseButton variant="ghost" onPress={handleClose}>
          <IconChevronLeft size={26} color={colors.white} />
        </CloseButton>
      </View>

      {permissionState === 'denied' && (
        <PermissionDeniedView onOpenSettings={openSettings} />
      )}

      {permissionState === 'restricted' && <PermissionRestrictedView />}

      {permissionState === 'granted' && !cameraError && stepNotFound && (
        <CameraErrorView
          message="The capture step could not be found."
          onRetry={router.back}
        />
      )}

      {(permissionState === 'undetermined' || permissionState === 'granted') && cameraError && (
        <CameraErrorView message={cameraError} onRetry={handleRetryCamera} />
      )}

      {permissionState === 'granted' && !cameraError && !stepNotFound && screenState === 'preview' && (
        <View className="flex-1">
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing={captureStep?.cameraFacing ?? 'back'}
            onCameraReady={() => setCameraReady(true)}
            onMountError={handleMountError}
          />

          <View className="absolute inset-0">
            <GuidedFrameOverlay
              viewportWidth={viewportWidth}
              viewportHeight={viewportHeight}
              aspectRatio={captureStep?.aspectRatio}
              shape={captureStep?.guideShape ?? 'rectangle'}
              strokeColor={captureStep?.guideShape === 'circle' ? colors.success : colors.white}
            />
          </View>

          <View className="absolute top-24 left-0 right-0 items-center px-5">
            <Text className="text-white text-sm font-interMedium text-center">
              {stepId === SELFIE_STEP.id
                ? `${stepLabel}: position your face within the frame`
                : `${stepLabel}: position the ID within the frame`}
            </Text>
          </View>

          <QualityIndicator status={status} reasons={reasons} />

          <View className="absolute bottom-12 left-0 right-0 items-center">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Capture photo"
              onPress={handleManualCapture}
              className="size-16 rounded-full bg-white border-4 border-gray-300"
            />
          </View>
        </View>
      )}

      {screenState === 'reviewing' && capturedPhoto && (
        <CaptureReview
          photo={capturedPhoto}
          onRetake={handleRetake}
          onUsePhoto={handleUsePhoto}
        />
      )}
    </ScreenWrapper>
  )
}

function PermissionDeniedView({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 bg-background">
      <Text className="text-foreground text-base font-interMedium text-center">
        Camera access is required to capture a photo of your ID.
      </Text>
      <Text className="text-gray-500 text-sm font-inter text-center">
        Please enable camera access for APT in your device settings to continue.
      </Text>
      <Button onPress={onOpenSettings}>
        <Button.Label>Open Settings</Button.Label>
      </Button>
    </View>
  )
}

function PermissionRestrictedView() {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 bg-background">
      <Text className="text-foreground text-base font-interMedium text-center">
        Camera access is blocked by device policy.
      </Text>
      <Text className="text-gray-500 text-sm font-inter text-center">
        Your device&apos;s settings prevent APT from accessing the camera. Please contact your device administrator.
      </Text>
    </View>
  )
}

function CameraErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-8 bg-background">
      <Text className="text-foreground text-base font-interMedium text-center">
        The camera couldn&apos;t start.
      </Text>
      <Text className="text-gray-500 text-sm font-inter text-center">{message}</Text>
      <Button onPress={onRetry}>
        <Button.Label>Retry</Button.Label>
      </Button>
    </View>
  )
}

function QualityIndicator({
  status,
  reasons,
}: {
  status: 'evaluating' | 'pass' | 'fail'
  reasons: ('blur' | 'glare' | 'fill')[]}) {
  const dotColor = status === 'pass' ? 'bg-success' : status === 'fail' ? 'bg-danger' : 'bg-warning';

  const message = (() => {
    if (status === 'pass') return 'Looks good — hold steady';
    if (status === 'evaluating') return 'Evaluating…';
    if (reasons.includes('blur')) return 'Hold your device steady';
    if (reasons.includes('glare')) return 'Reduce glare or improve lighting';
    if (reasons.includes('fill')) return 'Move closer to fill the frame';
    return 'Adjust framing';
  })();

  return (
    <View className="absolute bottom-32 left-0 right-0 items-center">
      <View className="flex-row items-center gap-2 bg-black/50 rounded-full px-4 py-2">
        <View className={`size-2.5 rounded-full ${dotColor}`} />
        <Text className="text-white text-xs font-interMedium">{message}</Text>
      </View>
    </View>
  )
}

function CaptureReview({
  photo,
  onRetake,
  onUsePhoto,
}: {
  photo: CapturedPhoto
  onRetake: () => void
  onUsePhoto: () => void
}) {
  return (
    <View className="flex-1 bg-black">
      <Image
        source={{ uri: photo.uri }}
        style={{ flex: 1 }}
        contentFit="contain"
      />

      <View className="absolute bottom-12 left-0 right-0 flex-row justify-center gap-4 px-5">
        <Button variant="secondary" className="flex-1" onPress={onRetake}>
          <Button.Label>Retake</Button.Label>
        </Button>
        <Button className="flex-1" onPress={onUsePhoto}>
          <Button.Label>Use Photo</Button.Label>
        </Button>
      </View>
    </View>
  )
}
