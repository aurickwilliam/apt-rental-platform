"use client";

import { Skeleton } from "@heroui/react";

import { useTranslation } from "@/app/components/i18n/LocaleProvider";
import { FavoritesPageHeader, FavoritesPageShell } from "./FavoritesPageLayout";

interface FavoritesCardsSkeletonProps {
  viewMode?: "grid" | "list";
}

export function FavoritesCardsSkeleton({ viewMode = "grid" }: FavoritesCardsSkeletonProps) {
  const { t } = useTranslation();

  return (
    <div
      className={viewMode === "grid" ? "grid grid-cols-1 gap-5 @min-[36rem]/favorites:grid-cols-2 @min-[64rem]/favorites:grid-cols-3" : "space-y-4"}
      aria-busy="true"
      aria-label={t("favorites.skeleton.loading")}
    >
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className={`overflow-hidden rounded-2xl border border-border bg-card ${viewMode === "list" ? "flex flex-col @min-[36rem]/favorites:flex-row" : ""}`}>
          <Skeleton className={viewMode === "grid" ? "aspect-[4/3] w-full rounded-none" : "h-48 w-full shrink-0 rounded-none @min-[36rem]/favorites:h-auto @min-[36rem]/favorites:w-56"} />
          <div className="min-w-0 flex-1 space-y-3 p-4">
            <Skeleton className="h-6 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
            <div className="flex items-center justify-between gap-3 pt-4">
              <Skeleton className="h-5 w-28 rounded-lg" />
              <Skeleton className="h-5 w-12 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FavoritesPageSkeleton() {
  const { t } = useTranslation();

  return (
    <FavoritesPageShell>
      <FavoritesPageHeader />
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4"
        aria-busy="true"
        aria-label={t("favorites.skeleton.toolbar")}
      >
        <Skeleton className="h-4 w-40 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-full" />
      </div>
      <FavoritesCardsSkeleton />
    </FavoritesPageShell>
  );
}
