"use client";

import {
  IconBuilding,
  IconFileText,
  IconLayoutDashboard,
  IconShieldCheck,
  IconTrendingUp,
  IconWallet,
} from "@tabler/icons-react";
import AnalyticsSection, {
  SectionHeading,
} from "./components/AnalyticsSection";
import SnapshotCard from "./components/SnapshotCard";
import PlatformGrowthPanel from "./components/PlatformGrowthPanel";
import NewUsersByRolePanel from "./components/NewUsersByRolePanel";
import VerificationActivityPanel from "./components/VerificationActivityPanel";
import ApplicationsTenanciesPanel from "./components/ApplicationsTenanciesPanel";
import RentalPaymentsPanel from "./components/RentalPaymentsPanel";
import MaintenanceRequestsPanel from "./components/MaintenanceRequestsPanel";
import ListingStatusPanel from "./components/ListingStatusPanel";
import ListingsByCityPanel from "./components/ListingsByCityPanel";
import ApplicationStatusPanel from "./components/ApplicationStatusPanel";
import { numberFormat, periodLabel } from "./components/analytics-format";
import type {
  AnalyticsMetrics,
  AnalyticsTrend,
  ApplicationStatusCounts,
  ListingCityCount,
  ListingStatus,
  PaymentTrend,
} from "./types";

interface AnalyticsPanelsProps {
  metrics: AnalyticsMetrics;
  trends: AnalyticsTrend[] | null;
  paymentTrends: PaymentTrend[] | null;
  listingStatus: ListingStatus | null;
  listingsByCity: ListingCityCount[] | null;
  applicationStatus: ApplicationStatusCounts | null;
  from: string;
  to: string;
}

export default function AnalyticsPanels({
  metrics,
  trends,
  paymentTrends,
  listingStatus,
  listingsByCity,
  applicationStatus,
  from,
  to,
}: AnalyticsPanelsProps) {
  const pendingVerifications =
    metrics.userVerifications.pending + metrics.apartmentVerifications.pending;
  const period = periodLabel(from, to);

  return (
    <div className="space-y-6">
      <section aria-labelledby="snapshot-heading" className="space-y-3">
        <SectionHeading
          id="snapshot-heading"
          title="Current Snapshot"
          icon={IconLayoutDashboard}
        />
        <dl className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <SnapshotCard
            title="Users"
            value={metrics.users.total}
            detail={`${numberFormat.format(metrics.users.tenants)} tenants · ${numberFormat.format(metrics.users.landlords)} landlords now`}
          />
          <SnapshotCard
            title="Listings"
            value={metrics.apartments.total}
            detail={`${numberFormat.format(metrics.apartments.available)} available · ${numberFormat.format(metrics.tenancies.occupiedUnits)} occupied units now`}
          />
          <SnapshotCard
            title="Active tenancies"
            value={metrics.tenancies.active}
            detail={`${numberFormat.format(metrics.tenancies.new)} new this period`}
          />
          <SnapshotCard
            title="Verification"
            value={metrics.apartments.verified}
            valueLabel="verified listings"
            detail={`${numberFormat.format(metrics.users.verified)} verified users · ${numberFormat.format(pendingVerifications)} pending now`}
          />
        </dl>
      </section>

      <AnalyticsSection
        id="growth-heading"
        title="Growth"
        icon={IconTrendingUp}
        gridClassName="grid-cols-1"
      >
        <PlatformGrowthPanel
          metrics={metrics}
          trends={trends}
          period={period}
        />
        <NewUsersByRolePanel
          metrics={metrics}
          trends={trends}
          period={period}
        />
      </AnalyticsSection>

      <AnalyticsSection
        id="rental-activity-heading"
        title="Verification and Rental Activity"
        icon={IconShieldCheck}
      >
        <VerificationActivityPanel metrics={metrics} />
        <ApplicationsTenanciesPanel metrics={metrics} />
      </AnalyticsSection>

      <AnalyticsSection
        id="financial-operations-heading"
        title="Financial and Operations"
        icon={IconWallet}
        gridClassName="lg:grid-cols-2 xl:grid-cols-4"
      >
        <RentalPaymentsPanel
          paymentTrends={paymentTrends}
          className="xl:col-span-3"
        />
        <MaintenanceRequestsPanel maintenance={metrics.maintenance} />
      </AnalyticsSection>

      <AnalyticsSection
        id="marketplace-heading"
        title="Marketplace / Inventory"
        icon={IconBuilding}
      >
        <ListingStatusPanel listingStatus={listingStatus} />
        <ListingsByCityPanel listingsByCity={listingsByCity} />
      </AnalyticsSection>

      <AnalyticsSection
        id="applications-heading"
        title="Applications"
        icon={IconFileText}
      >
        <ApplicationStatusPanel applicationStatus={applicationStatus} />
      </AnalyticsSection>
    </div>
  );
}
