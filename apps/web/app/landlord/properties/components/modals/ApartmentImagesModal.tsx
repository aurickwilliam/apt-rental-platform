"use client";

import { useState, useRef } from "react";
import Image from "next/image";

import {
  Modal,
  Button, 
  Chip,
} from "@heroui/react";

import { IconX as X, IconPhotoPlus as ImagePlus, IconStar as Star } from "@tabler/icons-react";

import { createBrowserClient } from "@repo/supabase";
import RemovePhotoConfirmModal from "@/app/components/profile/RemovePhotoConfirmModal";
import {
  APARTMENT_IMAGES_BUCKET,
  type UploadedApartmentImage,
  uploadApartmentImage,
} from "@/lib/apartment-image-upload";

type ApartmentImage = {
  id:         string;
  url:        string;
  url_thumb?: string | null;
  is_cover:   boolean;
};

type Props = {
  isOpen:      boolean;
  onClose:     () => void;
  apartmentId: string;
  images:      ApartmentImage[];
  onImagesChange: (images: ApartmentImage[]) => void;
};

export default function ApartmentImagesModal({
  isOpen, onClose, apartmentId, images, onImagesChange,
}: Props) {
  const [localImages, setLocalImages] = useState<ApartmentImage[]>(images);
  const [uploading, setUploading]     = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const [imagePendingDelete, setImagePendingDelete] = useState<ApartmentImage | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  // Take new images from the parent without an effect round-trip.
  const [syncedImages, setSyncedImages] = useState(images);
  if (syncedImages !== images) {
    setSyncedImages(images);
    setLocalImages(images);
  }

  const supabase = createBrowserClient();

  // ── Upload ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);

    for (const file of files) {
      let uploaded: UploadedApartmentImage;
      try {
        uploaded = await uploadApartmentImage(supabase, apartmentId, file);
      } catch (uploadError) {
        console.error(uploadError);
        continue;
      }

      const isCover = localImages.length === 0;

      const { data: newImage, error: insertError } = await supabase
        .from("apartment_images")
        .insert({ apartment_id: apartmentId, url: uploaded.url, url_thumb: uploaded.url_thumb, is_cover: isCover })
        .select()
        .single();

      if (insertError || !newImage) {
        console.error(insertError);
        await supabase.storage.from(APARTMENT_IMAGES_BUCKET).remove(uploaded.paths);
        continue;
      }
      setLocalImages((prev) => [...prev, newImage as ApartmentImage]);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Delete ──
  const handleDelete = async (image: ApartmentImage) => {
    setDeleting(image.id);

    // Extract storage path from URL
    const paths = [image.url, image.url_thumb]
      .map((url) => url?.split(`/${APARTMENT_IMAGES_BUCKET}/`)[1])
      .filter((path): path is string => !!path);

    await supabase.storage.from(APARTMENT_IMAGES_BUCKET).remove(paths);
    await supabase.from("apartment_images").delete().eq("id", image.id);

    const updated = localImages.filter((img) => img.id !== image.id);

    // If deleted image was cover, set first remaining as cover
    if (image.is_cover && updated.length > 0) {
      await supabase
        .from("apartment_images")
        .update({ is_cover: true })
        .eq("id", updated[0].id);
      updated[0].is_cover = true;
    }

    setLocalImages(updated);
    setDeleting(null);
  };

  // ── Set Cover ──
  const handleSetCover = async (image: ApartmentImage) => {
    // Remove cover from all
    await supabase
      .from("apartment_images")
      .update({ is_cover: false })
      .eq("apartment_id", apartmentId);

    // Set new cover
    await supabase
      .from("apartment_images")
      .update({ is_cover: true })
      .eq("id", image.id);

    setLocalImages((prev) =>
      prev.map((img) => ({ ...img, is_cover: img.id === image.id }))
    );
  };

  const handleDone = () => {
    onImagesChange(localImages);
    onClose();
  };

  return (
    <>
      <Modal>
        <Modal.Backdrop
          isOpen={isOpen}
          onOpenChange={(open) => !open && handleDone()}
          className="z-99"
        >
        <Modal.Container
          size="lg"
          scroll="inside"
          className="z-100 shadow-2xl pointer-events-auto"
        >
          <Modal.Dialog>
            <Modal.CloseTrigger className="text-black" />
            <Modal.Header>
              <Modal.Heading className="font-medium">
                Edit Images
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body className="flex flex-col gap-4">
              {/* Upload area */}
              <Button
                type="button"
                variant="tertiary"
                className="h-auto w-full rounded-xl border-2 border-dashed border-default-200 p-6 hover:border-primary focus-visible:border-primary"
                onPress={() => fileInputRef.current?.click()}
                isDisabled={uploading}
                aria-describedby="upload-images-description"
              >
                <span className="flex flex-col items-center gap-2">
                  <ImagePlus size={28} className="text-grey-400" aria-hidden="true" />
                  <span className="text-sm text-grey-500 font-medium">Upload images</span>
                  <span id="upload-images-description" className="text-xs text-grey-400">JPEG, PNG, WEBP · Max 5MB each</span>
                </span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleUpload}
              />

              {uploading && (
                <p className="text-sm text-primary text-center animate-pulse" aria-live="polite">Uploading…</p>
              )}

              {/* Image grid */}
              {localImages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-default-400">
                  <p className="text-sm">No images yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {localImages.map((image) => (
                    <div key={image.id} className="relative group rounded-xl overflow-hidden aspect-video focus-within:ring-2 focus-within:ring-primary">
                      <Image src={image.url} alt="Apartment" fill unoptimized className="object-cover" />

                      {/* Cover badge */}
                      {image.is_cover && (
                        <div className="absolute top-2 left-2">
                          <Chip 
                            size="sm" 
                            color="warning" 
                          >
                            <Star size={10} />
                            Cover
                          </Chip>
                        </div>
                      )}

                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {!image.is_cover && (
                          <Button
                            size="sm" 
                            variant="tertiary"
                            className="bg-white/90 text-xs"
                            onPress={() => handleSetCover(image)}
                          >
                            Set Cover
                          </Button>
                        )}
                          <Button
                            isIconOnly 
                            size="sm" 
                            className="bg-danger/90"
                            aria-label="Delete apartment image"
                            isDisabled={deleting !== null}
                            onPress={() => setImagePendingDelete(image)}
                          >
                            <X size={14} className="text-white" aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button onPress={handleDone}>
                Done
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <RemovePhotoConfirmModal
        isOpen={imagePendingDelete !== null}
        title="Delete image?"
        description="This permanently removes the image from this property."
        confirmLabel="Delete image"
        isRemoving={deleting !== null}
        onClose={() => setImagePendingDelete(null)}
        onConfirm={() => {
          if (!imagePendingDelete) return;
          void handleDelete(imagePendingDelete).then(() => setImagePendingDelete(null));
        }}
      />
    </>
  );
}
