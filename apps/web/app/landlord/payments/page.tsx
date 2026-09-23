"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Chip, ListBox, Select, Spinner } from "@heroui/react";
import { ArrowLeft, Banknote, Receipt, SlidersHorizontal } from "lucide-react";
import { formatPesoDisplay } from "@repo/utils";
import type { PaymentHistoryFilter } from "@/app/tenant/payment/types";
import type { PaymentRecord } from "@/service/paymentService";
import { formatReferenceId, methodLabel, paymentStatusLabel, periodMonthLabel } from "@/app/tenant/payment/utils";
import { useLandlordApartments, useLandlordPayments } from "@/hooks/use-landlord-payments";
import PaymentHistoryFilters from "@/app/tenant/payment/components/PaymentHistoryFilters";

function toYear(payment: PaymentRecord): string {
  const src = payment.period_start ?? payment.date;
  return src.slice(0, 4);
}

function SectionHeader({ year, currentYear }: { year: string; currentYear: string }) {
  if (year === currentYear) {
    return (
      <div className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-950 py-2">
        <div className="inline-flex rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 px-3 py-1.5">
          <span className="text-sm font-nunito font-semibold text-primary">This Year</span>
        </div>
      </div>
    );
  }
  return (
    <div className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-950 py-2">
      <span className="text-sm font-nunito font-semibold text-primary/60">{year}</span>
    </div>
  );
}

function toPaidDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function LandlordRowCard({ payment, apartmentId }: { payment: PaymentRecord; apartmentId: string }) {
  const status = paymentStatusLabel(payment.status);
  const color: "success" | "warning" | "danger" | "default" =
    status === "Paid" ? "success" : status === "Pending" ? "warning" : "danger";

  return (
    <Link href={`/landlord/payments/${payment.id}?apartmentId=${apartmentId}`} className="no-underline">
      <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
        <Card.Header className="px-4 pt-4 pb-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-nunito font-semibold text-zinc-900 dark:text-zinc-100 truncate flex-1">
              {periodMonthLabel(payment.due_date ?? payment.period_start ?? payment.date)}
            </p>
            <div className="flex items-center gap-1.5 shrink-0">
              <Chip size="sm" variant="soft" color="default" className="text-[11px]">
                {methodLabel(payment.method)}
              </Chip>
              <Chip size="sm" variant="soft" color={color} className="text-[11px]">
                {status}
              </Chip>
            </div>
          </div>
        </Card.Header>
        <Card.Content className="px-4 pb-2">
          <p className="text-sm font-nunito font-bold text-primary">{formatPesoDisplay(payment.amount ?? 0)}</p>
          {payment.tenant_name ? (
            <p className="text-xs text-zinc-500 truncate mt-0.5">{payment.tenant_name}</p>
          ) : null}
        </Card.Content>
        <Card.Footer className="px-4 pb-4 flex items-center justify-between gap-2">
          <span className="text-[11px] text-zinc-500 truncate flex-1">
            {status === "Paid" ? "Paid on" : "Recorded on"}: {toPaidDate(payment.date)}
          </span>
          <span className="text-[11px] text-zinc-500 shrink-0">{formatReferenceId(payment.reference_id)}</span>
        </Card.Footer>
      </Card>
    </Link>
  );
}

function PaymentsContent() {
  const router = useRouter();
  const [filters, setFilters] = useState<PaymentHistoryFilter>({ years: [], statuses: [], sort: "Newest" });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const unitsQuery = useLandlordApartments();
  const [apartmentId, setApartmentId] = useState<string | null>(null);
  const activeApartmentId = apartmentId ?? unitsQuery.apartments[0]?.id ?? null;
  const paymentsQuery = useLandlordPayments(activeApartmentId);

  const currentYear = String(new Date().getFullYear());
  const availableYears = useMemo(
    () => [...new Set(paymentsQuery.payments.map(toYear))].sort((a, b) => Number(b) - Number(a)),
    [paymentsQuery.payments],
  );
  const activeCount = filters.years.length + filters.statuses.length;

  const filtered = useMemo(() => {
    let r = [...paymentsQuery.payments];
    if (filters.years.length > 0) r = r.filter((p) => filters.years.includes(toYear(p)));
    if (filters.statuses.length > 0) r = r.filter((p) => filters.statuses.includes(paymentStatusLabel(p.status)));
    const dir = filters.sort === "Newest" ? -1 : 1;
    r.sort((a, b) => dir * (new Date(a.date).getTime() - new Date(b.date).getTime()));
    return r;
  }, [filters, paymentsQuery.payments]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaymentRecord[]>();
    for (const p of filtered) {
      const y = toYear(p);
      if (!map.has(y)) map.set(y, []);
      map.get(y)!.push(p);
    }
    const dir = filters.sort === "Newest" ? -1 : 1;
    return [...map.entries()].sort(([a], [b]) => dir * (Number(a) - Number(b)));
  }, [filtered, filters.sort]);

  if (unitsQuery.loading || (activeApartmentId && paymentsQuery.loading)) {
    return (
      <div className="p-4 flex flex-col items-center justify-center py-20">
        <Spinner size="lg" color="current" className="text-primary" />
        <p className="text-zinc-500 mt-4 text-sm font-inter">Loading payments…</p>
      </div>
    );
  }

  if (unitsQuery.error || paymentsQuery.error) {
    return (
      <div className="p-4 space-y-4">
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          {unitsQuery.error ?? paymentsQuery.error ?? "We could not load payments."}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full"
          onPress={() => {
            void unitsQuery.refresh();
            void paymentsQuery.refresh();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (unitsQuery.apartments.length === 0) {
    return (
      <div className="p-4 space-y-2">
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-zinc-500">No units found. Payments for your units will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex flex-col gap-1">
        <Button variant="outline" size="sm" onPress={() => router.back()} className="w-fit">
          <ArrowLeft size={16} /> Back
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Banknote size={22} className="text-primary" /> Payments
            </h1>
            <p className="text-sm text-zinc-500 mt-1">Payments for this unit will appear here.</p>
          </div>
          <Button variant="secondary" size="sm" className="rounded-full relative w-fit" onPress={() => setDrawerOpen(true)}>
            <SlidersHorizontal size={14} /> Filters
            {activeCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                {activeCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <Select
        placeholder="Select unit"
        value={activeApartmentId}
        onChange={(key) => setApartmentId(key ? String(key) : null)}
        className="max-w-md"
      >
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {unitsQuery.apartments.map((apt) => (
              <ListBox.Item key={apt.id} id={apt.id} textValue={apt.name}>
                {apt.name}
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      {filtered.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <Card.Content className="py-16 flex flex-col items-center gap-3 text-center">
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 p-5">
              <Receipt size={32} className="text-primary" />
            </span>
            <p className="text-base font-nunito font-bold text-zinc-900 dark:text-zinc-100">No payments found</p>
            <p className="text-sm text-zinc-500 max-w-sm">Try adjusting your filters to see more results.</p>
            <Button variant="secondary" size="sm" onPress={() => setFilters({ years: [], statuses: [], sort: "Newest" })}>
              Clear filters
            </Button>
          </Card.Content>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([year, payments]) => (
            <section key={year} className="space-y-3">
              <SectionHeader year={year} currentYear={currentYear} />
              <div className="grid gap-3">
                {activeApartmentId &&
                  payments.map((p) => <LandlordRowCard key={p.id} payment={p} apartmentId={activeApartmentId} />)}
              </div>
            </section>
          ))}
        </div>
      )}

      <PaymentHistoryFilters
        filters={filters}
        onChange={setFilters}
        availableYears={availableYears}
        currentYear={currentYear}
        isOpen={drawerOpen}
        onOpenChange={setDrawerOpen}
        activeCount={activeCount}
      />
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 flex flex-col items-center justify-center py-20">
          <Spinner size="lg" color="current" className="text-primary" />
          <p className="text-zinc-500 mt-4 text-sm font-inter">Loading payments…</p>
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  );
}
