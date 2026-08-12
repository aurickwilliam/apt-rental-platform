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

type CaptureField = 'front' | 'back'

type ScreenState = 'preview' | 'reviewing'

interface CapturedPhoto {
  uri: string
  width: number
  height: number
}

/**
 * Live_Capture_Screen — in-app camera capture for a Physical_ID's front or
 * back side, with a guided CR80 frame, real-time quality feedback,
 * auto-capture, a manual shutter, and a retake/confirm review step.
 *
 * Validates: Requirements 2.1-2.10, 3.1-3.6, 6.1, 6.2
 */
export default function LiveCapture() {
  const router = useRouter();
  const { colors } = useColors();
  const { field } = useLocalSearchParams<{ field: CaptureField }>();

  const setFrontResult = useVerificationStore((state) => state.setFrontResult);
  const setBackResult = useVerificationStore((state) => state.setBackResult);

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
  const guidedFrameRect = computeGuidedFrameRect(viewportWidth, viewportHeight);

  const qualityCheckEnabled = permissionState === 'granted' && screenState === 'preview';

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
    if (capturedPhoto == null || field == null) return;

    const result = {
      kind: 'camera' as const,
      asset: { uri: capturedPhoto.uri, width: capturedPhoto.width, height: capturedPhoto.height },
    };

    if (field === 'front') setFrontResult(result);
    if (field === 'back') setBackResult(result);

    router.back();
  }, [capturedPhoto, field, router, setFrontResult, setBackResult]);

  // Permission gating (Req 3.1, 3.2, 3.4, 3.5, 3.6)
  useEffect(() => {
    if (permissionState === 'undetermined') {
      void requestPermission();
    }
  }, [permissionState, requestPermission]);

  const fieldLabel = field === 'back' ? 'Back of ID' : 'Front of ID';

  return (
    <ScreenWrapper noTopPadding>
      <View className="absolute top-14 left-3 z-10">
        <CloseButton variant="ghost" onPress={router.back}>
          <IconChevronLeft size={26} color={colors.white} />
        </CloseButton>
      </View>

      {permissionState === 'denied' && (
        <PermissionDeniedView onOpenSettings={openSettings} />
      )}

      {permissionState === 'restricted' && <PermissionRestrictedView />}

      {(permissionState === 'undetermined' || permissionState === 'granted') && cameraError && (
        <CameraErrorView message={cameraError} onRetry={handleRetryCamera} />
      )}

      {permissionState === 'granted' && !cameraError && screenState === 'preview' && (
        <View className="flex-1">
          <CameraView
            ref={cameraRef}
            style={{ flex: 1 }}
            facing="back"
            onCameraReady={() => setCameraReady(true)}
            onMountError={handleMountError}
          />

          <View className="absolute inset-0">
            <GuidedFrameOverlay viewportWidth={viewportWidth} viewportHeight={viewportHeight} />
          </View>

          <View className="absolute top-24 left-0 right-0 items-center px-5">
            <Text className="text-white text-sm font-interMedium text-center">
              {fieldLabel}: position the ID within the frame
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
