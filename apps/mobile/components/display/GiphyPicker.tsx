import { useEffect, useRef } from 'react';
import {
  GiphyDialog,
  GiphyDialogEvent,
  GiphySDK,
  type GiphyMedia,
} from '@giphy/react-native-sdk';

export type { GiphyMedia };

interface GiphyPickerProps {
  /** Controls whether the native GIPHY dialog is shown. */
  visible: boolean;
  /** Called when the dialog is dismissed (by user action or after selection). */
  onClose: () => void;
  /** Called when the user selects a GIF. Receives the full GiphyMedia object. */
  onSelect: (gif: GiphyMedia) => void;
}

export default function GiphyPicker({
  visible,
  onClose,
  onSelect,
}: GiphyPickerProps) {
  const onSelectRef = useRef(onSelect);
  const onCloseRef = useRef(onClose);
  const hasShownRef = useRef(false);

  const apiKey = process.env.EXPO_PUBLIC_GIPHY_API_KEY;

  // The GIPHY dialog only reads the SDK's global config, and production chat
  // never configured it — the only other configure call lives in the dev test
  // screen. Configure from the public env key before any show() can run; the
  // effect below runs first so first-open is already configured.
  useEffect(() => {
    if (apiKey) {
      GiphySDK.configure({ apiKey });
    }
  }, [apiKey]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const mediaSub = GiphyDialog.addListener(
      GiphyDialogEvent.MediaSelected,
      ({ media }) => {
        onSelectRef.current(media);
        onCloseRef.current();
      }
    );

    const dismissSub = GiphyDialog.addListener(
      GiphyDialogEvent.Dismissed,
      () => {
        onCloseRef.current();
      }
    );

    return () => {
      mediaSub.remove();
      dismissSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      hasShownRef.current = true;
      GiphyDialog.show();
    } else if (hasShownRef.current) {
      GiphyDialog.hide();
    }

    return () => {
      if (visible) GiphyDialog.hide();
    };
  }, [visible]);

  return null;
}
