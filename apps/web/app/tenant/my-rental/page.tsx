"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Link, Spinner, Table } from "@heroui/react";
import {
  CreditCard,
  FileText,
  MessageCircle,
  Receipt,
  Wrench,
  CheckCircle2,
  Clock,
  House,
  CalendarDays,
} from "lucide-react";

import { formatPesoDisplay } from "@repo/utils";

import { useTenancy } from "@/hooks/use-tenancy";
import UserAvatar from "@/app/components/profile/UserAvatar";
import { useMaintenanceRequestHistory } from "@/hooks/use-maintenance-request-history";

import { CATEGORIES } from "../maintenance/data/maintenance-data";
import type {
  MaintenanceStatus,
  PaymentStatus,
  PaymentHistoryItem,
} from "./types";

import DashboardCard from "./components/DashboardCard";
import StatusChip from "./components/StatusChip";
import MiniCalendar from "./components/MiniCalendar";
import TenancyEmptyState from "./components/TenancyEmptyState";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function normalizePaymentStatus(status?: string | null): PaymentStatus {
  const value = status?.toLowerCase() ?? "";
  if (value === "paid" || value === "completed") return "paid";
  if (value === "late" || value === "overdue") return "late";
  return "pending";
}

function statusBadge(status: PaymentStatus) {
  if (status === "paid") return <StatusChip variant="success">Paid</StatusChip>;
  if (status === "late") return <StatusChip variant="danger">Late</StatusChip>;
  return <StatusChip variant="warning">Pending</StatusChip>;
}

function maintenanceBadge(status: MaintenanceStatus) {
  if (status === "in_progress")
    return <StatusChip variant="warning">In progress</StatusChip>;
  if (status === "resolved")
    return <StatusChip variant="success">Done</StatusChip>;
  if (status === "cancelled")
    return <StatusChip variant="neutral">Cancelled</StatusChip>;
  return <StatusChip variant="neutral">Pending</StatusChip>;
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

export default function MyRental() {
  const { tenancy, payments, currentPayment, loading, error, refetch } = useTenancy();
  const {
    requests: maintenanceRequests,
    loading: maintenanceLoading,
    error: maintenanceError,
  } = useMaintenanceRequestHistory(tenancy?.apartment.id ?? null);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-20 flex justify-center">
          <Spinner color="accent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div
          className="max-w-7xl mx-auto px-4 py-8 space-y-4 w-full flex-1 flex flex-col justify-center items-center"
          style={{ minHeight: "calc(100dvh - 4rem)" }}
        >
          <DashboardCard className="max-w-xl w-full">
            <div className="flex flex-col items-center gap-4 text-center px-6 py-10">
              <p className="text-sm text-zinc-600 dark:text-zinc-300">{error}</p>
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
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <House size={20} className="text-primary" />
              <h2 className="text-lg font-semibold text-card-foreground">My Rental</h2>
            </div>
            <TenancyEmptyState />
          </div>
        </div>
      </div>
    );
  }

  const apartment = tenancy.apartment;
  const landlord = tenancy.landlord;
  const monthlyRent = tenancy.monthly_rent ?? apartment.monthly_rent ?? 0;
  const paymentStatus = normalizePaymentStatus(currentPayment?.status);

  const dueDate = currentPayment?.due_date
    ? new Date(currentPayment.due_date)
    : null;
  const dueDays = dueDate
    ? Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY)
    : null;
  const dueLabel =
    dueDays === null
      ? "Due soon"
      : dueDays < 0
        ? `Overdue by ${Math.abs(dueDays)} days`
        : `Due in ${dueDays} days`;

  const paymentPeriodLabel = currentPayment?.period_start
    ? formatMonthYear(currentPayment.period_start)
    : formatMonthYear(today.toISOString());

  const amountDue = currentPayment?.amount ?? monthlyRent;

  const pendingFeesTotal = pendingFees.reduce((sum, fee) => sum + fee.amount, 0);
  const nextPeriodTotal = monthlyRent + pendingFeesTotal;

  const currentPeriodStart = currentPayment?.period_start ?? null;
  // Next period after the paid one (due on the 5th, same convention as billing).
  const nextPeriod =
    currentPeriodStart !== null
      ? (() => {
          const d = new Date(`${currentPeriodStart.slice(0, 7)}-01T00:00:00`);
          const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
          const y = next.getFullYear();
          const m = String(next.getMonth() + 1).padStart(2, "0");
          return { periodStart: `${y}-${m}-01`, dueDate: `${y}-${m}-05` };
        })()
      : null;
  // Same full-amount guard as the payment page: a fully paid period can't be paid again.
  const isPeriodPaid =
    monthlyRent > 0 &&
    currentPeriodStart !== null &&
    payments
      .filter((p) => p.status === "paid" && p.period_start === currentPeriodStart)
      .reduce((sum, p) => sum + (p.amount ?? 0), 0) >= monthlyRent;

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

  const actions = [
    {
      label: "View Description",
      icon: House,
    },
    {
      label: "View lease",
      icon: FileText,
    },
    {
      label: "View receipts",
      icon: Receipt,
      href: "/tenant/payment/history",
    },
    {
      label: "Maintenance",
      icon: Wrench,
      href: "/tenant/maintenance",
    },
  ];

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">
            {headerDate}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                {apartment.name}
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {formatAddress(apartment)}
              </p>
            </div>
            <StatusChip variant="success">Active lease</StatusChip>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <DashboardCard className="lg:col-span-2">
            <div className="flex h-full flex-col">
              {isPeriodPaid ? (
                <>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider">
                    Payment due
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 items-stretch mt-3">
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="rounded-2xl border border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 p-4 flex flex-col gap-2">
                      <p className="text-xs font-nunito font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider flex items-center gap-2 leading-none">
                        <span className="rounded-full bg-green-600 p-1 text-white shrink-0 self-center">
                          <CheckCircle2 size={14} className="block" />
                        </span>
                        Already Paid
                      </p>
                      <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        {paymentPeriodLabel}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Payment received for this month.
                      </p>
                    </div>
                    <div className="border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-zinc-400">Lease start</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {formatShortDate(tenancy.lease_start)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Lease end</p>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          {tenancy.lease_end
                            ? formatShortDate(tenancy.lease_end)
                            : "Ongoing"}
                        </p>
                      </div>
                    </div>
                    <Link href="/tenant/payment/history" className="mt-4 w-fit md:mt-auto no-underline">
                      <Button variant="secondary">
                        <Receipt size={14} />
                        View history
                      </Button>
                    </Link>
                  </div>
                  {nextPeriod && (
                    <div className="rounded-2xl border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/40 p-4 flex flex-col gap-2 w-full sm:w-72 shrink-0">
                      <p className="text-xs font-nunito font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 p-1 text-primary">
                          <CalendarDays size={14} />
                        </span>
                        Next Payment
                      </p>
                      <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        {formatMonthYear(nextPeriod.periodStart)}
                      </p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Due {formatShortDate(nextPeriod.dueDate)}
                      </p>
                      <div className="mt-auto pt-2">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Total due</p>
                        <p className="text-2xl font-nunito font-bold text-primary">
                          {formatPesoDisplay(nextPeriodTotal)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white/70 dark:bg-zinc-900/50 px-3 py-2 grid gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">Monthly rent</p>
                          <p className="text-sm font-nunito font-semibold text-zinc-900 dark:text-zinc-100">
                            {formatPesoDisplay(monthlyRent)}
                          </p>
                        </div>
                        {pendingFeesTotal > 0 && (
                          <div className="min-w-0 border-t border-zinc-200 dark:border-zinc-800 pt-2">
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Maintenance fee</p>
                            <p className="text-sm font-nunito font-semibold text-zinc-900 dark:text-zinc-100">
                              {formatPesoDisplay(pendingFees[0].amount)}{" "}
                              <span className="font-normal text-zinc-500">· {pendingFees[0].title}</span>
                              {pendingFees.length > 1 && (
                                <span className="font-normal text-zinc-400"> +{pendingFees.length - 1} more</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-zinc-400 uppercase tracking-wider">
                    Payment due
                  </p>
                  <div className="flex items-end gap-2 mt-2">
                    <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatPesoDisplay(pendingFeesTotal > 0 ? monthlyRent + pendingFeesTotal : amountDue)}
                    </p>
                    <span className="text-sm text-zinc-400">.00</span>
                  </div>
                  {pendingFeesTotal > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {pendingFees.slice(0, 3).map((fee) => (
                        <p key={fee.title} className="text-xs text-zinc-500 dark:text-zinc-400">
                          + {formatPesoDisplay(fee.amount)} Maintenance fee — {fee.title}
                        </p>
                      ))}
                      {pendingFees.length > 3 && (
                        <p className="text-xs text-zinc-400">+{pendingFees.length - 3} more</p>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {paymentStatus === "paid" ? (
                      <StatusChip variant="success">Paid</StatusChip>
                    ) : (
                      <StatusChip
                        variant={paymentStatus === "late" ? "danger" : "warning"}
                      >
                        {dueLabel}
                      </StatusChip>
                    )}
                    <StatusChip variant="neutral">{paymentPeriodLabel}</StatusChip>
                    <StatusChip variant="neutral">Monthly rent</StatusChip>
                  </div>
                </>
              )}
              {!isPeriodPaid && (
                <>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-zinc-400">Lease start</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatShortDate(tenancy.lease_start)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Lease end</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {tenancy.lease_end
                          ? formatShortDate(tenancy.lease_end)
                          : "Ongoing"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-400">Monthly rent</p>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {formatPesoDisplay(monthlyRent)}
                      </p>
                    </div>
                  </div>
                  <Link href="/tenant/payment" className="mt-10 w-fit md:mt-auto no-underline">
                    <Button>
                      <CreditCard size={14} />
                      Pay now
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </DashboardCard>

          <MiniCalendar
            focusDate={dueDate ?? today}
            highlightDate={dueDate}
            highlightLabel="Rent due"
          />
        </div>

        <div className="grid gap-3 lg:grid-cols-[2fr_1fr] items-stretch">
          <DashboardCard>
            <p className="text-xs text-zinc-400 uppercase tracking-wider">
              Quick actions
            </p>
            <div className="mt-4 grid gap-2.5 grid-cols-2 sm:grid-cols-4">
              {actions.map((action) => {
                const Icon = action.icon;

                if (action.href) {
                  return (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="w-full no-underline"
                    >
                      <Button
                        variant="tertiary"
                        className="h-20 w-full flex-col gap-2 bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800/80"
                      >
                        <Icon size={18} />
                        <span className="text-xs font-medium">
                          {action.label}
                        </span>
                      </Button>
                    </Link>
                  );
                }

                return (
                  <Button
                    key={action.label}
                    variant="tertiary"
                    className="h-20 w-full flex-col gap-2 bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800/80"
                    isDisabled
                  >
                    <Icon size={18} />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </DashboardCard>

          <DashboardCard className="h-full">
            <p className="text-xs text-zinc-400 uppercase tracking-wider">
              Landlord
            </p>
            <div className="mt-4 flex items-center gap-3">
              <UserAvatar
                src={landlord?.avatar_url}
                initials={getInitials(landlordName)}
                alt={landlordName}
                size="lg"
                fallbackClassName="bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              />
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {landlordName}
                </p>
                <p className="text-xs text-zinc-500">
                  {landlord?.email ?? "No email provided"}
                </p>
              </div>
            </div>
            <Link href="/tenant/messages" className="mt-4 w-full no-underline">
              <Button variant="outline" className="w-full justify-center">
                <MessageCircle size={14} />
                Send a message
              </Button>
            </Link>
          </DashboardCard>
        </div>

        <DashboardCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Maintenance
            </h2>
            <div className="flex items-center gap-2">
              <StatusChip variant="warning">
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
            <p className="text-xs text-red-600 py-4 text-center">{maintenanceError}</p>
          ) : maintenancePreview.length === 0 ? (
            <p className="text-xs text-zinc-500 py-4 text-center">
              No maintenance requests yet.
            </p>
          ) : (
          <div className="space-y-0">
            {maintenancePreview.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    item.status === "in_progress"
                      ? "bg-amber-100/70 dark:bg-amber-900/40"
                      : item.status === "resolved"
                        ? "bg-green-100/70 dark:bg-green-900/40"
                        : "bg-zinc-100 dark:bg-zinc-800"
                  }`}
                >
                  {item.status === "resolved" ? (
                    <CheckCircle2 size={12} className="text-green-600" />
                  ) : item.status === "in_progress" ? (
                    <Wrench size={12} className="text-amber-600" />
                  ) : (
                    <Clock size={12} className="text-zinc-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 leading-tight">
                    {item.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
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
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Payment history
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-zinc-400">
                Last updated {formatShortMonthDate(today)}
              </p>
              <Link href="/tenant/payment/history" className="text-xs font-medium text-primary hover:underline no-underline">
                View all
              </Link>
            </div>
          </div>
          <Table className="bg-darker-white">
            <Table.ScrollContainer>
              <Table.Content
                aria-label="Payment history"
                className="bg-darker-white"
              >
                <Table.Header className="bg-darker-white text-[11px] text-black dark:text-zinc-200 tracking-wider font-medium">
                  <Table.Column isRowHeader className="text-black font-medium">
                    Date
                  </Table.Column>
                  <Table.Column className="text-black font-medium">
                    Description
                  </Table.Column>
                  <Table.Column className="text-right text-black font-medium">
                    Amount
                  </Table.Column>
                  <Table.Column className="text-right text-black font-medium">
                    Status
                  </Table.Column>
                </Table.Header>
                <Table.Body>
                  {paymentHistory.length === 0 ? (
                    <Table.Row key="empty">
                      <Table.Cell
                        colSpan={4}
                        className="text-center text-sm text-zinc-400 py-6"
                      >
                        No payments recorded yet.
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paymentHistory.slice(0, 5).map((row) => (
                      <Table.Row
                        key={row.id}
                        id={row.id}
                        className="border-b border-zinc-100 dark:border-zinc-800"
                      >
                        <Table.Cell className="text-xs text-zinc-500">
                          {row.date}
                        </Table.Cell>
                        <Table.Cell className="text-xs text-zinc-700 dark:text-zinc-300">
                          {row.description}
                        </Table.Cell>
                        <Table.Cell className="text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
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

      </div>
    </div>
  );
}
