"use client";

import Image from "next/image";
import { Button, Modal } from "@heroui/react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

export interface GalleryPhoto {
  url: string;
  thumbnailUrl?: string | null;
}

interface PhotoGalleryModalProps {
  name: string;
  photos: GalleryPhoto[];
  labels?: string[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}

export default function PhotoGalleryModal({
  name,
  photos,
  labels,
  isOpen,
  onOpenChange,
  activeIndex,
  onActiveIndexChange,
}: PhotoGalleryModalProps) {
  if (!photos.length) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Backdrop className="bg-black/80">
        <Modal.Container
          placement="center"
          scroll="inside"
          className="w-full max-w-5xl sm:w-full"
        >
          <Modal.Dialog className="w-full max-w-5xl rounded-3xl bg-card p-4 sm:p-5">
            <Modal.CloseTrigger
              aria-label="Close photo gallery"
              className="top-4 right-4 z-10 size-8 rounded-full bg-muted text-foreground hover:bg-muted-foreground/20 focus-visible:outline-2 focus-visible:outline-primary"
            />
            <Modal.Header className="pr-12">
              <Modal.Heading className="font-nunito text-lg font-bold">
                 {name} · {labels?.[activeIndex] ?? `Photo ${activeIndex + 1} of ${photos.length}`}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="p-0">
              <div className="relative h-[48dvh] w-full overflow-hidden rounded-3xl bg-neutral-950 sm:h-[55dvh]">
                <Image
                  src={photos[activeIndex].url}
                   alt={`${name} ${labels?.[activeIndex] ?? `photo ${activeIndex + 1}`}`}
                  fill
                  unoptimized
                  className="object-contain"
                />
              </div>
              {photos.length > 1 ? (
                <>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() =>
                        onActiveIndexChange(
                          (activeIndex - 1 + photos.length) % photos.length,
                        )
                      }
                    >
                      <IconChevronLeft size={18} aria-hidden="true" /> Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={() =>
                        onActiveIndexChange((activeIndex + 1) % photos.length)
                      }
                    >
                      Next <IconChevronRight size={18} aria-hidden="true" />
                    </Button>
                  </div>
                  <div
                    className="mt-3 flex gap-2 overflow-x-auto pb-1"
                     aria-label={`Choose a ${name.toLowerCase()} image`}
                  >
                    {photos.map((photo, index) => (
                      <button
                        key={`${photo.url}-${index}`}
                        type="button"
                        onClick={() => onActiveIndexChange(index)}
                         aria-label={labels?.[index] ?? `Photo ${index + 1}`}
                        aria-pressed={index === activeIndex}
                        className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 focus-visible:outline-2 focus-visible:outline-primary ${index === activeIndex ? "border-primary" : "border-transparent"}`}
                      >
                        <Image
                          src={photo.thumbnailUrl ?? photo.url}
                          alt=""
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
