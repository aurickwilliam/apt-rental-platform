"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "@heroui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import ApartmentCard from "../../components/ui/ApartmentCard";
import AuthPromptModal from "@/app/components/ui/AuthPromptModal";
import { useFavorites } from "@/hooks/use-favorites";
import type { BrowseSection } from "../lib/fetch-browse-sections";

interface BrowseSectionsListProps {
  sections: BrowseSection[];
  basePath?: string;
}

interface SectionRowProps {
  section: BrowseSection;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (apartmentId: string) => void;
  onPressApartment: (apartmentId: string) => void;
  activeFavoriteId: string | null;
}

// One horizontally scrolling row with Netflix-style hover-reveal edge arrows
// (desktop only). Arrows hide at each scroll end and when the row fits.
function SectionRow({
  section,
  isFavorite,
  onToggleFavorite,
  onPressApartment,
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
  const leftStripClass = `${stripBase} left-0 bg-gradient-to-r from-white via-white/80 to-transparent`;
  const rightStripClass = `${stripBase} right-0 bg-gradient-to-l from-white via-white/80 to-transparent`;

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
            activeFavoriteId={activeFavoriteId}
          />
        </section>
      ))}

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        title="Sign in to save favorites"
        description="Create an account to save apartments and access them anytime."
      />
    </div>
  );
}
