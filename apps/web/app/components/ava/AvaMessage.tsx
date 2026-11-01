"use client";

import Link from "next/link";
import { Button } from "@heroui/react";
import { IconArrowRight } from "@tabler/icons-react";

import ApartmentCard from "@/app/components/ui/ApartmentCard";
import type { AvaChatMessage } from "@/hooks/use-ava-chat";

interface AvaMessageProps {
  message: AvaChatMessage;
  onOpenListing: (apartmentId: string) => void;
  seeAllHref: (params: Record<string, string>) => string;
  onQuickReply: (text: string) => void;
  onNavigate: () => void;
  isFavorite: (apartmentId: string) => boolean;
  favoriteLoadingId: string | null;
  onToggleFavorite: (apartmentId: string) => void;
}

// The tenant's messages sit in a soft bubble on the right; Ava's replies read
// as plain full-width text, with the listings and quick replies below.
export default function AvaMessage({
  message,
  onOpenListing,
  seeAllHref,
  onQuickReply,
  onNavigate,
  isFavorite,
  favoriteLoadingId,
  onToggleFavorite,
}: AvaMessageProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap rounded-3xl bg-muted px-4 py-2.5 text-sm leading-6 text-foreground">
          {message.text}
        </p>
      </div>
    );
  }

  const listings = message.listings ?? [];

  return (
    <div className="flex flex-col gap-3">
      <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{message.text}</p>

      {listings.length > 0 && (
        <>
          <ul className="grid grid-cols-2 gap-3" aria-label="Matching apartments">
            {listings.map((listing) => (
              <li key={listing.id} className="min-w-0">
                <ApartmentCard
                  name={listing.name}
                  location={listing.location}
                  price={listing.price}
                  rating={listing.rating}
                  isVerified={listing.isVerified}
                  thumbnailUrl={listing.image}
                  isFavorite={isFavorite(listing.id)}
                  isFavoriteLoading={favoriteLoadingId === listing.id}
                  onFavoritePress={() => onToggleFavorite(listing.id)}
                  onPress={() => onOpenListing(listing.id)}
                  sizes="200px"
                />
              </li>
            ))}
          </ul>

          {message.browseParams && (
            <Link
              href={seeAllHref(message.browseParams)}
              onClick={onNavigate}
              className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-brand hover:underline"
            >
              See all results
              <IconArrowRight size={16} aria-hidden />
            </Link>
          )}
        </>
      )}

      {message.quickReplies && message.quickReplies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.quickReplies.map((quickReply) => (
            <Button
              key={quickReply}
              size="sm"
              variant="tertiary"
              onPress={() => onQuickReply(quickReply)}
              aria-label={`Send suggestion: ${quickReply}`}
              className="h-auto cursor-pointer rounded-full px-3 py-1.5 text-sm"
            >
              {quickReply}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
