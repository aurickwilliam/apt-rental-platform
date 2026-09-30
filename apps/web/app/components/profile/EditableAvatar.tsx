"use client";

import { useRef, useState } from "react";

import { Button, Dropdown, Label, Spinner } from "@heroui/react";
import { Camera, Pencil, Trash2 } from "lucide-react";

import UserAvatar from "./UserAvatar";
import RemovePhotoConfirmModal from "./RemovePhotoConfirmModal";
import { useProfilePhotoUpload } from "./use-profile-photo";

type EditableAvatarProps = {
  authUserId: string;
  initialUrl: string | null;
  initials: string;
  displayName: string;
};

// Own-profile avatar: circle photo with orange camera badge. The badge opens
// a compact menu (Change / Remove); picking a file shows an inline preview
// with Save / Cancel; saving uploads through the shared avatar pipeline and
// refreshes everywhere on success. Removal requires modal confirmation and
// only clears the image after the storage + row update succeeds.
export default function EditableAvatar({
  authUserId,
  initialUrl,
  initials,
  displayName,
}: EditableAvatarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const {
    savedUrl,
    previewUrl,
    isPreviewing,
    isSaving,
    isRemoving,
    isBusy,
    selectFile,
    cancel,
    save,
    remove,
  } = useProfilePhotoUpload(authUserId, "avatar", initialUrl);

  const shownUrl = previewUrl ?? savedUrl;
  const canRemove = savedUrl !== null && !isBusy && !isPreviewing;

  const handleConfirmRemove = () => {
    void remove().finally(() => {
      setIsRemoveOpen(false);
    });
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <UserAvatar
          src={shownUrl}
          initials={initials}
          alt={`${displayName}'s profile photo`}
          size="lg"
          className="size-36 rounded-full border-4 border-background bg-primary text-white"
          fallbackClassName="rounded-full bg-primary text-white font-semibold text-4xl"
        />

        {isBusy ? (
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40"
            aria-hidden
          >
            <Spinner size="sm" color="current" className="text-white" />
          </div>
        ) : null}

        <Dropdown>
          <Button
            type="button"
            isIconOnly
            size="sm"
            variant="secondary"
            aria-label="Photo options"
            isDisabled={isBusy || isPreviewing}
            className="absolute right-1 bottom-1 border-2 border-background shadow-md hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Camera size={16} aria-hidden="true" />
          </Button>
          <Dropdown.Popover placement="bottom start">
            <Dropdown.Menu
              aria-label="Profile photo options"
              onAction={(key) => {
                if (key === "change") inputRef.current?.click();
                if (key === "remove" && canRemove) setIsRemoveOpen(true);
              }}
            >
              <Dropdown.Item id="change" textValue="Change photo">
                <Label className="flex items-center gap-2">
                  <Pencil size={14} aria-hidden="true" />
                  Change photo
                </Label>
              </Dropdown.Item>
              <Dropdown.Item
                id="remove"
                textValue="Remove photo"
                variant="danger"
                isDisabled={!canRemove}
              >
                <Label className="flex items-center gap-2">
                  <Trash2 size={14} aria-hidden="true" />
                  Remove photo
                </Label>
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown.Popover>
        </Dropdown>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            selectFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {isPreviewing ? (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="primary"
            onPress={save}
            isDisabled={isBusy}
          >
            {isSaving ? (
              <>
                <Spinner size="sm" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onPress={cancel}
            isDisabled={isBusy}
          >
            Cancel
          </Button>
        </div>
      ) : null}

      <RemovePhotoConfirmModal
        isOpen={isRemoveOpen}
        title="Remove profile photo?"
        description="Your profile will show your initials instead. You can upload a new photo anytime."
        confirmLabel="Remove photo"
        isRemoving={isRemoving}
        onClose={() => {
          if (!isRemoving) setIsRemoveOpen(false);
        }}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
