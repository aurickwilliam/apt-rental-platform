"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

import { toast, Button } from "@heroui/react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import ApartmentCard from "../../components/ui/ApartmentCard";
import AuthPromptModal from "@/app/components/ui/AuthPromptModal";
import { useFavorites } from "@/hooks/use-favorites";
import { useRememberRecentApartment } from "@/hooks/use-recent-apartment-searches";
import type { BrowseApartment } from "../lib/fetch-browse-results";
import type { BrowseSection } from "../lib/fetch-browse-sections";
import BrowseSeeAllPending from "./BrowseSeeAllPending";
import {
  previewPosition,
  useHoverPreview,
  type HoveredCardRect,
} from "./use-hover-preview";

const ApartmentHoverPreview = dynamic(() => import("./ApartmentHoverPreview"));

interface BrowseSectionsListProps {
  sections: BrowseSection[];
  basePath?: string;
}

interface SectionRowProps {
  section: BrowseSection;
  sectionIndex: number;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (apartmentId: string) => void;
  onPressApartment: (apartmentId: string) => void;
  onHoverCard: (apartment: BrowseApartment, rect: HoveredCardRect) => void;
  onLeaveCard: () => void;
  activeFavoriteId: string | null;
}

// Memoized like the grid items: hover-preview state at the list root must
// not redraw every row. Re-renders only when this section's data or a
// handler identity changes. Edge arrows hide at each scroll end and when
// the row fits without scrolling.
const SectionRow = memo(function SectionRow({
  section,
  sectionIndex,
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
  // lands on a card. Base is hidden: revealed on row hover only on devices
  // with a fine pointer + hover (mouse/trackpad) at any viewport width, so
  // narrow PC windows get the same arrows as full-width. Touch phones stay
  // swipe-only with no arrow clutter.
  const stripBase =
    "absolute inset-y-0 z-10 hidden w-8 items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary md:w-12 [@media(hover:hover)_and_(pointer:fine)]:flex";
  const leftStripClass = `${stripBase} left-0 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-background dark:via-background/80 dark:to-transparent`;
  const rightStripClass = `${stripBase} right-0 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-background dark:via-background/80 dark:to-transparent`;

  return (
    <div className="group relative">
      <div
        ref={trackRef}
        className="flex w-full max-w-full gap-3 overflow-x-auto pb-2 [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
      >
        {section.apartments.map((apt, i) => (
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
              sizes="(max-width: 640px) 176px, 224px"
              priority={sectionIndex === 0 && i < 4}
            />
          </div>
        ))}
      </div>

      {canScrollLeft && (
        <Button
          variant="ghost"
          aria-label={`Scroll ${section.title} left`}
          onClick={() => scrollRow(-1)}
          className={`button--bare ${leftStripClass}`}
        >
          <IconChevronLeft size={28} className="text-foreground" />
        </Button>
      )}
      {canScrollRight && (
        <Button
          variant="ghost"
          aria-label={`Scroll ${section.title} right`}
          onClick={() => scrollRow(1)}
          className={`button--bare ${rightStripClass}`}
        >
          <IconChevronRight size={28} className="text-foreground" />
        </Button>
      )}
    </div>
  );
});

export default function BrowseSectionsList({ sections, basePath = "/browse" }: BrowseSectionsListProps) {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const rememberRecentApartment = useRememberRecentApartment();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);
  const {
    preview,
    handleHoverCard,
    handleLeaveCard,
    handleKeepPreview,
    dismissPreview,
  } = useHoverPreview();

  const handleFavoriteToggle = useCallback(
    async (apartmentId: string) => {
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
    },
    [toggleFavorite],
  );

  const handlePressApartment = useCallback(
    (apartmentId: string) => {
      dismissPreview();
      const apt = sections
        .flatMap((section) => section.apartments)
        .find((item) => item.id === apartmentId);
      if (apt) rememberRecentApartment(apt);
      router.push(`${basePath}/${apartmentId}`);
    },
    [basePath, dismissPreview, router, sections, rememberRecentApartment],
  );

  const handleToggleFavorite = useCallback(
    (apartmentId: string) => {
      void handleFavoriteToggle(apartmentId);
    },
    [handleFavoriteToggle],
  );

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-8">
      {sections.map((section, sectionIndex) => (
        <section key={section.id} aria-label={section.title} className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2 sm:mb-3">
            <div className="min-w-0">
              <h3 className="min-w-0 truncate font-nunito text-lg font-semibold">
                {section.title}
              </h3>
              {section.subtitle ? (
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {section.subtitle}
                </p>
              ) : null}
            </div>
            {section.seeAllHref ? (
              <Link
                href={section.seeAllHref}
                onNavigate={dismissPreview}
                className="flex shrink-0 items-center gap-0.5 rounded-full text-sm font-medium text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={`See all ${section.title}`}
              >
                See All
                <IconChevronRight size={18} />
                <BrowseSeeAllPending />
              </Link>
            ) : null}
          </div>

          <SectionRow
            section={section}
            sectionIndex={sectionIndex}
            isFavorite={isFavorite}
            onToggleFavorite={handleToggleFavorite}
            onPressApartment={handlePressApartment}
            onHoverCard={handleHoverCard}
            onLeaveCard={handleLeaveCard}
            activeFavoriteId={activeFavoriteId}
          />
        </section>
      ))}

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

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        title="Sign in to save favorites"
        description="Create an account to save apartments and access them anytime."
      />
    </div>
  );
}
