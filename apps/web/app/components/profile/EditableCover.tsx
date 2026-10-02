"use client";

import { useRef, useState } from "react";
import Image from "next/image";

import { Button, Dropdown, Label, Spinner } from "@heroui/react";
import { IconPhoto } from "@tabler/icons-react";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";

import RemovePhotoConfirmModal from "./RemovePhotoConfirmModal";
import { useProfilePhotoUpload } from "./use-profile-photo";

type EditableCoverProps = {
  authUserId: string;
  initialUrl: string | null;
};

// Own-profile cover banner: gray fallback when unset, "Edit cover" menu
// top-right. Same validate → preview → Save/Cancel flow as the avatar,
// reusing the shared background pipeline. Removal requires modal
// confirmation and only clears the image after the storage + row update
// succeeds. Controls sit on a dark translucent toolbar so they stay
// readable over bright, dark, or busy cover images.
export default function EditableCover({ authUserId, initialUrl }: EditableCoverProps) {
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
  } = useProfilePhotoUpload(authUserId, "cover", initialUrl);

  const shownUrl = previewUrl ?? savedUrl;
  const canRemove = savedUrl !== null && !isBusy && !isPreviewing;

  const handleConfirmRemove = () => {
    void remove().finally(() => {
      setIsRemoveOpen(false);
    });
  };

  return (
    <div className="relative h-32 w-full overflow-hidden rounded-t-2xl bg-muted sm:h-40">
      {shownUrl ? (
        <Image
          src={shownUrl}
          alt=""
          fill
          unoptimized
          className="object-cover"
        />
      ) : null}

      {/* Readability gradient behind the top-right controls */}
      {!isPreviewing ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent"
          aria-hidden
        />
      ) : null}

      {isBusy ? (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/40"
          aria-hidden
        >
          <Spinner size="sm" color="current" className="text-white" />
        </div>
      ) : null}

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

      {isPreviewing ? (
        <div className="absolute right-3 bottom-3 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onPress={cancel}
            isDisabled={isBusy}
            className="bg-background/90"
          >
            Cancel
          </Button>
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
              "Save cover"
            )}
          </Button>
        </div>
      ) : (
        <div className="absolute top-3 right-3 rounded-full border border-white/20 bg-black/55 p-1 shadow-lg backdrop-blur-sm">
          <Dropdown>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              aria-label="Cover photo options"
              isDisabled={isBusy}
              className="rounded-full text-white hover:bg-white/15 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <IconPhoto size={16} aria-hidden="true" />
              Edit cover
              <ChevronDown size={14} aria-hidden="true" className="opacity-80" />
            </Button>
            <Dropdown.Popover placement="bottom end">
              <Dropdown.Menu
                aria-label="Cover photo options"
                onAction={(key) => {
                  if (key === "change") inputRef.current?.click();
                  if (key === "remove" && canRemove) setIsRemoveOpen(true);
                }}
              >
                <Dropdown.Item id="change" textValue="Change cover">
                  <Label className="flex items-center gap-2">
                    <Pencil size={14} aria-hidden="true" />
                    Change cover
                  </Label>
                </Dropdown.Item>
                <Dropdown.Item
                  id="remove"
                  textValue="Remove cover"
                  variant="danger"
                  isDisabled={!canRemove}
                >
                  <Label className="flex items-center gap-2">
                    <Trash2 size={14} aria-hidden="true" />
                    Remove cover
                  </Label>
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown>
        </div>
      )}

      <RemovePhotoConfirmModal
        isOpen={isRemoveOpen}
        title="Remove cover photo?"
        description="Your profile header will fall back to the default background. You can upload a new cover anytime."
        confirmLabel="Remove cover"
        isRemoving={isRemoving}
        onClose={() => {
          if (!isRemoving) setIsRemoveOpen(false);
        }}
        onConfirm={handleConfirmRemove}
      />
    </div>
  );
}
