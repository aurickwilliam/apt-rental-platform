"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import ApartmentCard from "../../components/ui/ApartmentCard";
import AuthPromptModal from "@/app/components/ui/AuthPromptModal";
import { useFavorites } from "@/hooks/use-favorites";
import type { BrowseApartment } from "../lib/fetch-browse-results";
import type { BrowseSection } from "../lib/fetch-browse-sections";
import ApartmentHoverPreview from "./ApartmentHoverPreview";

const HOVER_EXPAND_DELAY_MS = 450;
const HOVER_COLLAPSE_DELAY_MS = 150;
const PREVIEW_WIDTH = 320;
const PREVIEW_ESTIMATED_HEIGHT = 388;
const VIEWPORT_MARGIN = 8;

interface HoveredCard {
  apartment: BrowseApartment;
  rect: { left: number; top: number; width: number; height: number };
}

function canHoverPreview(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
  );
}

function previewPosition(rect: HoveredCard["rect"]): { left: number; top: number; width: number } {
  const left = Math.min(
    Math.max(rect.left + rect.width / 2 - PREVIEW_WIDTH / 2, VIEWPORT_MARGIN),
    Math.max(window.innerWidth - PREVIEW_WIDTH - VIEWPORT_MARGIN, VIEWPORT_MARGIN),
  );
  const top = Math.min(
    Math.max(rect.top + rect.height / 2 - PREVIEW_ESTIMATED_HEIGHT / 2, VIEWPORT_MARGIN),
    Math.max(window.innerHeight - PREVIEW_ESTIMATED_HEIGHT - VIEWPORT_MARGIN, VIEWPORT_MARGIN),
  );
  return { left, top, width: PREVIEW_WIDTH };
}

interface BrowseSectionsListProps {
  sections: BrowseSection[];
  basePath?: string;
}

interface SectionRowProps {
  section: BrowseSection;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (apartmentId: string) => void;
  onPressApartment: (apartmentId: string) => void;
  onHoverCard: (apartment: BrowseApartment, rect: HoveredCard["rect"]) => void;
  onLeaveCard: () => void;
  activeFavoriteId: string | null;
}

// One horizontally scrolling row with Netflix-style hover-reveal edge arrows
// (desktop only). Arrows hide at each scroll end and when the row fits.
function SectionRow({
  section,
  isFavorite,
  onToggleFavorite,
  onPressApartment,
  onHoverCard,
  onLeaveCard,
  activeFavoriteId,
}: SectionRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanScrollLeft(track.scrollLeft > 8);
    setCanScrollRight(track.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener("scroll", updateArrows, { passive: true });
    const observer = new ResizeObserver(updateArrows);
    observer.observe(track);
    return () => {
      track.removeEventListener("scroll", updateArrows);
      observer.disconnect();
    };
  }, [updateArrows, section.apartments.length]);

  const scrollRow = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  // Tall edge strips (not floating circles) so aiming for an arrow never
  // lands on a card. Base is hidden: revealed on row hover at md+ only.
  const stripBase =
    "absolute inset-y-0 z-10 hidden w-12 items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary md:flex";
  const leftStripClass = `${stripBase} left-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-background dark:via-background/80 dark:to-transparent`;
  const rightStripClass = `${stripBase} right-0 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-background dark:via-background/80 dark:to-transparent`;

  return (
    <div className="group relative">
      <div
        ref={trackRef}
        className="flex w-full max-w-full gap-3 overflow-x-auto pb-2 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        {section.apartments.map((apt) => (
          <div
            key={apt.id}
            className="w-44 shrink-0 sm:w-56"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onHoverCard(apt, {
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
              });
            }}
            onMouseLeave={onLeaveCard}
          >
            <ApartmentCard
              name={apt.name}
              location={apt.location}
              price={apt.price}
              rating={apt.rating}
              isVerified={apt.isVerified}
              thumbnailUrl={apt.image}
              isFavorite={isFavorite(apt.id)}
              isFavoriteLoading={activeFavoriteId === apt.id}
              onFavoritePress={() => {
                onToggleFavorite(apt.id);
              }}
              onPress={() => onPressApartment(apt.id)}
            />
          </div>
        ))}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label={`Scroll ${section.title} left`}
          onClick={() => scrollRow(-1)}
          className={leftStripClass}
        >
          <ChevronLeft size={28} className="text-foreground" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label={`Scroll ${section.title} right`}
          onClick={() => scrollRow(1)}
          className={rightStripClass}
        >
          <ChevronRight size={28} className="text-foreground" />
        </button>
      )}
    </div>
  );
}

export default function BrowseSectionsList({ sections, basePath = "/browse" }: BrowseSectionsListProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);
  const [preview, setPreview] = useState<HoveredCard | null>(null);
  const expandTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (expandTimer.current) clearTimeout(expandTimer.current);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    expandTimer.current = null;
    collapseTimer.current = null;
  };

  // Hover intent lives entirely in event handlers: expand after a dwell so
  // casual mouse passes never pop the preview, collapse shortly after leave.
  const handleHoverCard = useCallback((apartment: BrowseApartment, rect: HoveredCard["rect"]) => {
    if (!canHoverPreview()) return;
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
    if (expandTimer.current) clearTimeout(expandTimer.current);
    expandTimer.current = setTimeout(() => {
      setPreview({ apartment, rect });
    }, HOVER_EXPAND_DELAY_MS);
  }, []);

  const handleLeaveCard = useCallback(() => {
    if (expandTimer.current) clearTimeout(expandTimer.current);
    expandTimer.current = null;
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => {
      setPreview(null);
    }, HOVER_COLLAPSE_DELAY_MS);
  }, []);

  const handleKeepPreview = useCallback(() => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = null;
  }, []);

  const dismissPreview = useCallback(() => {
    clearTimers();
    setPreview(null);
  }, []);

  // Dismissal subscriptions only: scroll (captured, covers row swipes),
  // resize (position would be stale), Escape. State updates happen in these
  // event callbacks, never synchronously in the effect body.
  useEffect(() => {
    const onScroll = () => dismissPreview();
    const onResize = () => dismissPreview();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissPreview();
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      clearTimers();
    };
  }, [dismissPreview]);

  const handleFavoriteToggle = async (apartmentId: string) => {
    setActiveFavoriteId(apartmentId);

    try {
      const nextValue = await toggleFavorite(apartmentId);
      if (nextValue) {
        toast.success("Saved to favorites");
      } else {
        toast("Removed from favorites");
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };

      if (error?.code === "AUTH_REQUIRED") {
        setIsAuthModalOpen(true);
        return;
      }

      if (error?.code === "NOT_TENANT") {
        toast.warning(error?.message ?? "Only tenants can save favorites");
        return;
      }

      toast.danger(error?.message ?? "Unable to update favorites");
    } finally {
      setActiveFavoriteId(null);
    }
  };

  const handlePressApartment = (apartmentId: string) => {
    dismissPreview();
    router.push(`${basePath}/${apartmentId}`);
  };

  const handleToggleFavorite = (apartmentId: string) => {
    void handleFavoriteToggle(apartmentId);
  };

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      {sections.map((section) => (
        <section key={section.id} aria-label={section.title} className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
            <h3 className="min-w-0 truncate text-lg font-medium">
              {section.title}
            </h3>
            {section.seeAllHref ? (
              <Link
                href={section.seeAllHref}
                className="flex shrink-0 items-center gap-0.5 rounded-full text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`See all ${section.title}`}
              >
                See All
                <ChevronRight size={18} />
              </Link>
            ) : null}
          </div>

          <SectionRow
            section={section}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onPressApartment={handlePressApartment}
            onHoverCard={handleHoverCard}
            onLeaveCard={handleLeaveCard}
            activeFavoriteId={activeFavoriteId}
          />
        </section>
      ))}

      <AnimatePresence>
        {preview && (
          <ApartmentHoverPreview
            key={preview.apartment.id}
            apartment={preview.apartment}
            style={previewPosition(preview.rect)}
            isFavorite={isFavorite(preview.apartment.id)}
            isFavoriteLoading={activeFavoriteId === preview.apartment.id}
            onFavoritePress={() => handleToggleFavorite(preview.apartment.id)}
            onViewDetails={() => handlePressApartment(preview.apartment.id)}
            onMouseEnter={handleKeepPreview}
            onMouseLeave={dismissPreview}
          />
        )}
      </AnimatePresence>

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        title="Sign in to save favorites"
        description="Create an account to save apartments and access them anytime."
      />
    </div>
  );
}
