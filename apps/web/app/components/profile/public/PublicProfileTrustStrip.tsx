import type { ReactNode } from "react";

import StatusChip from "@/app/components/display/StatusChip";
import type { StatusTone } from "@/lib/status-tone";

export interface PublicProfileTrustItem {
  key: string;
  label: string;
  icon?: ReactNode;
  tone?: StatusTone;
  /** In-page target, e.g. the reviews section. */
  href?: string;
}

interface PublicProfileTrustStripProps {
  items: PublicProfileTrustItem[];
}

// The verification facts a visitor can check at a glance. Every item is backed
// by a database value (account status, is_verified, review rows); none of them
// is a score or an estimate.
export default function PublicProfileTrustStrip({ items }: PublicProfileTrustStripProps) {
  if (items.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Landlord verification">
      {items.map(({ key, label, icon, tone = "neutral", href }) => {
        const chip = (
          <StatusChip size="sm" tone={tone}>
            <span className="flex items-center gap-1">
              {icon}
              {label}
            </span>
          </StatusChip>
        );

        return (
          <li key={key}>
            {href ? (
              <a
                href={href}
                className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {chip}
              </a>
            ) : (
              chip
            )}
          </li>
        );
      })}
    </ul>
  );
}
