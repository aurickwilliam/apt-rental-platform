"use client";

import { memo, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";

import { Pagination, toast } from "@heroui/react";

import ApartmentCard from "../../components/ui/ApartmentCard";
import AuthPromptModal from "@/app/components/ui/AuthPromptModal";
import { useFavorites } from "@/hooks/use-favorites";
import { useRememberRecentApartment } from "@/hooks/use-recent-apartment-searches";
import { BROWSE_GRID_CLASS } from "../lib/browse-layout";
import type { BrowseApartment } from "../lib/fetch-browse-results";
import {
  previewPosition,
  previewAnchor,
  useHoverPreview,
  type HoveredCardRect,
} from "./use-hover-preview";
import EmptyState from "@/app/components/display/EmptyState";
import { IconSearch } from "@tabler/icons-react";

const ApartmentHoverPreview = dynamic(() => import("./ApartmentHoverPreview"));

interface RenderApartmentsProps {
  apartment: BrowseApartment[];
  page: number;
  totalCount: number;
  pageSize: number;
  basePath?: string;
  /** Grid columns; beside the filter rail it has one column fewer. */
  gridClassName?: string;
}

// Memoized so list-level state (hover preview, page nav) never redraws
// every card: re-renders only when this card's data, favorite state, or a
// stable handler identity changes. Inline closures live inside, where they
// can't break the memo.
const ApartmentGridItem = memo(function ApartmentGridItem({
  apt,
  isFavorite,
  isFavoriteLoading,
  onPressApartment,
  onToggleFavorite,
  onHoverCard,
  onLeaveCard,
  priority,
  onFavoriteInteraction,
}: {
  apt: BrowseApartment;
  isFavorite: (id: string) => boolean;
  isFavoriteLoading: boolean;
  onPressApartment: (apartmentId: string) => void;
  onToggleFavorite: (apartmentId: string) => void;
  onHoverCard: (apartment: BrowseApartment, rect: HoveredCardRect) => void;
  onLeaveCard: () => void;
  priority: boolean;
  onFavoriteInteraction: () => void;
}) {
  return (
    <div
      className="min-w-0"
    >
      <ApartmentCard
        name={apt.name}
        onPreviewHover={(element) => onHoverCard(apt, previewAnchor(element))}
        onPreviewLeave={onLeaveCard}
        onFavoriteInteraction={onFavoriteInteraction}
        location={apt.location}
        price={apt.price}
        rating={apt.rating}
        isVerified={apt.isVerified}
        thumbnailUrl={apt.image}
        isFavorite={isFavorite(apt.id)}
        isFavoriteLoading={isFavoriteLoading}
        onFavoritePress={() => {
          onToggleFavorite(apt.id);
        }}
        onPress={() => onPressApartment(apt.id)}
        sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 25vw, 20vw"
        priority={priority}
      />
    </div>
  );
});

// Windowed page numbers so the control never overflows small screens:
// always show first/last, plus current ± 1, with ellipses for gaps.
function getVisiblePages(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [1];
  if (page > 3) pages.push("…");
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
    pages.push(p);
  }
  if (page < totalPages - 2) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export default function RenderApartments({
  apartment,
  page,
  totalCount,
  pageSize,
  basePath = "/browse",
  gridClassName = BROWSE_GRID_CLASS,
}: RenderApartmentsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / pageSize);
  const { isFavorite, toggleFavorite } = useFavorites();
  const rememberRecentApartment = useRememberRecentApartment();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);
  const {
    preview,
    isPreviewClosing,
    handleHoverCard,
    handleLeaveCard,
    handleKeepPreview,
    dismissPreview,
  } = useHoverPreview();

  const handlePageChange = (newPage: number) => {
    dismissPreview();
    const current = new URLSearchParams(searchParams.toString());
    current.set("page", String(newPage));
    router.push(`${basePath}?${current.toString()}`);
  };

  const handlePressApartment = useCallback(
    (apartmentId: string) => {
      dismissPreview();
      const apt = apartment.find((item) => item.id === apartmentId);
      if (apt) rememberRecentApartment(apt);
      router.push(`${basePath}/${apartmentId}`);
    },
    [apartment, basePath, dismissPreview, router, rememberRecentApartment],
  );

  const isVerifiedOnly = searchParams.get("verified") === "1";

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

  const handleToggleFavorite = useCallback(
    (apartmentId: string) => {
      void handleFavoriteToggle(apartmentId);
    },
    [handleFavoriteToggle],
  );

  return (
    <div data-browse-preview-bounds className="flex min-w-0 flex-col gap-4">
      {apartment.length === 0 ? (
        <EmptyState
          icon={IconSearch}
          title={isVerifiedOnly ? "No verified listings yet" : "No apartments found"}
          description="Try adjusting your filters"
        />
      ) : (
        <div className={gridClassName}>
          {apartment.map((apt, i) => (
            <ApartmentGridItem
              key={apt.id}
              apt={apt}
              isFavorite={isFavorite}
              isFavoriteLoading={activeFavoriteId === apt.id}
              onPressApartment={handlePressApartment}
              onToggleFavorite={handleToggleFavorite}
              onHoverCard={handleHoverCard}
              onLeaveCard={handleLeaveCard}
              priority={page === 1 && i < 4}
              onFavoriteInteraction={dismissPreview}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <div className="max-w-full overflow-x-auto">
          <Pagination className="justify-center">
            <Pagination.Content>
              <Pagination.Item>
                <Pagination.Previous
                  isDisabled={page === 1}
                  onPress={() => handlePageChange(page - 1)}
                >
                  <Pagination.PreviousIcon />
                  <span className="hidden sm:inline">Previous</span>
                </Pagination.Previous>
              </Pagination.Item>

              {getVisiblePages(page, totalPages).map((p, i) =>
                p === "…" ? (
                  <Pagination.Item key={`ellipsis-${i}`}>
                    <span className="px-2 text-default-400">…</span>
                  </Pagination.Item>
                ) : (
                  <Pagination.Item key={p}>
                    <Pagination.Link
                      isActive={p === page}
                      onPress={() => handlePageChange(p)}
                    >
                      {p}
                    </Pagination.Link>
                  </Pagination.Item>
                ),
              )}

              <Pagination.Item>
                <Pagination.Next
                  isDisabled={page === totalPages}
                  onPress={() => handlePageChange(page + 1)}
                >
                  <span className="hidden sm:inline">Next</span>
                  <Pagination.NextIcon />
                </Pagination.Next>
              </Pagination.Item>
            </Pagination.Content>
          </Pagination>
          </div>
        </div>
      )}

      {preview && (
        <ApartmentHoverPreview
          key={preview.apartment.id}
          apartment={preview.apartment}
          style={previewPosition(preview.rect)}
          isClosing={isPreviewClosing}
          isFavorite={isFavorite(preview.apartment.id)}
          isFavoriteLoading={activeFavoriteId === preview.apartment.id}
          onFavoritePress={() => handleToggleFavorite(preview.apartment.id)}
          onViewDetails={() => handlePressApartment(preview.apartment.id)}
          onMouseEnter={handleKeepPreview}
          onMouseLeave={handleLeaveCard}
          onDismiss={dismissPreview}
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
