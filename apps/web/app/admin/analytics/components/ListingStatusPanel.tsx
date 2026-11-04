"use client";

import { COLORS } from "@repo/constants";
import type { ChartConfig } from "@/components/ui/chart";
import type { ListingStatus } from "../types";
import Panel from "./Panel";
import StatusDonut from "./StatusDonut";
import EmptyState from "@/app/components/display/EmptyState";
import { IconBuilding, IconAlertCircle } from "@tabler/icons-react";

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
        <EmptyState
          framed
          className="mt-5 py-8"
          icon={IconAlertCircle}
          title="Listing inventory is unavailable"
          description="Refresh and try again."
        />
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
        <EmptyState
          framed
          className="mt-5 py-8"
          icon={IconBuilding}
          title="No listings yet"
          description="There are no listings in the current inventory."
        />
      )}
    </Panel>
  );
}
