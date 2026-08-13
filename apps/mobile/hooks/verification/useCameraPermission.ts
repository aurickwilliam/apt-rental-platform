import { useCallback } from 'react';
import { Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';

export type CameraPermissionState = 'granted' | 'denied' | 'restricted' | 'undetermined';

interface UseCameraPermissionResult {
  state: CameraPermissionState;
  requestPermission: () => Promise<void>;
  openSettings: () => void;
}

/**
 * Thin wrapper around expo-camera's `useCameraPermissions()` hook,
 * normalizing its response into the four states the Live_Capture_Screen
 * cares about. `restricted` (OS-policy-blocked, e.g. parental controls) is
 * derived as `status === 'denied' && !canAskAgain`, since expo-camera has no
 * distinct "restricted" status of its own.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */
export function useCameraPermission(): UseCameraPermissionResult {
  const [permissionResponse, requestCameraPermission, getCameraPermission] =
    useCameraPermissions();

  // Re-check permission state on screen focus, so returning from the OS
  // Settings app re-evaluates state without an app restart (Req 3.3).
  useFocusEffect(
    useCallback(() => {
      getCameraPermission();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  );

  const state: CameraPermissionState = (() => {
    if (permissionResponse === null) return 'undetermined';
    if (permissionResponse.status === 'granted') return 'granted';
    if (permissionResponse.status === 'undetermined') return 'undetermined';
    // status === 'denied'
    return permissionResponse.canAskAgain ? 'denied' : 'restricted';
  })();

  const requestPermission = useCallback(async () => {
    await requestCameraPermission();
  }, [requestCameraPermission]);

  const openSettings = useCallback(() => {
    Linking.openSettings();
  }, []);

  return { state, requestPermission, openSettings };
}
