"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Link, Modal, Spinner, Table, toast, useOverlayState } from "@heroui/react";
import { IconCreditCard as CreditCard, IconFileText as FileText, IconHistory as History, IconMessageCircle as MessageCircle, IconReceipt as Receipt, IconTool as Wrench, IconCircleCheck as CheckCircle2, IconClock as Clock, IconHome as House, IconCalendar as CalendarDays, IconCurrencyPeso as CurrencyPeso, IconChevronRight as ChevronRight, IconX as X } from "@tabler/icons-react";

import { formatPesoDisplay, getCurrentRentStatus, nextPaymentPeriod } from "@repo/utils";

import { useTenancy } from "@/hooks/use-tenancy";
import { useSignedLeaseViewer } from "@/hooks/use-signed-lease-viewer";
import { useTenantApplications } from "@/hooks/use-tenant-applications";
import UserAvatar from "@/app/components/profile/UserAvatar";
import { useMaintenanceRequestHistory } from "@/hooks/use-maintenance-request-history";

import { CATEGORIES } from "../maintenance/data/maintenance-data";
import type {
  MaintenanceStatus,
  PaymentStatus,
  PaymentHistoryItem,
} from "./types";

import DashboardCard from "./components/DashboardCard";
import RentalHero from "./components/RentalHero";
import SignedLeaseCard from "./components/SignedLeaseCard";
import StatusChip from "@/app/components/display/StatusChip";
import MiniCalendar from "./components/MiniCalendar";
import TenancyEmptyState from "./components/TenancyEmptyState";
import ApplicationsList from "./components/ApplicationsList";
import MyRentalSkeleton from "./components/MyRentalSkeleton";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizePaymentStatus(status?: string | null): PaymentStatus {
  const value = status?.toLowerCase() ?? "";
  if (value === "paid" || value === "completed") return "paid";
  if (value === "late" || value === "overdue") return "late";
  if (value === "rejected" || value === "declined") return "rejected";
  return "pending";
}

function statusBadge(status: PaymentStatus) {
  if (status === "paid") return <StatusChip className="font-nunito text-[11px] font-semibold" tone="success">Paid</StatusChip>;
  if (status === "late") return <StatusChip className="font-nunito text-[11px] font-semibold" tone="danger">Late</StatusChip>;
  if (status === "rejected") return <StatusChip className="font-nunito text-[11px] font-semibold" tone="danger">Rejected</StatusChip>;
  return <StatusChip className="font-nunito text-[11px] font-semibold" tone="warning">Pending</StatusChip>;
}

function maintenanceBadge(status: MaintenanceStatus) {
  if (status === "in_progress")
    return <StatusChip className="font-nunito text-[11px] font-semibold" tone="warning">In progress</StatusChip>;
  if (status === "resolved")
    return <StatusChip className="font-nunito text-[11px] font-semibold" tone="success">Done</StatusChip>;
  if (status === "cancelled")
    return <StatusChip className="font-nunito text-[11px] font-semibold" tone="danger">Cancelled</StatusChip>;
  return <StatusChip className="font-nunito text-[11px] font-semibold" tone="warning">Pending</StatusChip>;
}

function categoryLabel(value: string) {
  return CATEGORIES.find((c) => c.id === value)?.label ?? value;
}

function toPreviewStatus(
  status: "Pending" | "In Progress" | "Resolved" | "Cancelled",
): MaintenanceStatus {
  if (status === "In Progress") return "in_progress";
  if (status === "Resolved") return "resolved";
  if (status === "Cancelled") return "cancelled";
  return "pending";
}

function formatHeaderDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function formatMonthYear(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatShortDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatShortMonthDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAddress(apartment: {
  street_address: string;
  barangay: string;
  city: string;
  province: string;
}) {
  return [
    apartment.street_address,
    apartment.barangay,
    apartment.city,
    apartment.province,
  ]
    .filter(Boolean)
    .join(", ");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join("");
}

type QuickAction =
  | { label: string; icon: typeof House; tint: string; href: string }
  | { label: string; icon: typeof House; tint: string; onPress: () => void };

export default function MyRental() {
  const { tenancy, payments, currentPayment, loading, error, refetch } = useTenancy();
  const {
    applications,
    loading: applicationsLoading,
    error: applicationsError,
  } = useTenantApplications();
  const historyDialog = useOverlayState();
  const hasApplications = !applicationsLoading && applications.length > 0;
  const {
    requests: maintenanceRequests,
    loading: maintenanceLoading,
    error: maintenanceError,
  } = useMaintenanceRequestHistory(tenancy?.apartment.id ?? null);
  const { viewSignedLease, viewing: viewingSignedLease } = useSignedLeaseViewer();

  const today = useMemo(() => new Date(), []);
  const headerDate = useMemo(() => formatHeaderDate(today), [today]);

  // Pending maintenance fees ride on top of the next rent (fee_status 'pending').
  const [pendingFees, setPendingFees] = useState<{ title: string; amount: number }[]>([]);
  const apartmentIdForFees = tenancy?.apartment.id ?? null;
  useEffect(() => {
    if (!apartmentIdForFees) return;
    const apartmentId = apartmentIdForFees;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      void (async () => {
        try {
          const { getTenantContext } = await import("@/service/favoritesService");
          const context = await getTenantContext();
          if (!context.tenantId || cancelled) return;
          const { fetchPendingMaintenanceFees } = await import("@/service/maintenanceService");
          const fees = await fetchPendingMaintenanceFees(apartmentId, context.tenantId);
          if (!cancelled) setPendingFees(fees);
        } catch {
          // Fees are additive info only — a failed lookup must not break the page.
        }
      })();
    });
    return () => {
      cancelled = true;
    };
  }, [apartmentIdForFees]);

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
          className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-4 w-full flex-1 flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100dvh - 4rem)" }}
        >
          <DashboardCard className="max-w-xl w-full">
            <div className="flex flex-col items-center gap-4 text-center px-6 py-10">
              <p className="font-inter text-sm text-muted-foreground">{error}</p>
              <Button onPress={() => void refetch()}>
                Try Again
              </Button>
            </div>
          </DashboardCard>
        </div>
      </div>
    );
  }

  if (!tenancy) {
    if (applicationsLoading) {
      return <MyRentalSkeleton variant="applications" />;
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-4">
          {hasApplications || applicationsError ? (
            <ApplicationsList applications={applications} loading={false} error={applicationsError} />
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <House size={20} className="text-primary" />
                <h2 className="text-lg font-semibold text-card-foreground">My Rental</h2>
              </div>
              <TenancyEmptyState />
            </div>
          )}
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
  // The period being billed now, same rule as mobile and the server's rent
  // reminders: starts with the lease, due on the tenancy's due day.
  const rent = getCurrentRentStatus({ ...tenancy, currentPayment }, payments);
  const { monthlyRent } = rent;
  // Same full-amount guard as the payment page: a fully paid period can't be paid again.
  const isPeriodPaid = rent.isFullyPaid;
  const nextPeriod = nextPaymentPeriod(rent.periodStart, tenancy.rent_due_day);
  // This period's own payment row, once the tenant has started paying it.
  const periodPayment = payments.find((payment) => payment.period_start === rent.periodStart);
  const paymentStatus = normalizePaymentStatus(periodPayment?.status);

  // The next rent due: this period's, or the following one once it is paid.
  const dueDate = new Date(`${isPeriodPaid ? nextPeriod.dueDate : rent.dueDate}T00:00:00`);
  const dueDays = Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY);
  const dueLabel =
    dueDays < 0
      ? `Overdue by ${Math.abs(dueDays)} days`
      : `Due in ${dueDays} days`;

  const paymentPeriodLabel = formatMonthYear(rent.periodStart);

  const pendingFeesTotal = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);
  // Rent is always billed whole, with pending fees on top.
  const totalDue = monthlyRent + pendingFeesTotal;

  const paymentHistory: PaymentHistoryItem[] = payments.map((payment) => {
    const paymentDate =
      payment.date ??
      payment.period_start ??
      payment.period_end ??
      today.toISOString();
    const description = payment.period_start
      ? `${formatMonthYear(payment.period_start)} - Monthly rent`
      : "Monthly rent";

    return {
      id: payment.id,
      date: formatShortDate(paymentDate),
      description,
      amount: payment.amount ?? monthlyRent,
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

  const actions: QuickAction[] = [
    {
      label: "View Description",
      icon: House,
      href: `/tenant/browse/${apartment.id}`,
      tint: "blue",
    },
    {
      label: "Signed lease",
      icon: FileText,
      onPress: () => void handleViewSignedLease(),
      tint: "teal",
    },
    {
      label: "View receipts",
      icon: Receipt,
      href: "/tenant/payment/history",
      tint: "purple",
    },
    {
      label: "Maintenance",
      icon: Wrench,
      href: "/tenant/maintenance",
      tint: "orange",
    },
  ];

  const actionTints: Record<string, { card: string; iconBg: string; icon: string }> = {
    blue: {
      card: "bg-blue-50 dark:bg-blue-950/40",
      iconBg: "bg-blue-100 dark:bg-blue-900/50",
      icon: "text-blue-600 dark:text-blue-300",
    },
    teal: {
      card: "bg-teal-50 dark:bg-teal-950/40",
      iconBg: "bg-teal-100 dark:bg-teal-900/50",
      icon: "text-teal-600 dark:text-teal-300",
    },
    purple: {
      card: "bg-purple-50 dark:bg-purple-950/40",
      iconBg: "bg-purple-100 dark:bg-purple-900/50",
      icon: "text-purple-600 dark:text-purple-300",
    },
    orange: {
      card: "bg-orange-50 dark:bg-orange-950/40",
      iconBg: "bg-orange-100 dark:bg-orange-900/50",
      icon: "text-orange-600 dark:text-orange-300",
    },
  };

  const landlordName = landlord
    ? `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim() ||
      "Landlord"
    : "Landlord";

  const openMaintenanceCount = maintenanceRequests.filter(
    (item) => item.status !== "Resolved" && item.status !== "Cancelled",
  ).length;

  const maintenancePreview = maintenanceRequests.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    subtitle: `${categoryLabel(item.category)} · Reported ${formatShortDate(item.created_at)}`,
    status: toPreviewStatus(item.status),
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="@container/rental max-w-7xl mx-auto min-w-0 px-4 py-6 sm:py-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-inter text-xs uppercase tracking-wider text-muted-foreground">
            {headerDate}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {hasApplications && (
              <Button variant="outline" size="sm" onPress={() => historyDialog.setOpen(true)}>
                <History size={16} />
                Application History
              </Button>
            )}
            <StatusChip className="font-nunito text-[11px] font-semibold" tone="success">Active lease</StatusChip>
          </div>
        </div>

        <RentalHero
          name={apartment.name}
          address={formatAddress(apartment)}
          imageUrl={cover}
          descriptionHref={`/tenant/browse/${apartment.id}`}
        />

        <div className="grid min-w-0 gap-3 @min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
          <div className="@container/rent relative min-w-0 rounded-2xl bg-primary p-4 text-white sm:p-6">
            <div className="relative flex h-full flex-col">
              {isPeriodPaid ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-nunito text-xl font-bold">Monthly rent</p>
                    <StatusChip className="font-nunito text-[11px] font-semibold" tone="success">Paid</StatusChip>
                  </div>
                  <div className="mt-3 grid min-w-0 gap-3 @min-[32rem]/rent:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-2 rounded-2xl bg-white/10 p-4">
                    <p className="font-nunito text-xl font-bold">
                      {paymentPeriodLabel}
                    </p>
                    <p className="font-inter text-sm text-white/85">
                      Payment received for this month.
                    </p>
                    <div className="mt-2 grid gap-4 border-t border-white/20 pt-4 @min-[40rem]/rent:grid-cols-2">
                      <div>
                        <p className="font-nunito text-xs font-semibold text-white/70">Lease start</p>
                        <p className="font-inter text-sm text-white">
                          {formatShortDate(tenancy.lease_start)}
                        </p>
                      </div>
                      <div>
                        <p className="font-nunito text-xs font-semibold text-white/70">Lease end</p>
                        <p className="font-inter text-sm text-white">
                          {tenancy.lease_end
                            ? formatShortDate(tenancy.lease_end)
                            : "Ongoing"}
                        </p>
                      </div>
                    </div>
                    <Link href="/tenant/payment/history" className="mt-auto w-fit no-underline pt-2">
                      <Button className="bg-white font-semibold text-primary">
                        <Receipt size={16} />
                        View history
                      </Button>
                    </Link>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2 rounded-2xl bg-white/10 p-4">
                    <p className="flex items-center gap-2 font-nunito text-xs font-semibold uppercase tracking-wider text-white/85">
                      <span className="rounded-full bg-white/15 p-1 text-white">
                        <CalendarDays size={14} className="block" />
                      </span>
                      Next Payment
                    </p>
                    <p className="font-nunito text-xl font-bold">
                      {formatMonthYear(nextPeriod.periodStart)}
                    </p>
                    <p className="font-inter text-sm text-white/85">
                      Due {formatShortDate(nextPeriod.dueDate)}
                    </p>
                    <div aria-hidden="true" className="border-t border-white/20" />
                    <div className="mt-auto pt-2">
                      <p className="font-nunito text-xs font-semibold text-white/70">Total due</p>
                      <p className="font-nunito text-2xl font-bold">
                        {formatPesoDisplay(totalDue)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/10 px-3 py-2">
                      <p className="font-nunito text-xs font-semibold text-white/70">Monthly rent</p>
                      <p className="font-nunito text-sm font-semibold">
                        {formatPesoDisplay(monthlyRent)}
                      </p>
                      {pendingFeesTotal > 0 && (
                        <p className="mt-1 border-t border-white/20 pt-2 font-inter text-xs text-white/85">
                          + {formatPesoDisplay(pendingFees[0].amount)} Maintenance fee — {pendingFees[0].title}
                          {pendingFees.length > 1 && (
                            <> +{pendingFees.length - 1} more</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-nunito text-xl font-bold">Monthly rent</p>
                    {paymentStatus === "paid" ? (
                      <StatusChip className="font-nunito text-[11px] font-semibold" tone="success">Paid</StatusChip>
                    ) : (
                      <StatusChip className="font-nunito text-[11px] font-semibold"
                        tone={paymentStatus === "late" ? "danger" : "warning"}
                      >
                        {dueLabel}
                      </StatusChip>
                    )}
                  </div>
                  <p className="mt-2 break-words font-nunito text-4xl font-bold @min-[28rem]/rent:text-5xl">
                    {formatPesoDisplay(totalDue)}
                  </p>
                  <p className="mt-2 flex items-start gap-2 font-inter text-sm font-semibold text-white/90 @min-[28rem]/rent:text-base">
                    <CalendarDays size={20} className="shrink-0" aria-hidden="true" />
                    <span className="min-w-0">{paymentPeriodLabel} - Due {formatShortDate(isPeriodPaid ? nextPeriod.dueDate : rent.dueDate)}</span>
                  </p>
                  {pendingFeesTotal > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {pendingFees.slice(0, 3).map((fee) => (
                        <p key={fee.title} className="break-words font-inter text-xs text-white/80">
                          + {formatPesoDisplay(fee.amount)} Maintenance fee — {fee.title}
                        </p>
                      ))}
                      {pendingFees.length > 3 && (
                        <p className="font-inter text-xs text-white/70">+{pendingFees.length - 3} more</p>
                      )}
                    </div>
                  )}
                </>
              )}
              {!isPeriodPaid && (
                <>
                  <div className="mt-6 grid gap-4 border-t border-white/20 pt-5 @min-[36rem]/rent:grid-cols-3 @min-[36rem]/rent:divide-x @min-[36rem]/rent:divide-white/20">
                    <div className="flex min-w-0 items-center gap-2">
                      <CalendarDays size={28} className="shrink-0 text-white/80" aria-hidden="true" />
                      <div>
                        <p className="font-nunito text-sm font-semibold text-white/70">Lease start</p>
                        <p className="font-inter text-base font-semibold text-white">
                          {formatShortDate(tenancy.lease_start)}
                        </p>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 @min-[36rem]/rent:pl-4">
                      <CalendarDays size={28} className="shrink-0 text-white/80" aria-hidden="true" />
                      <div>
                        <p className="font-nunito text-sm font-semibold text-white/70">Lease end</p>
                        <p className="font-inter text-base font-semibold text-white">
                          {tenancy.lease_end
                            ? formatShortDate(tenancy.lease_end)
                            : "Ongoing"}
                        </p>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 @min-[36rem]/rent:pl-4">
                      <CurrencyPeso size={28} className="shrink-0 text-white/80" aria-hidden="true" />
                      <div>
                        <p className="font-nunito text-sm font-semibold text-white/70">Monthly rent</p>
                        <p className="break-words font-inter text-base font-semibold text-white">
                          {formatPesoDisplay(monthlyRent)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-3 pt-5">
                    <Link href="/tenant/payment" className="flex-1 no-underline">
                      <Button className="h-12 w-full rounded-full bg-white font-nunito text-base font-bold text-primary">
                        <CreditCard size={18} />
                        Pay now
                      </Button>
                    </Link>
                    <Link
                      href="/tenant/payment/history"
                      aria-label="View payment history"
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white no-underline"
                    >
                      <History size={20} />
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>

          <MiniCalendar
            focusDate={dueDate}
            highlightDate={dueDate}
            highlightLabel="Rent due"
          />
        </div>

        <div className="grid min-w-0 gap-3 @min-[64rem]/rental:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)] items-stretch">
          <DashboardCard>
            <p className="font-nunito text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick actions
            </p>
            <div className="rental-quick-actions mt-4 grid auto-rows-fr grid-cols-1 gap-3 @min-[28rem]/dashboard:grid-cols-2 @min-[44rem]/dashboard:grid-cols-4">
              {actions.map((action) => {
                const Icon = action.icon;
                const tint = actionTints[action.tint];
                const tileClassName = `flex h-full min-h-20 w-full min-w-0 items-center gap-3 rounded-2xl p-4 text-left no-underline transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary @min-[44rem]/dashboard:gap-2 @min-[44rem]/dashboard:p-3 ${tint.card}`;
                const content = (
                  <>
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-full @min-[44rem]/dashboard:size-8 ${tint.iconBg}`}>
                      <Icon size={20} className={tint.icon} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 font-nunito text-sm font-semibold text-card-foreground @min-[44rem]/dashboard:text-[13px]">
                      {action.label}
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                  </>
                );

                if ("href" in action) {
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className={tileClassName}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onPress}
                    className={`${tileClassName} cursor-pointer`}
                  >
                    {content}
                  </button>
                );
              })}
            </div>
          </DashboardCard>

          <DashboardCard className="h-full">
            <p className="font-nunito text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Landlord
            </p>
            <div className="mt-4 flex items-center gap-3">
              <UserAvatar
                src={landlord?.avatar_url}
                initials={getInitials(landlordName)}
                alt={landlordName}
                size="lg"
                fallbackClassName="bg-muted text-muted-foreground"
              />
              <div className="min-w-0">
                <p className="truncate font-nunito text-sm font-semibold text-card-foreground">
                  {landlordName}
                </p>
                <p className="truncate font-inter text-xs text-muted-foreground">
                  {landlord?.email ?? "No email provided"}
                </p>
              </div>
            </div>
            <Link href="/tenant/messages" className="mt-4 w-full no-underline">
              <Button variant="outline" className="w-full justify-center rounded-full">
                <MessageCircle size={16} />
                Send a message
              </Button>
            </Link>
          </DashboardCard>
        </div>

        <SignedLeaseCard
          tenancyId={tenancy.id}
          path={tenancy.signed_lease_path}
          uploadedAt={tenancy.signed_lease_uploaded_at}
          acknowledgedAt={tenancy.tenant_acknowledged_at}
          onView={() => void handleViewSignedLease()}
          viewing={viewingSignedLease}
          onAcknowledged={() => {
            toast.success("Lease confirmed");
            void refetch();
          }}
        />

        <DashboardCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-nunito text-sm font-semibold text-card-foreground">
              Maintenance
            </h2>
            <div className="flex items-center gap-2">
              <StatusChip className="font-nunito text-[11px] font-semibold" tone="warning">
                {openMaintenanceCount} open
              </StatusChip>
              <Link href="/tenant/maintenance" className="text-xs font-medium text-primary hover:underline no-underline">
                View all
              </Link>
            </div>
          </div>
          {maintenanceLoading ? (
            <div className="flex justify-center py-6">
              <Spinner color="accent" />
            </div>
          ) : maintenanceError ? (
            <p className="py-4 text-center font-inter text-xs text-danger">{maintenanceError}</p>
          ) : maintenancePreview.length === 0 ? (
            <p className="py-4 text-center font-inter text-xs text-muted-foreground">
              No maintenance requests yet.
            </p>
          ) : (
          <div className="space-y-0">
            {maintenancePreview.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-start gap-2.5 border-b border-border py-2.5 last:border-0 last:pb-0"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    item.status === "in_progress"
                      ? "bg-amber-100/70 dark:bg-amber-900/40"
                      : item.status === "resolved"
                        ? "bg-green-100/70 dark:bg-green-900/40"
                        : "bg-muted"
                  }`}
                >
                  {item.status === "resolved" ? (
                    <CheckCircle2 size={12} className="text-green-600" />
                  ) : item.status === "in_progress" ? (
                    <Wrench size={12} className="text-amber-600" />
                  ) : (
                    <Clock size={12} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="break-words font-nunito text-sm font-semibold leading-tight text-card-foreground">
                    {item.title}
                  </p>
                  <p className="mt-0.5 font-inter text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
                {maintenanceBadge(item.status)}
              </div>
            ))}
          </div>
          )}
        </DashboardCard>

        <DashboardCard>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-nunito text-sm font-semibold text-card-foreground">
              Payment history
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-inter text-xs text-muted-foreground">
                Last updated {formatShortMonthDate(today)}
              </p>
              <Link href="/tenant/payment/history" className="font-inter text-xs font-medium text-primary hover:underline no-underline">
                View all
              </Link>
            </div>
          </div>
          <Table className="min-w-0 max-w-full">
            <Table.ScrollContainer className="max-w-full overflow-x-auto">
              <Table.Content
                aria-label="Payment history"
                className="min-w-[32rem]"
              >
                <Table.Header className="font-inter text-[11px] tracking-wider text-card-foreground">
                  <Table.Column isRowHeader className="font-nunito font-semibold text-card-foreground">
                    Date
                  </Table.Column>
                  <Table.Column className="font-nunito font-semibold text-card-foreground">
                    Description
                  </Table.Column>
                  <Table.Column className="text-right font-nunito font-semibold text-card-foreground">
                    Amount
                  </Table.Column>
                  <Table.Column className="text-right font-nunito font-semibold text-card-foreground">
                    Status
                  </Table.Column>
                </Table.Header>
                <Table.Body>
                  {paymentHistory.length === 0 ? (
                    <Table.Row key="empty">
                      <Table.Cell
                        colSpan={4}
                        className="py-6 text-center font-inter text-sm text-muted-foreground"
                      >
                        No payments recorded yet.
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paymentHistory.slice(0, 5).map((row) => (
                      <Table.Row
                        key={row.id}
                        id={row.id}
                        className="border-b border-border"
                      >
                        <Table.Cell className="font-inter text-xs text-muted-foreground">
                          {row.date}
                        </Table.Cell>
                        <Table.Cell className="font-inter text-xs text-card-foreground">
                          {row.description}
                        </Table.Cell>
                        <Table.Cell className="text-right font-nunito text-sm font-semibold text-card-foreground">
                          {formatPesoDisplay(row.amount)}
                        </Table.Cell>
                        <Table.Cell className="text-right">
                          {statusBadge(row.status)}
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </DashboardCard>

        <Modal isOpen={historyDialog.isOpen} onOpenChange={historyDialog.setOpen}>
          <Modal.Backdrop>
            <Modal.Container size="lg" scroll="inside">
              <Modal.Dialog>
                <Modal.Header className="flex flex-row items-center justify-between">
                  <Modal.Heading>Application History</Modal.Heading>
                  <Button
                    isIconOnly
                    variant="ghost"
                    size="sm"
                    onPress={() => historyDialog.setOpen(false)}
                    aria-label="Close application history"
                    className="text-muted-foreground"
                  >
                    <X size={18} />
                  </Button>
                </Modal.Header>
                <Modal.Body>
                  <ApplicationsList showHeader={false} applications={applications} loading={applicationsLoading} error={applicationsError} />
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>

      </div>
    </div>
  );
}

