"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@heroui/react";
import { IconPhoto } from "@tabler/icons-react";
import PhotoGalleryModal from "@/app/components/display/PhotoGalleryModal";

interface DocumentImage {
  label: string;
  url: string | null;
}

interface VerificationDocumentsProps {
  images: DocumentImage[];
  idType: string;
}

export default function VerificationDocuments({
  images,
  idType,
}: VerificationDocumentsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const available = images.filter((image): image is DocumentImage & { url: string } => Boolean(image.url));

  function openImage(label: string) {
    const index = available.findIndex((image) => image.label === label);
    if (index < 0) return;
    setActiveIndex(index);
    setIsOpen(true);
  }

  return (
    <Card className="rounded-3xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="p-0">
        <h2 className="flex items-center gap-2 font-nunito text-lg font-bold text-primary">
          <IconPhoto size={20} aria-hidden="true" />
          Submitted documents
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Document type: {idType}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {images.map(({ label, url }) => (
            <div key={label} className="min-w-0">
              <p className="mb-2 text-sm font-semibold">{label}</p>
              {url ? (
                <button
                  type="button"
                  onClick={() => openImage(label)}
                  aria-label={`Enlarge ${label}`}
                  className="relative block h-44 w-full cursor-zoom-in overflow-hidden rounded-xl border border-border bg-muted focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Image src={url} alt={label} fill unoptimized className="object-contain" />
                </button>
              ) : (
                <div className="flex h-44 items-center justify-center rounded-xl border border-border bg-muted p-3 text-center text-sm text-muted-foreground">
                  {label} unavailable
                </div>
              )}
            </div>
          ))}
        </div>
        <PhotoGalleryModal
          name="Submitted documents"
          photos={available.map(({ url }) => ({ url }))}
          labels={available.map(({ label }) => label)}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          activeIndex={activeIndex}
          onActiveIndexChange={setActiveIndex}
        />
      </Card.Content>
    </Card>
  );
}
