"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Pagination } from "@heroui/react";
import { addToast } from "@heroui/toast";

import ApartmentCard from "../../components/ui/ApartmentCard";
import AuthPromptModal from "@/app/components/ui/AuthPromptModal";
import { useFavorites } from "@/hooks/use-favorites";

interface ApartmentItem {
  id: string;
  name: string;
  location: string;
  price: number;
  rating: number;
  image: string;
}

interface RenderApartmentsProps {
  apartment: ApartmentItem[];
  page: number;
  totalCount: number;
  pageSize: number;
}

export default function RenderApartments({ apartment, page, totalCount, pageSize }: RenderApartmentsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(totalCount / pageSize);
  const { isFavorite, toggleFavorite } = useFavorites();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFavoriteId, setActiveFavoriteId] = useState<string | null>(null);

  const handlePageChange = (newPage: number) => {
    const current = new URLSearchParams(searchParams.toString());
    current.set("page", String(newPage));
    router.push(`/browse?${current.toString()}`);
  };

  const handleFavoriteToggle = async (apartmentId: string) => {
    setActiveFavoriteId(apartmentId);

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
      setActiveFavoriteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {apartment.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-default-400">
          <p className="text-lg font-medium">No apartments found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {apartment.map(apt => (
            <ApartmentCard
              key={apt.id}
              name={apt.name}
              location={apt.location}
              price={apt.price}
              rating={apt.rating}
              thumbnailUrl={apt.image}
              isFavorite={isFavorite(apt.id)}
              isFavoriteLoading={activeFavoriteId === apt.id}
              onFavoritePress={() => {
                void handleFavoriteToggle(apt.id);
              }}
              onPress={() => router.push(`/browse/${apt.id}`)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            total={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            radius="full"
            showControls
            classNames={{
              wrapper: "gap-3"
            }}
          />
        </div>
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
