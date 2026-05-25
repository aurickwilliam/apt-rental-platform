"use client";

import { useMemo, useState } from "react";
import { Avatar, Button, Link, Spinner, Table } from "@heroui/react";
import {
  CreditCard,
  FileText,
  MessageCircle,
  Receipt,
  Wrench,
  CheckCircle2,
  Clock,
  House,
} from "lucide-react";

import { formatCurrency } from "@repo/utils";

import { useTenancy } from "@/hooks/use-tenancy";
import Footer from "@/app/components/layout/Footer";

import { DEFAULT_PAYMENT_BREAKDOWN, MAINTENANCE_ITEMS } from "./constants";
import type { MaintenanceStatus, PaymentStatus, PaymentHistoryItem } from "./types";

import DashboardCard from "./components/DashboardCard";
import StatusChip from "./components/StatusChip";
import PaymentModal from "./components/PaymentModal";
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
  if (status === "in_progress") return <StatusChip variant="warning">In progress</StatusChip>;
  if (status === "resolved") return <StatusChip variant="success">Done</StatusChip>;
  return <StatusChip variant="neutral">Pending</StatusChip>;
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { tenancy, payments, currentPayment, loading, error } = useTenancy();

  const today = useMemo(() => new Date(), []);
  const headerDate = useMemo(() => formatHeaderDate(today), [today]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-20 flex justify-center">
          <Spinner color="accent" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!tenancy) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <TenancyEmptyState description={error ?? undefined} />
        </div>
        <Footer />
      </div>
    );
  }

  const apartment = tenancy.apartment;
  const landlord = tenancy.landlord;
  const monthlyRent = tenancy.monthly_rent ?? apartment.monthly_rent ?? 0;
  const paymentStatus = normalizePaymentStatus(currentPayment?.status);

  const dueDate = currentPayment?.due_date ? new Date(currentPayment.due_date) : null;
  const dueDays = dueDate
    ? Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY)
    : null;
  const dueLabel = dueDays === null
    ? "Due soon"
    : dueDays < 0
      ? `Overdue by ${Math.abs(dueDays)} days`
      : `Due in ${dueDays} days`;

  const paymentPeriodLabel = currentPayment?.period_start
    ? formatMonthYear(currentPayment.period_start)
    : formatMonthYear(today.toISOString());

  const breakdown = monthlyRent
    ? [{ key: "base_rent", label: "Monthly rent", amount: monthlyRent }]
    : DEFAULT_PAYMENT_BREAKDOWN;

  const breakdownTotal = breakdown.reduce((total, item) => total + item.amount, 0);
  const amountDue = currentPayment?.amount ?? breakdownTotal;

  const paymentHistory: PaymentHistoryItem[] = payments.map((payment) => {
    const paymentDate = payment.date ?? payment.period_start ?? payment.period_end ?? today.toISOString();
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
    },
    {
      label: "Maintenance",
      icon: Wrench,
      href: "/tenant/maintenance",
    },
  ];

  const landlordName = landlord
    ? `${landlord.first_name ?? ""} ${landlord.last_name ?? ""}`.trim() || "Landlord"
    : "Landlord";

  const openMaintenanceCount = MAINTENANCE_ITEMS.filter(
    (item) => item.status !== "resolved"
  ).length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-400 uppercase tracking-wider">{headerDate}</p>
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
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Payment due</p>
              <div className="flex items-end gap-2 mt-2">
                <p className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
                  ₱{formatCurrency(amountDue)}
                </p>
                <span className="text-sm text-zinc-400">.00</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {paymentStatus === "paid" ? (
                  <StatusChip variant="success">Paid</StatusChip>
                ) : (
                  <StatusChip variant={paymentStatus === "late" ? "danger" : "warning"}>
                    {dueLabel}
                  </StatusChip>
                )}
                <StatusChip variant="neutral">{paymentPeriodLabel}</StatusChip>
                <StatusChip variant="neutral">Monthly rent</StatusChip>
              </div>
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
                    {tenancy.lease_end ? formatShortDate(tenancy.lease_end) : "Ongoing"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Monthly rent</p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    ₱{formatCurrency(monthlyRent)}
                  </p>
                </div>
              </div>
              <Button
                className="mt-10 w-fit md:mt-auto"
                onPress={() => setShowPaymentModal(true)}
                isDisabled={paymentStatus === "paid"}
              >
                <CreditCard size={14} />
                Pay now
              </Button>
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
            <p className="text-xs text-zinc-400 uppercase tracking-wider">Quick actions</p>
            <div className="mt-4 grid gap-2.5 grid-cols-2 sm:grid-cols-4">
              {actions.map((action) => {
                const Icon = action.icon;

                if (action.href) {
                  return (
                    <Link key={action.label} href={action.href} className="w-full no-underline">
                      <Button
                        variant="tertiary"
                        className="h-20 w-full flex-col gap-2 bg-zinc-100/80 dark:bg-zinc-900/70 border border-zinc-200/70 dark:border-zinc-800/80"
                      >
                        <Icon size={18} />
                        <span className="text-xs font-medium">{action.label}</span>
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
            <p className="text-xs text-zinc-400 uppercase tracking-wider">Landlord</p>
            <div className="mt-4 flex items-center gap-3">
              <Avatar size="lg">
                {landlord?.avatar_url && (
                  <Avatar.Image src={landlord.avatar_url} alt={landlordName} />
                )}
                <Avatar.Fallback className="bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {getInitials(landlordName)}
                </Avatar.Fallback>
              </Avatar>
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
            <StatusChip variant="warning">{openMaintenanceCount} open</StatusChip>
          </div>
          <div className="space-y-0">
            {MAINTENANCE_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  item.status === "in_progress"
                    ? "bg-amber-100/70 dark:bg-amber-900/40"
                    : item.status === "resolved"
                      ? "bg-green-100/70 dark:bg-green-900/40"
                      : "bg-zinc-100 dark:bg-zinc-800"
                }`}>
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
                  <p className="text-xs text-zinc-500 mt-0.5">{item.subtitle}</p>
                </div>
                {maintenanceBadge(item.status)}
              </div>
            ))}
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Payment history
            </h2>
            <p className="text-xs text-zinc-400">Last updated {formatShortMonthDate(today)}</p>
          </div>
          <Table className="bg-darker-white">
            <Table.ScrollContainer>
              <Table.Content aria-label="Payment history" className="bg-darker-white">
                <Table.Header className="bg-darker-white text-[11px] text-black dark:text-zinc-200 tracking-wider font-medium">
                  <Table.Column className="text-black font-medium">Date</Table.Column>
                  <Table.Column className="text-black font-medium">Description</Table.Column>
                  <Table.Column className="text-right text-black font-medium">Amount</Table.Column>
                  <Table.Column className="text-right text-black font-medium">Status</Table.Column>
                </Table.Header>
                <Table.Body>
                  {paymentHistory.length === 0 ? (
                    <Table.Row key="empty">
                      <Table.Cell colSpan={4} className="text-center text-sm text-zinc-400 py-6">
                        No payments recorded yet.
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    paymentHistory.slice(0, 5).map((row) => (
                      <Table.Row key={row.id} id={row.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <Table.Cell className="text-xs text-zinc-500">
                          {row.date}
                        </Table.Cell>
                        <Table.Cell className="text-xs text-zinc-700 dark:text-zinc-300">
                          {row.description}
                        </Table.Cell>
                        <Table.Cell className="text-right text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          ₱{formatCurrency(row.amount)}
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

        <PaymentModal
          isOpen={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          onConfirm={() => {
            setShowPaymentModal(false);
            // TODO: trigger Supabase payment flow
          }}
          total={amountDue}
          breakdown={breakdown}
          periodLabel={paymentPeriodLabel}
          dueDateLabel={dueDate ? formatShortDate(dueDate.toISOString()) : "TBD"}
        />
      </div>

      <Footer />
    </div>
  );
}
