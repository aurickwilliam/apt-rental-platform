"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import { addToast } from "@heroui/toast";
import { Heart } from "lucide-react";

import AuthPromptModal from "@/app/components/ui/AuthPromptModal";
import { useFavorites } from "@/hooks/use-favorites";

interface FavoriteBtnProps {
  apartmentId: string;
}

export default function FavoriteBtn({ apartmentId }: FavoriteBtnProps) {
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const favorited = isFavorite(apartmentId);

  const handleToggleFavorite = async () => {
    setIsSaving(true);

    try {
      const nextValue = await toggleFavorite(apartmentId);
      addToast({
        title: nextValue ? "Saved to favorites" : "Removed from favorites",
        severity: nextValue ? "success" : "default",
        color: nextValue ? "primary" : "default",
      });
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };

      if (error?.code === "AUTH_REQUIRED") {
        setIsAuthModalOpen(true);
        return;
      }

      if (error?.code === "NOT_TENANT") {
        addToast({
          title: error?.message ?? "Only tenants can save favorites",
          severity: "warning",
          color: "warning",
        });
        return;
      }

      addToast({
        title: error?.message ?? "Unable to update favorites",
        severity: "danger",
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="light"
        size="md"
        radius="full"
        isIconOnly
        isLoading={isSaving}
        isDisabled={loading}
        onPress={handleToggleFavorite}
      >
        <Heart
          size={20}
          className={favorited ? "text-red-500" : "text-default-500"}
          fill={favorited ? "currentColor" : "none"}
        />
      </Button>

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        title="Sign in to save favorites"
        description="Create an account to save apartments and access them anytime."
      />
    </>
  );
}
