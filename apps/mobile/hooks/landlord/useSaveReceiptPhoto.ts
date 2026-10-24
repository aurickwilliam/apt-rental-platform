import { useCallback, useRef, type RefObject } from 'react'
import type { View } from 'react-native'

export type SaveReceiptPhotoResult = 'saved' | 'denied' | 'unavailable'

// The two native modules are loaded only when a photo is saved. A static import would
// evaluate expo-media-library while the app starts, and a development client built
// before the module was added throws "Cannot find native module" there, taking down every
// screen that imports this file. Loading it here turns that into a message on one button.
function loadNativeModules() {
  try {
    /* eslint-disable @typescript-eslint/no-require-imports */
    return {
      // The package root is the new class-based API; the add-to-library call this needs
      // lives in the legacy entry (the root export of the old call is deprecated and fails).
      MediaLibrary: require('expo-media-library/legacy') as typeof import('expo-media-library/legacy'),
      captureRef: (require('react-native-view-shot') as typeof import('react-native-view-shot')).captureRef,
    }
    /* eslint-enable @typescript-eslint/no-require-imports */
  } catch {
    return null
  }
}

// Captures the receipt view as a PNG and adds it to the photo library. The view is a
// copy of the receipt without its buttons, so the photo is only the receipt. Only
// add-only access is asked for, and only when the landlord taps Save as photo.
export function useSaveReceiptPhoto(): {
  receiptRef: RefObject<View | null>
  save: () => Promise<SaveReceiptPhotoResult>
} {
  const receiptRef = useRef<View>(null)

  const save = useCallback(async (): Promise<SaveReceiptPhotoResult> => {
    const modules = loadNativeModules()
    if (!modules) return 'unavailable'
    const { MediaLibrary, captureRef } = modules
    const permission = await MediaLibrary.requestPermissionsAsync(true)
    if (!permission.granted) return 'denied'
    if (!receiptRef.current) throw new Error('The receipt is not on screen.')
    const uri = await captureRef(receiptRef, { format: 'png', quality: 1, result: 'tmpfile' })
    await MediaLibrary.saveToLibraryAsync(uri)
    return 'saved'
  }, [])

  return { receiptRef, save }
}
