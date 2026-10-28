import { IconShieldCheckFilled, IconShieldX } from "@tabler/icons-react";

import type { LandlordOwnershipDocument } from "@repo/constants";

interface PublicProfileDocumentsCardProps {
  title: string;
  documents: readonly LandlordOwnershipDocument[];
  /** Shown instead of the list when the landlord has added nothing. */
  emptyText: string;
}

// Side-column card listing a landlord's ownership documents, each with a status
// icon before its name: verified by an admin, or not verified yet. Names and status only.
export default function PublicProfileDocumentsCard({ title, documents, emptyText }: PublicProfileDocumentsCardProps) {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-border bg-card p-4 sm:p-5" aria-label={title}>
      <h2 className="font-nunito text-base font-bold">{title}</h2>
      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {documents.map(({ docType, isVerified }) => (
            <li key={docType} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span
                className={`flex shrink-0 items-center ${isVerified ? "text-success" : "text-muted-foreground"}`}
                title={isVerified ? "Verified by APT" : "Not verified yet"}
              >
                {isVerified ? (
                  <IconShieldCheckFilled size={20} aria-hidden="true" />
                ) : (
                  <IconShieldX size={20} aria-hidden="true" />
                )}
                <span className="sr-only">{isVerified ? "Verified" : "Not verified"}</span>
              </span>
              <span className="min-w-0 text-sm font-medium wrap-break-word">{docType}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
