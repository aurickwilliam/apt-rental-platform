import { useCallback, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { CameraView } from 'expo-camera'

import { Button, CloseButton } from 'heroui-native'

import { IconChevronLeft } from '@tabler/icons-react-native'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import ErrorDialog from '@/components/display/ErrorDialog'
import { useCameraPermission } from '@/hooks/verification'
import {
  claimWebVerificationSession,
  extractSessionToken,
} from '@/service/verification/verificationService'
import { useVerificationStore } from '@/stores/useVerificationStore'
import { useColors } from '@/hooks/useTheme'
import { useTranslation } from '@/hooks/i18n'

/**
 * Scan_Session_Screen — claims a desktop QR verification session
 * (Profile → APT Passport → Verify Account → Generate code) so the
 * existing capture wizard submits against it. The raw token is hashed
 * client-side and only its digest leaves the device; ownership, liveness,
 * and expiry are enforced by the claim. Abandoning the screen simply lets
 * the desktop session expire.
 */
export default function ScanSession() {
  const router = useRouter();
  const { colors } = useColors();
  const { t } = useTranslation();
  const { state: permissionState, requestPermission, openSettings } =
    useCameraPermission();
  const setSessionClaim = useVerificationStore((state) => state.setSessionClaim);

  const [isClaiming, setIsClaiming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Guard against the scanner firing repeatedly for one code.
  const handledRef = useRef(false);

  const handleScanned = useCallback(
    async (value: string) => {
      if (handledRef.current || isClaiming) return;
      handledRef.current = true;

      const token = extractSessionToken(value);
      if (!token) {
        setErrorMessage(t("authMobile.verify.scan.wrongCode"));
        handledRef.current = false;
        return;
      }

      setIsClaiming(true);
      try {
        const session = await claimWebVerificationSession(token);
        setSessionClaim({
          token: session.token,
          verificationId: session.verificationId,
          expiresAt: session.expiresAt,
        });
        router.push('/(auth)/verify-account/select-id');
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : t("authMobile.verify.scan.claimFailed"),
        );
        handledRef.current = false;
      } finally {
        setIsClaiming(false);
      }
    },
    [isClaiming, router, setSessionClaim, t],
  );

  return (
    <ScreenWrapper className="p-5">
      <CloseButton
        variant="ghost"
        className="-ml-2 mb-2"
        onPress={router.back}
      >
        <IconChevronLeft size={26} color={colors.textPrimary} />
      </CloseButton>

      <View className="flex gap-1">
        <Text className="text-2xl text-accent font-nunitoMedium">
          {t("authMobile.verify.scan.title")}
        </Text>
        <Text className="text-sm text-gray-500 font-inter">
          {t("authMobile.verify.scan.body")}
        </Text>
      </View>

      <View className="mt-5 flex-1 overflow-hidden rounded-2xl border border-border">
        {permissionState === 'granted' ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => void handleScanned(data)}
          />
        ) : (
          <View className="flex-1 items-center justify-center gap-3 p-6">
            <Text className="text-base font-nunitoSemiBold text-foreground text-center">
              {t("authMobile.verify.scan.cameraNeeded")}
            </Text>
            <Text className="text-sm text-gray-500 font-inter text-center">
              {permissionState === 'restricted'
                ? t("authMobile.verify.scan.restricted")
                : t("authMobile.verify.scan.denied")}
            </Text>
            {permissionState !== 'restricted' && (
              <Button
                size="sm"
                onPress={
                  permissionState === 'denied' ? openSettings : requestPermission
                }
              >
                <Button.Label>
                  {permissionState === 'denied'
                    ? t("authMobile.verify.scan.openSettings")
                    : t("authMobile.verify.scan.allowCamera")}
                </Button.Label>
              </Button>
            )}
          </View>
        )}
      </View>

      {isClaiming && (
        <Text className="mt-4 text-sm text-gray-500 font-inter text-center">
          {t("authMobile.verify.scan.checking")}
        </Text>
      )}

      <ErrorDialog
        isOpen={errorMessage !== null}
        onClose={() => setErrorMessage(null)}
        message={errorMessage ?? ''}
        title={t("authMobile.verify.scan.errorTitle")}
      />
    </ScreenWrapper>
  )
}
