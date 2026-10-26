"use client";

import { useCallback, useState } from "react";

import { toast } from "@heroui/react";

import { useFavorites } from "@/hooks/use-favorites";

// Heart-button behavior for card lists: toggle with a toast, and surface the
// sign-in prompt for signed-out visitors. Same outcomes as the Browse grid.
export function useFavoriteActions() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);

  const onToggleFavorite = useCallback(
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

  return { isFavorite, activeFavoriteId, onToggleFavorite, isAuthModalOpen, setIsAuthModalOpen };
}
