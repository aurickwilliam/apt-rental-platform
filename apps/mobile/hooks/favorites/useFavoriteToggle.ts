import { useCallback } from "react";
import { useToast } from "heroui-native";
import { useFavorites } from "./useFavorites";

export function useFavoriteToggle() {
  const { toggleFavorite } = useFavorites();
  const { toast } = useToast();

  const toggleFavoriteWithToast = useCallback(
    async (apartmentId: string) => {
      try {
        const { wasFavorite } = await toggleFavorite(apartmentId);
        toast.show({
          variant: wasFavorite ? "default" : "success",
          label: wasFavorite ? "Removed from favorites" : "Added to favorites",
        });
        return { wasFavorite };
      } catch (error) {
        console.error("Error toggling favorite:", error);
        toast.show({ variant: "danger", label: "Something went wrong" });
        throw error;
      }
    },
    [toggleFavorite, toast],
  );

  return { toggleFavoriteWithToast };
}
