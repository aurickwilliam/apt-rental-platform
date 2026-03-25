"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
  Button, Chip,
} from "@heroui/react";
import { X, ImagePlus, Star } from "lucide-react";
import { createBrowserClient } from "@repo/supabase";

type ApartmentImage = {
  id:       string;
  url:      string;
  is_cover: boolean;
};

type Props = {
  isOpen:      boolean;
  onClose:     () => void;
  apartmentId: string;
  images:      ApartmentImage[];
  onImagesChange: (images: ApartmentImage[]) => void;
};

const generateFilename = (apartmentId: string, originalName: string) => {
  const ext = originalName.split(".").pop();
  return `${apartmentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
};

export default function ApartmentImagesModal({
  isOpen, onClose, apartmentId, images, onImagesChange,
}: Props) {
  const [localImages, setLocalImages] = useState<ApartmentImage[]>(images);
  const [uploading, setUploading]     = useState(false);
  const [deleting, setDeleting]       = useState<string | null>(null);
  const fileInputRef                  = useRef<HTMLInputElement>(null);

  const supabase = createBrowserClient();

  // ── Upload ──
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);

    for (const file of files) {
      const filename = generateFilename(apartmentId, file.name);

      const { error: uploadError } = await supabase.storage
        .from("apartment-images")
        .upload(filename, file);

      if (uploadError) { console.error(uploadError); continue; }

      const { data: { publicUrl } } = supabase.storage
        .from("apartment-images")
        .getPublicUrl(filename);

      const isCover = localImages.length === 0;

      const { data: newImage, error: insertError } = await supabase
        .from("apartment_images")
        .insert({ apartment_id: apartmentId, url: publicUrl, is_cover: isCover })
        .select()
        .single();

      if (!insertError && newImage) {
        setLocalImages((prev) => [...prev, newImage as ApartmentImage]);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Delete ──
  const handleDelete = async (image: ApartmentImage) => {
    setDeleting(image.id);

    // Extract storage path from URL
    const path = image.url.split("/apartment-images/")[1];

    await supabase.storage.from("apartment-images").remove([path]);
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
    <Modal isOpen={isOpen} onOpenChange={(open) => !open && handleDone()} size="3xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="font-noto-serif">Edit Images</ModalHeader>

        <ModalBody>
          {/* Upload area */}
          <div
            className="border-2 border-dashed border-default-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus size={28} className="text-default-400" />
            <p className="text-sm text-default-500">Click to upload images</p>
            <p className="text-xs text-default-400">JPEG, PNG, WEBP · Max 5MB each</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {uploading && (
            <p className="text-sm text-primary text-center animate-pulse">Uploading...</p>
          )}

          {/* Image grid */}
          {localImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <p className="text-sm">No images yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 mt-2">
              {localImages.map((image) => (
                <div key={image.id} className="relative group rounded-xl overflow-hidden aspect-video">
                  <Image src={image.url} alt="Apartment" fill className="object-cover" />

                  {/* Cover badge */}
                  {image.is_cover && (
                    <div className="absolute top-2 left-2">
                      <Chip size="sm" color="warning" variant="solid" startContent={<Star size={10} />}>
                        Cover
                      </Chip>
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.is_cover && (
                      <Button
                        size="sm" radius="full" variant="flat"
                        className="bg-white/90 text-xs"
                        onPress={() => handleSetCover(image)}
                      >
                        Set Cover
                      </Button>
                    )}
                    <Button
                      isIconOnly size="sm" radius="full"
                      className="bg-danger/90"
                      isLoading={deleting === image.id}
                      onPress={() => handleDelete(image)}
                    >
                      <X size={14} className="text-white" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button color="primary" radius="full" onPress={handleDone}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
