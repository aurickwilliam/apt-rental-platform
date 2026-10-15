"use client";

import GiphyPicker from "./GiphyPicker";

interface GiphyPickerSheetProps {
  /** Sends the Giphy CDN URL verbatim, without an upload. */
  onSelect: (url: string) => void;
  onClose: () => void;
}

/**
 * Thin wrapper so the composer controls the picker's open state without
 * importing the sheet's internals. GIFs send immediately — the chosen GIF is
 * the whole message, so there is nothing to stage.
 */
export default function GiphyPickerSheet({
  onSelect,
  onClose,
}: GiphyPickerSheetProps) {
  return (
    <GiphyPicker
      isOpen
      onClose={onClose}
      onGifSelected={onSelect}
    />
  );
}