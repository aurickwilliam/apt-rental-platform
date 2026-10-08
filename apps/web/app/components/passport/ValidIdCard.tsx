"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Card, Spinner } from "@heroui/react";
import { IconRefresh } from "@tabler/icons-react";

import PassportStatusChip from "./PassportStatusChip";

interface ValidIdCardProps {
  idType: string;
  frontUrl: string | null;
  backUrl: string | null;
  loading: boolean;
  onOpenViewer: (index: number) => void;
}

/**
 * Primary verified ID with a flip control that swaps the preview between the
 * front and back captures. Render with `key={doc.id}` so the shown side
 * resets when the linked ID changes. The flip button is a sibling of the
 * viewer trigger, so flipping never opens the lightbox.
 */
export default function ValidIdCard({ idType, frontUrl, backUrl, loading, onOpenViewer }: ValidIdCardProps) {
  const [showBack, setShowBack] = useState(false);
  const currentUrl = showBack ? (backUrl ?? frontUrl) : frontUrl;
  const sideLabel = showBack && backUrl ? "back" : "front";

  return (
    <Card className="rounded-2xl border border-border bg-card p-4 shadow-none sm:p-5">
      <Card.Content className="flex flex-col gap-3 p-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-nunito text-lg font-semibold text-card-foreground">Valid ID / Government ID</h2>
            <p className="text-sm text-muted-foreground">{idType}</p>
          </div>
          <PassportStatusChip status="verified" />
        </div>

        <div className="relative">
          <button
            type="button"
            disabled={!currentUrl}
            onClick={() => onOpenViewer(showBack && backUrl ? 1 : 0)}
            aria-label={`Enlarge the ${sideLabel} of your ID`}
            className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted enabled:cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary"
          >
            {currentUrl ? (
              <Image
                src={currentUrl}
                alt={`${idType} (${sideLabel})`}
                fill
                unoptimized
                className="object-contain"
              />
            ) : loading ? (
              <Spinner size="sm" color="accent" />
            ) : (
              <span className="text-sm text-muted-foreground">Preview unavailable</span>
            )}
          </button>

          {backUrl ? (
            <Button
              variant="secondary"
              size="sm"
              isIconOnly
              className="absolute right-3 bottom-3"
              aria-label={showBack ? "Show front of ID" : "Show back of ID"}
              onPress={() => setShowBack((prev) => !prev)}
            >
              <IconRefresh size={20} aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </Card.Content>
    </Card>
  );
}
