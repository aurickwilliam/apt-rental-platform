"use client";

import { useState } from "react";
import { Button, toast } from "@heroui/react";
import { IconHeart, IconHeartFilled } from "@tabler/icons-react";

import AuthPromptModal from "@/app/components/ui/AuthPromptModal";
import { useTranslation } from "@/app/components/i18n/LocaleProvider";

import { useFavorites } from "@/hooks/use-favorites";

interface FavoriteBtnProps {
  apartmentId: string;
}

export default function FavoriteBtn({ apartmentId }: FavoriteBtnProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite, loading } = useFavorites();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const favorited = isFavorite(apartmentId);

  const handleToggleFavorite = async () => {
    setIsSaving(true);

    try {
      const nextValue = await toggleFavorite(apartmentId);
      if (nextValue) {
        toast.success(t("favorites.saved"));
      } else {
        toast(t("favorites.removed"));
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };

      if (error?.code === "AUTH_REQUIRED") {
        setIsAuthModalOpen(true);
        return;
      }

      if (error?.code === "NOT_TENANT") {
        toast.warning(error?.message ?? t("favorites.tenantsOnly"));
        return;
      }

      toast.danger(error?.message ?? t("favorites.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="tertiary"
        size="md"
        isIconOnly
        aria-label={favorited ? t("favorites.remove.aria") : t("favorites.save.aria")}
        isPending={isSaving}
        isDisabled={loading}
        onPress={handleToggleFavorite}
      >
        {favorited ? (
          <IconHeartFilled size={20} className="text-red-500" />
        ) : (
          <IconHeart size={20} className="text-default-500" />
        )}
      </Button>

      <AuthPromptModal
        isOpen={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
        title={t("favorites.signInTitle")}
        description={t("favorites.signInBody")}
      />
    </>
  );
}
