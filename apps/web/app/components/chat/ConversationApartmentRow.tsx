"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconBuilding, IconChevronRight } from "@tabler/icons-react";
import { formatPesoDisplay } from "@repo/utils";
import type { ConversationApartmentPresentation } from "@/lib/conversation-context";

interface ConversationApartmentRowProps {
  apartment: ConversationApartmentPresentation;
  hasApartmentId: boolean;
  loading: boolean;
}

export default function ConversationApartmentRow({ apartment, hasApartmentId, loading }: ConversationApartmentRowProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const content = (
    <>
      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted/50 text-muted-foreground">
        {apartment?.image && failedImage !== apartment.image ? (
          <Image src={apartment.image} alt="" fill sizes="44px" className="object-cover" unoptimized onError={() => setFailedImage(apartment.image)} />
        ) : <IconBuilding size={20} aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-nunito text-sm font-bold text-foreground" title={apartment?.title}>
          {loading ? "Loading apartment…" : apartment?.title ?? (hasApartmentId ? "Apartment unavailable" : "No apartment linked")}
        </span>
        {apartment?.location ? <span className="block truncate font-inter text-xs text-muted-foreground">{apartment.location}</span> : null}
        {!loading && !apartment ? <span className="block font-inter text-xs text-muted-foreground">{hasApartmentId ? "Details are no longer accessible." : "This conversation has no linked property."}</span> : null}
        {apartment?.rent ? <span className="mt-0.5 block font-nunito text-xs font-bold text-brand sm:hidden">{formatPesoDisplay(apartment.rent)} <span className="font-inter font-normal text-muted-foreground">/ month</span></span> : null}
      </span>
      {apartment?.rent ? <span className="hidden shrink-0 text-right font-nunito text-sm font-bold text-brand sm:block">{formatPesoDisplay(apartment.rent)}<span className="ml-1 font-inter text-xs font-normal text-muted-foreground">/ month</span></span> : null}
      {apartment ? <><span className="sr-only">View Apartment</span><IconChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" /></> : null}
    </>
  );
  const className = "flex min-w-0 items-center gap-3 px-4 py-2.5 sm:px-6";
  return (
    <div data-fab-clearance="conversation-apartment" data-conversation-apartment className="shrink-0 border-b border-border bg-card" aria-busy={loading}>
      {apartment ? <Link href={apartment.href} className={`${className} transition-colors hover:bg-secondary/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary`}>{content}</Link> : <div className={className}>{content}</div>}
    </div>
  );
}
