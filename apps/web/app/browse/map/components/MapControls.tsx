"use client";

import { Button } from "@heroui/react";
import {
  IconArrowsDiagonal,
  IconArrowsDiagonalMinimize2,
  IconCurrentLocation,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";

interface MapControlsProps {
  /** Omit to hide the expand button. */
  onToggleExpand?: () => void;
  expanded?: boolean;
  /** Show the expand button on every screen size (it is desktop-only by default). */
  expandOnPhones?: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
}

const CIRCLE = "size-10 min-w-10 cursor-pointer rounded-full bg-surface text-foreground shadow-lg hover:bg-surface-secondary";
const HALF = "size-10 min-w-10 cursor-pointer rounded-none bg-surface text-foreground hover:bg-surface-secondary";

// The map's own controls, replacing Google's defaults (Airbnb-style): an expand
// button, a zoom pill and a locate-me button, stacked at the top right.
export default function MapControls({ expanded = false, onToggleExpand, expandOnPhones = false, onZoomIn, onZoomOut, onLocate }: MapControlsProps) {
  const { t } = useTranslation();
  return (
    <div
      data-fab-clearance="browse-map-controls"
      className="absolute top-3 right-3 z-10 flex flex-col items-center gap-2"
    >
      {onToggleExpand ? (
        // Phones already show the map on its own, so expanding is desktop-only by default.
        <div className={expandOnPhones ? undefined : "hidden lg:block"}>
          <Button
            isIconOnly
            variant="ghost"
            className={CIRCLE}
            onPress={onToggleExpand}
            aria-label={expanded ? t("browse.map.collapse") : t("browse.map.expand")}
            aria-pressed={expanded}
          >
            {expanded ? <IconArrowsDiagonalMinimize2 size={18} /> : <IconArrowsDiagonal size={18} />}
          </Button>
        </div>
      ) : null}

      <div role="group" aria-label={t("browse.map.zoom")} className="flex flex-col overflow-hidden rounded-full bg-surface shadow-lg">
        <Button isIconOnly variant="ghost" className={HALF} onPress={onZoomIn} aria-label={t("browse.map.zoomIn")}>
          <IconPlus size={18} />
        </Button>
        <div className="mx-2 h-px bg-border" aria-hidden="true" />
        <Button isIconOnly variant="ghost" className={HALF} onPress={onZoomOut} aria-label={t("browse.map.zoomOut")}>
          <IconMinus size={18} />
        </Button>
      </div>

      <Button isIconOnly variant="ghost" className={CIRCLE} onPress={onLocate} aria-label={t("browse.map.locate")}>
        <IconCurrentLocation size={18} />
      </Button>
    </div>
  );
}
