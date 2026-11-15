"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Button, toast } from "@heroui/react";
import { IconCircleCheck } from "@tabler/icons-react";

import { useTenancy } from "@/hooks/use-tenancy";
import { useAuthIdentity } from "@/hooks/use-auth-identity";
import { useSignedLeaseViewer } from "@/hooks/use-signed-lease-viewer";
import { useMaintenanceRequestHistory } from "@/hooks/use-maintenance-request-history";
import { getContactConversationKey } from "@/lib/conversation-contacts";
import { landlordProfileHref } from "@/lib/public-profile";

import type { PaymentHistoryItem } from "./types";
import { buildRentalSummary } from "./rental-summary";
import { formatAddress, formatMonthYear, formatShortDate, normalizePaymentStatus } from "./utils";

import DashboardCard from "./components/DashboardCard";
import RentalHero from "./components/RentalHero";
import PaymentSummaryCard from "./components/PaymentSummaryCard";
import RentalQuickActions from "./components/RentalQuickActions";
import RentalLandlordCard from "./components/RentalLandlordCard";
import RentalMaintenanceCard from "./components/RentalMaintenanceCard";
import PaymentHistoryCard from "./components/PaymentHistoryCard";
import RentFinanceError from "./components/RentFinanceError";
import SignedLeaseCard from "./components/SignedLeaseCard";
import LeaseOverviewCard from "./components/LeaseOverviewCard";
import LeaseRenewalEntry from "@/app/components/renewals/LeaseRenewalEntry";
import StatusChip from "@/app/components/display/StatusChip";
import ApplicationsList from "./components/ApplicationsList";
import RentalApplications from "./components/RentalApplications";
import MyRentalSkeleton from "./components/MyRentalSkeleton";
import RentFinanceSkeleton from "./components/RentFinanceSkeleton";
import type { InitialRentalContext } from "@/service/tenancy-context";

export default function MyRentalClient({ initialContext }: { initialContext: InitialRentalContext }) {
  const identity = useAuthIdentity(initialContext.authUserId);
  const seed = identity.authUserId === initialContext.authUserId && identity.generation === 0 ? initialContext : undefined;
  // Retire *all* account-owned sections and pending callbacks, not just finance.
  return <RentalContent key={`${identity.authUserId ?? "none"}:${identity.generation}:${seed?.renderedAt ?? "browser"}`} initialContext={seed} />;
}

function RentalContent({ initialContext }: { initialContext?: InitialRentalContext }) {
  const {
    tenancy,
    payments,
    currentPayment,
    loading,
    error,
    financeLoading,
    financeError,
    paymentError,
    refetch,
    revalidate,
    retryFinance,
  } = useTenancy(initialContext);
  const bill = tenancy?.bill ?? null;
  const {
    requests: maintenanceRequests,
    loading: maintenanceLoading,
    error: maintenanceError,
  } = useMaintenanceRequestHistory(tenancy?.apartment.id ?? null, initialContext?.tenantId, false);
  const { viewSignedLease, viewing: viewingSignedLease } = useSignedLeaseViewer();

  const renderedAt = initialContext?.renderedAt;
  const today = useMemo(() => renderedAt ? new Date(renderedAt) : new Date(), [renderedAt]);

  // Pending maintenance fees ride on top of the next rent (fee_status 'pending').
  const [legacyFees, setPendingFees] = useState<{ tenancyId: string | null; fees: { title: string; amount: number }[] }>({ tenancyId: null, fees: [] });
  const apartmentIdForFees = tenancy?.apartment.id ?? null;
  const tenancyIdForFees = tenancy?.id ?? null;
  useEffect(() => {
    if (financeLoading || financeError) return;
    if (!apartmentIdForFees || !tenancyIdForFees || bill) return;
    const apartmentId = apartmentIdForFees;
    const tenancyId = tenancyIdForFees;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void (async () => {
        try {
          const { getTenantContext } = await import("@/service/favoritesService");
          const context = await getTenantContext();
          if (!context.tenantId || cancelled) return;
          const { fetchPendingMaintenanceFees } = await import("@/service/maintenanceService");
          const fees = await fetchPendingMaintenanceFees(apartmentId, context.tenantId, tenancyId);
          if (!cancelled) setPendingFees({ tenancyId, fees });
        } catch {
          // Fees are additive info only — a failed lookup must not break the page.
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [apartmentIdForFees, tenancyIdForFees, bill, financeError, financeLoading]);
  const pendingFees = bill?.fees ?? (legacyFees.tenancyId === tenancy?.id ? legacyFees.fees : []);

  // Web has no notification feed, so an unconfirmed contract gets one toast per
  // upload while the card below carries the actual confirmation.
  const leaseNudgeKey =
    tenancy?.signed_lease_path && !tenancy.tenant_acknowledged_at
      ? `${tenancy.id}:${tenancy.signed_lease_path}`
      : null;
  const nudgedLeaseRef = useRef<string | null>(null);
  useEffect(() => {
    if (!leaseNudgeKey || nudgedLeaseRef.current === leaseNudgeKey) return;
    nudgedLeaseRef.current = leaseNudgeKey;
    toast.info("Signed lease ready for review", {
      description: "Your landlord uploaded the signed lease. Open it below and confirm it matches your agreement.",
    });
  }, [leaseNudgeKey]);

  if (loading) {
    return <MyRentalSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="px-4 py-6 sm:py-8 space-y-4 w-full flex-1 flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100dvh - 4rem)" }}
        >
          <DashboardCard className="max-w-xl w-full">
            <div className="flex flex-col items-center gap-4 text-center px-6 py-10">
              <p className="font-inter text-sm text-muted-foreground">{error}</p>
              <Button className="cursor-pointer" onPress={() => void refetch()}>
                Try Again
              </Button>
            </div>
          </DashboardCard>
        </div>
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-4 py-6 sm:py-8 space-y-4">
          <Suspense fallback={<ApplicationsList applications={[]} loading error={null} />}>
            <RentalApplications tenantId={initialContext?.tenantId} initial={initialContext?.applications} />
          </Suspense>
        </div>
      </div>
    );
  }

  const apartment = tenancy.apartment;
  const landlord = tenancy.landlord;
  const cover =
    apartment.apartment_images?.find((img) => img.is_cover)?.url ??
    apartment.apartment_images?.[0]?.url ??
    null;
  const descriptionHref = `/tenant/browse/${apartment.id}`;

  const summary = buildRentalSummary({ tenancy, payments, currentPayment, pendingFees, today });
  const financeFailed = Boolean(financeError || paymentError);

  const paymentHistory: PaymentHistoryItem[] = payments.map((payment) => {
    const paymentDate = payment.date ?? payment.period_start ?? payment.period_end ?? today.toISOString();
    const paymentLabel = payment.billing_kind === "lease_renewal" ? "Lease Renewal"
      : payment.billing_kind === "move_in" ? "Move-in payment"
      : payment.billing_kind === "fees" ? "Maintenance fees" : "Monthly rent";
    return {
      id: payment.id,
      date: formatShortDate(paymentDate),
      description: payment.period_start ? `${formatMonthYear(payment.period_start)} - ${paymentLabel}` : paymentLabel,
      amount: payment.amount ?? summary.monthlyRent,
      status: normalizePaymentStatus(payment.status),
    };
  });

  const handleViewSignedLease = async () => {
    if (!tenancy.signed_lease_path) {
      toast.info("Your landlord has not uploaded the signed lease yet.");
      return;
    }
    const viewError = await viewSignedLease(tenancy.signed_lease_path);
    if (viewError) toast.danger(viewError);
  };

  const messageHref = landlord
    ? `/tenant/messages?conversation=${encodeURIComponent(getContactConversationKey(landlord.id, apartment.id))}`
    : null;

  // Hero and payment card share the first row; the sections below reuse the
  // same two tracks so their edges line up.
  const twoColumns = "grid min-w-0 gap-3 @min-[56rem]/rental:grid-cols-[minmax(0,1.7fr)_minmax(20rem,1fr)]";

  return (
    <div className="min-h-screen bg-background">
      <div className="@container/rental min-w-0 space-y-3 px-4 py-6 sm:py-8">
        <div className={twoColumns}>
          <RentalHero
            name={apartment.name}
            address={formatAddress(apartment)}
            imageUrl={cover}
            descriptionHref={descriptionHref}
            topRight={
              <StatusChip className="font-nunito text-[11px] font-semibold" tone="success">
                <span className="flex items-center gap-1"><IconCircleCheck size={14} aria-hidden="true" />Active lease</span>
              </StatusChip>
            }
          />

          {financeLoading ? (
            <RentFinanceSkeleton />
          ) : financeError ? (
            <RentFinanceError message={financeError} onRetry={() => void retryFinance()} />
          ) : paymentError ? (
            <RentFinanceError
              message="Payment history couldn't load, so your balance can't be confirmed."
              onRetry={() => void retryFinance()}
            />
          ) : (
            <PaymentSummaryCard summary={summary} />
          )}
        </div>

        <RentalQuickActions
          apartmentId={apartment.id}
          messageHref={messageHref}
          onViewSignedLease={() => void handleViewSignedLease()}
        />

        <div className={`${twoColumns} @min-[56rem]/rental:items-start`}>
          <div className="flex min-w-0 flex-col gap-3">
            <RentalMaintenanceCard requests={maintenanceRequests} loading={maintenanceLoading} error={maintenanceError} />

            <PaymentHistoryCard
              rows={paymentHistory}
              loading={financeLoading}
              failed={financeFailed}
              onRetry={() => void retryFinance()}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            {landlord && messageHref ? (
              <RentalLandlordCard
                landlord={landlord}
                profileHref={landlordProfileHref("tenant", landlord.id, apartment.id)}
                messageHref={messageHref}
              />
            ) : null}

            <LeaseOverviewCard
              leaseStart={tenancy.lease_start}
              leaseEnd={tenancy.lease_end}
              monthlyRent={tenancy.monthly_rent ?? apartment.monthly_rent}
              rentDueDay={tenancy.rent_due_day}
              today={today}
            >
              <SignedLeaseCard
                embedded
                key={`${tenancy.id}:${tenancy.signed_lease_path ?? "none"}`}
                tenancyId={tenancy.id}
                path={tenancy.signed_lease_path}
                uploadedAt={tenancy.signed_lease_uploaded_at}
                acknowledgedAt={tenancy.tenant_acknowledged_at}
                onView={() => void handleViewSignedLease()}
                viewing={viewingSignedLease}
                onAcknowledged={async () => {
                  return revalidate();
                }}
              />
            </LeaseOverviewCard>

            <LeaseRenewalEntry key={`renewal:${tenancy.id}`} tenancyId={tenancy.id} portal="tenant" />

            {/* Rarely needed once a lease is active, so it closes the lease column. */}
            <Suspense fallback={null}>
              <RentalApplications activeLease tenantId={initialContext?.tenantId} initial={initialContext?.applications} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
