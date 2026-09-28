"use client";

import { COLORS } from "@repo/constants";
import type { ChartConfig } from "@/components/ui/chart";
import type { ListingStatus } from "../types";
import Panel from "./Panel";
import StatusDonut from "./StatusDonut";

const listingConfig = {
  available: { label: "Available", color: COLORS.light.success },
  occupied: { label: "Occupied", color: "var(--primary)" },
  hidden: { label: "Hidden", color: "var(--destructive)" },
  pending_verification: {
    label: "Pending verification",
    color: COLORS.light.warning,
  },
  other: { label: "Other", color: "var(--muted-foreground)" },
} satisfies ChartConfig;

interface ListingStatusPanelProps {
  listingStatus: ListingStatus | null;
}

export default function ListingStatusPanel({
  listingStatus,
}: ListingStatusPanelProps) {
  const listingSlices = listingStatus
    ? [
        { name: "available", value: listingStatus.available },
        { name: "occupied", value: listingStatus.occupied },
        { name: "hidden", value: listingStatus.hidden },
        {
          name: "pending_verification",
          value: listingStatus.pending_verification,
        },
        ...(listingStatus.other
          ? [{ name: "other", value: listingStatus.other }]
          : []),
      ]
    : [];
  return (
    <Panel
      title="Listing Status"
      description="Current inventory · non-deleted listings, regardless of the selected reporting period."
    >
      {listingStatus === null ? (
        <p
          className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
          role="status"
        >
          Listing inventory is unavailable. Refresh and try again.
        </p>
      ) : listingStatus.total ? (
        <>
          <StatusDonut
            data={listingSlices}
            config={listingConfig}
            total={listingStatus.total}
            centerLabel="Listings"
            showPercent
            className="lg:flex-col 2xl:flex-row"
            chartClassName="lg:size-40 2xl:size-52"
          />
          <p className="mt-4 text-xs text-muted-foreground">
            Each listing is counted once: hidden first, then pending
            verification, then occupied or available.
            {listingStatus.other
              ? " Other covers remaining availability statuses, such as under maintenance or unverified."
              : ""}
          </p>
        </>
      ) : (
        <p
          className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground"
          role="status"
        >
          No listings in the current inventory.
        </p>
      )}
    </Panel>
  );
}
