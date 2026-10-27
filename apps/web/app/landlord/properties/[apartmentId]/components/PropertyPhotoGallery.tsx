"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Card } from "@heroui/react";
import { IconArrowsMaximize, IconPhoto } from "@tabler/icons-react";
import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";
import type { LandlordUnitImage } from "@/service/landlordUnitDetailService";
import { canOptimizePublicApartmentImage } from "@/lib/public-apartment-image";

interface PropertyPhotoGalleryProps {
  name: string;
  images: LandlordUnitImage[];
}

export default function PropertyPhotoGallery({ name, images }: PropertyPhotoGalleryProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const photos = [...images.filter((image) => image.is_cover), ...images.filter((image) => !image.is_cover)];
  const selectedIndex = photos.findIndex((image) => image.id === selectedId);
  const activeIndex = selectedIndex < 0 ? 0 : selectedIndex;
  const activePhoto = photos[activeIndex];

  return (
    <Card className="property-detail-gallery shadow-none bg-card rounded-3xl border border-border overflow-hidden">
      {activePhoto ? (
        <>
          <Button
            aria-label={`Open photo ${activeIndex + 1} of ${photos.length} for ${name}`}
            onPress={() => setViewerOpen(true)}
            variant="ghost"
            className="property-photo-trigger relative overflow-hidden"
          >
            <Image src={activePhoto.url} alt={`${name}, photo ${activeIndex + 1}`} fill sizes="(max-width: 1024px) 100vw, 66vw" unoptimized={!canOptimizePublicApartmentImage(activePhoto.url)} className="object-cover" />
            <span className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-2 text-sm text-white">
              <IconArrowsMaximize size={16} aria-hidden="true" />
              View photos · {activeIndex + 1}/{photos.length}
            </span>
          </Button>
          {photos.length > 1 ? (
            <Card.Content className="p-4">
              <div className="flex gap-2 overflow-x-auto p-1" role="group" aria-label="Choose property photo">
                {photos.map((image, index) => (
                  <Button
                    key={image.id}
                    isIconOnly
                    variant="ghost"
                    aria-label={`Show photo ${index + 1}${image.is_cover ? ", cover photo" : ""}`}
                    aria-pressed={index === activeIndex}
                    onPress={() => setSelectedId(image.id)}
                    className={`property-photo-thumbnail relative shrink-0 overflow-hidden ${index === activeIndex ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : "opacity-70 hover:opacity-100"}`}
                  >
                    <Image src={image.url_thumb || image.url} alt="" fill sizes="96px" unoptimized={!canOptimizePublicApartmentImage(image.url_thumb || image.url)} className="object-cover" />
                  </Button>
                ))}
              </div>
            </Card.Content>
          ) : null}
          <PhotoGalleryModal
            name={name}
            photos={photos.map((image) => ({ url: image.url, thumbnailUrl: image.url_thumb }))}
            isOpen={viewerOpen}
            onOpenChange={setViewerOpen}
            activeIndex={activeIndex}
            onActiveIndexChange={(index) => setSelectedId(photos[index].id)}
          />
        </>
      ) : (
        <div className="flex h-64 sm:h-80 flex-col items-center justify-center gap-3 rounded-xl bg-muted text-muted-foreground">
          <IconPhoto size={32} aria-hidden="true" />
          <p className="text-sm">No property photos yet. Add photos from the Manage menu.</p>
        </div>
      )}
    </Card>
  );
}
