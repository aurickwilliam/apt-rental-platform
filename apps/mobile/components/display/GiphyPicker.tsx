import { useEffect, useRef } from 'react';
import {
  GiphyDialog,
  GiphyDialogEvent,
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
      GiphyDialog.show();
    } else {
      GiphyDialog.hide();
    }

    return () => {
      if (visible) GiphyDialog.hide();
    };
  }, [visible]);

  return null;
}
