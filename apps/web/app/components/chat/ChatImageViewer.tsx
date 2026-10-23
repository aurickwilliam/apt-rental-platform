"use client";

import { Modal } from "@heroui/react";

interface ChatImageViewerProps {
  /** The photo or GIF to show, or null when closed. */
  url: string | null;
  alt: string;
  onClose: () => void;
}

/**
 * Full-screen viewer for a photo or GIF in a conversation (mobile's
 * `react-native-image-viewing`): the image on a dark backdrop, closed with the
 * X, Escape or a click outside it.
 */
export default function ChatImageViewer({ url, alt, onClose }: ChatImageViewerProps) {
  return (
    <Modal>
      <Modal.Backdrop
        isOpen={url !== null}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
        className="bg-black/90"
      >
        <Modal.Container placement="center" className="w-full">
          <Modal.Dialog
            aria-label="Image viewer"
            className="flex w-full max-w-none items-center justify-center bg-transparent p-0 shadow-none"
          >
            <Modal.CloseTrigger
              aria-label="Close image viewer"
              className="fixed top-4 right-4 z-10 size-10 cursor-pointer rounded-full bg-white/15 text-white hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
            />
            {url ? (
              // Signed storage URL or external GIF — plain <img>, like the rest of the chat media.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={alt}
                className="max-h-[90dvh] max-w-[92vw] rounded-2xl object-contain"
              />
            ) : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
