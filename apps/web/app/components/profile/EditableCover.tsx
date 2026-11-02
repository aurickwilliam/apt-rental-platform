"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import { Button, Modal, Spinner } from "@heroui/react";
import { IconChevronDown, IconPhoto, IconTrash, IconUpload, IconX } from "@tabler/icons-react";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import RemovePhotoConfirmModal from "./RemovePhotoConfirmModal";
import { useProfilePhotoUpload } from "./use-profile-photo";

interface EditableCoverProps {
  authUserId: string;
  initialUrl: string | null;
}

/** Keep the saved banner visible while the modal owns a disposable preview. */
export default function EditableCover({ authUserId, initialUrl }: EditableCoverProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  const {
    savedUrl,
    previewUrl,
    isPreviewing,
    isSaving,
    isRemoving,
    isBusy,
    error,
    selectFile,
    cancel,
    save,
    remove,
  } = useProfilePhotoUpload(authUserId, "cover", initialUrl);

  const shownUrl = previewUrl ?? savedUrl;

  const close = () => {
    if (isBusy) return;
    cancel();
    setIsRemoveOpen(false);
    setIsOpen(false);
  };

  const handleSave = async () => {
    if (await save()) setIsOpen(false);
  };

  const handleConfirmRemove = async () => {
    if (!(await remove())) return;
    setIsRemoveOpen(false);
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative h-28 w-full overflow-hidden rounded-t-3xl bg-muted sm:h-32">
        {savedUrl ? (
          <Image src={savedUrl} alt="" fill unoptimized className="object-cover" />
        ) : null}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute top-3 right-3 rounded-full border border-white/20 bg-black/55 p-1 shadow-lg backdrop-blur-sm">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Edit cover photo"
            aria-haspopup="dialog"
            isDisabled={isBusy}
            onPress={() => setIsOpen(true)}
            className="rounded-full text-white hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <IconPhoto size={16} aria-hidden="true" />
            Edit cover
            <IconChevronDown size={14} aria-hidden="true" className="opacity-80" />
          </Button>
        </div>
      </div>

      <Modal>
        <Modal.Backdrop
          ref={setOverlay}
          isOpen={isOpen}
          onOpenChange={(open) => { if (!open) close(); }}
          isDismissable={!isBusy}
          isKeyboardDismissDisabled={isBusy}
        >
          <Modal.Container placement="center" size="lg" scroll="inside">
            <Modal.Dialog className="max-w-3xl! rounded-3xl bg-card text-card-foreground">
              <Modal.CloseTrigger
                aria-label="Close edit cover photo"
                className="edit-profile-close-control"
                isDisabled={isBusy}
              >
                <IconX size={20} aria-hidden="true" />
              </Modal.CloseTrigger>
              <Modal.Header className="pr-12">
                <Modal.Heading className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
                  <IconPhoto size={20} aria-hidden="true" />
                  Edit Cover Photo
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div className="relative h-28 w-full overflow-hidden rounded-2xl bg-muted sm:h-32">
                  {shownUrl ? (
                    <Image src={shownUrl} alt="Cover photo preview" fill unoptimized className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                      <IconPhoto size={24} aria-hidden="true" />
                      No cover photo
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose a JPG, PNG, or WebP image up to 5MB. Your cover changes only when you save.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  tabIndex={-1}
                  aria-label="Choose cover photo file"
                  disabled={isBusy}
                  onChange={(event) => {
                    selectFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onPress={() => inputRef.current?.click()} isDisabled={isBusy}>
                    <IconUpload size={18} aria-hidden="true" />
                    Choose photo
                  </Button>
                  <Button
                    variant="danger-soft"
                    onPress={() => setIsRemoveOpen(true)}
                    isDisabled={!savedUrl || isBusy}
                  >
                    <IconTrash size={18} aria-hidden="true" />
                    Remove cover
                  </Button>
                </div>
                {error ? <ErrorBanner message={error} /> : null}
              </Modal.Body>
              <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="danger-soft" className="w-full sm:w-auto" onPress={close} isDisabled={isBusy}>
                  Cancel
                </Button>
                <Button variant="primary" className="w-full sm:w-auto" onPress={() => void handleSave()} isDisabled={!isPreviewing || isBusy}>
                  {isSaving ? <><Spinner size="sm" />Saving...</> : "Save Changes"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {overlay ? (
        <RemovePhotoConfirmModal
          portalContainer={overlay}
          isOpen={isRemoveOpen}
          title="Remove cover photo?"
          description="Your profile header will fall back to the default background. You can upload a new cover anytime."
          confirmLabel="Remove cover"
          isRemoving={isRemoving}
          error={error}
          onClose={() => { if (!isRemoving) setIsRemoveOpen(false); }}
          onConfirm={() => void handleConfirmRemove()}
        />
      ) : null}
    </>
  );
}
