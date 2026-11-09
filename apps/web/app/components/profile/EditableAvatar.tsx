"use client";

import { useRef, useState } from "react";

import { Button, Modal, Spinner } from "@heroui/react";
import { IconCamera, IconTrash, IconUpload, IconX } from "@tabler/icons-react";

import ErrorBanner from "@/app/components/display/ErrorBanner";
import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";
import UserAvatar from "./UserAvatar";
import RemovePhotoConfirmModal from "./RemovePhotoConfirmModal";
import { useProfilePhotoUpload } from "./use-profile-photo";

interface EditableAvatarProps {
  authUserId: string;
  initialUrl: string | null;
  initials: string;
  displayName: string;
}

/** The photo opens a viewer; the separate camera opens a disposable edit draft. */
export default function EditableAvatar({ authUserId, initialUrl, initials, displayName }: EditableAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [overlay, setOverlay] = useState<HTMLDivElement | null>(null);
  const {
    savedUrl, previewUrl, isPreviewing, isSaving, isRemoving, isBusy,
    error, selectFile, cancel, save, remove,
  } = useProfilePhotoUpload(authUserId, "avatar", initialUrl);

  const closeEditor = () => {
    if (isBusy) return;
    cancel();
    setIsRemoveOpen(false);
    setIsEditorOpen(false);
  };

  const handleSave = async () => {
    if (await save()) setIsEditorOpen(false);
  };

  const handleConfirmRemove = async () => {
    if (!(await remove())) return;
    setIsRemoveOpen(false);
    setIsEditorOpen(false);
  };

  return (
    <>
      <div className="profile-avatar-photo relative">
        <UserAvatar
          src={savedUrl}
          initials={initials}
          alt={`${displayName}'s profile photo`}
          size="lg"
          className="size-24 rounded-full border-4 border-background bg-primary text-white"
          fallbackClassName="rounded-full bg-primary text-white font-bold text-xl"
        />
        {savedUrl ? (
          <Button
            type="button"
            variant="ghost"
            aria-label="View profile photo"
            aria-haspopup="dialog"
            className="button--bare profile-avatar-view-trigger"
            isDisabled={isBusy}
            onPress={() => setIsViewerOpen(true)}
          />
        ) : null}
        <Button
          type="button"
          isIconOnly
          size="sm"
          variant="secondary"
          aria-label="Edit profile photo"
          aria-haspopup="dialog"
          isDisabled={isBusy}
          onPress={() => setIsEditorOpen(true)}
          className="profile-avatar-edit-trigger absolute -right-1 -bottom-1 border-2 border-background shadow-md hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <IconCamera size={16} aria-hidden="true" />
        </Button>
      </div>

      {savedUrl ? (
        <PhotoGalleryModal
          name={displayName}
          photos={[{ url: savedUrl }]}
          labels={["Profile photo"]}
          isOpen={isViewerOpen}
          onOpenChange={setIsViewerOpen}
          activeIndex={0}
          onActiveIndexChange={() => undefined}
        />
      ) : null}

      <Modal>
        <Modal.Backdrop
          ref={setOverlay}
          isOpen={isEditorOpen}
          onOpenChange={(open) => { if (!open) closeEditor(); }}
          isDismissable={!isBusy}
          isKeyboardDismissDisabled={isBusy}
        >
          <Modal.Container placement="center" size="lg" scroll="inside">
            <Modal.Dialog className="rounded-3xl bg-card text-card-foreground">
              <Modal.CloseTrigger aria-label="Close edit profile photo" className="edit-profile-close-control" isDisabled={isBusy}>
                <IconX size={20} aria-hidden="true" />
              </Modal.CloseTrigger>
              <Modal.Header className="pr-12">
                <Modal.Heading className="flex items-center gap-2 font-nunito text-lg font-semibold text-primary">
                  <IconCamera size={20} aria-hidden="true" />
                  Edit Profile Photo
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body className="space-y-4">
                <div className="flex justify-center">
                  <UserAvatar
                    src={previewUrl ?? savedUrl}
                    initials={initials}
                    alt="Profile photo preview"
                    size="lg"
                    className="size-40 rounded-full border-4 border-background bg-primary text-white"
                    fallbackClassName="rounded-full bg-primary text-white font-bold text-xl"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Choose a JPG, PNG, or WebP image up to 5MB. Your profile photo changes only when you save.
                </p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  tabIndex={-1}
                  aria-label="Choose profile photo file"
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
                  <Button variant="danger-soft" onPress={() => setIsRemoveOpen(true)} isDisabled={!savedUrl || isBusy}>
                    <IconTrash size={18} aria-hidden="true" />
                    Remove photo
                  </Button>
                </div>
                {error ? <ErrorBanner message={error} /> : null}
              </Modal.Body>
              <Modal.Footer className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="danger-soft" className="w-full sm:w-auto" onPress={closeEditor} isDisabled={isBusy}>
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
          title="Remove profile photo?"
          description="Your profile will show your initials instead. You can upload a new photo anytime."
          confirmLabel="Remove photo"
          isRemoving={isRemoving}
          error={error}
          onClose={() => { if (!isRemoving) setIsRemoveOpen(false); }}
          onConfirm={() => void handleConfirmRemove()}
        />
      ) : null}
    </>
  );
}
