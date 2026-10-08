"use client";

import { useState } from "react";
import Image from "next/image";
import { Button, Card, Spinner } from "@heroui/react";
import { IconRefresh } from "@tabler/icons-react";

import PassportStatusChip from "./PassportStatusChip";

interface IdSide {
  label: "Front" | "Back";
  url: string | null;
}

interface ValidIdCardProps {
  idType: string;
  sides: IdSide[];
  loading: boolean;
  onOpenViewer: (label: IdSide["label"]) => void;
}

/**
 * Primary verified ID with a flip control that swaps the preview between the
 * front and back captures. Render with `key={doc.id}` so the shown side
 * resets when the linked ID changes. The flip button is a sibling of the
 * viewer trigger, so flipping never opens the lightbox.
 */
export default function ValidIdCard({ idType, sides, loading, onOpenViewer }: ValidIdCardProps) {
  const [showBack, setShowBack] = useState(false);
  const front = sides.find((side) => side.label === "Front") ?? null;
  const back = sides.find((side) => side.label === "Back" && side.url) ?? null;
  const current = showBack && back ? back : front;

  return (
    <Card className="rounded-2xl border border-border bg-card p-4 shadow-none">
      <Card.Content className="flex flex-col gap-3 p-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-nunito text-lg font-semibold text-card-foreground">Government ID</h2>
            <p className="truncate text-sm text-muted-foreground">{idType}</p>
          </div>
          <PassportStatusChip status="verified" />
        </div>

        <div className="relative">
          <button
            type="button"
            disabled={!current?.url}
            onClick={() => current && onOpenViewer(current.label)}
            aria-label={`Enlarge the ${(current?.label ?? "Front").toLowerCase()} of your ID`}
            className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted enabled:cursor-zoom-in focus-visible:outline-2 focus-visible:outline-primary"
          >
            {current?.url ? (
              <Image
                src={current.url}
                alt={`${idType} (${current.label.toLowerCase()})`}
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

          {back ? (
            <>
              <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                {current?.label ?? "Front"}
              </span>
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
            </>
          ) : null}
        </div>
      </Card.Content>
    </Card>
  );
}
