"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, Chip, Spinner, useOverlayState } from "@heroui/react";
import { ArrowLeft, Banknote, Receipt, SlidersHorizontal } from "lucide-react";
import { MOCK_PAYMENTS } from "../constants";
import type { PaymentHistoryFilter, PaymentRecord } from "../types";
import { formatDateShort, formatPesoDisplay, methodLabel, paymentStatusLabel, periodMonthLabel } from "../utils";
import PaymentHistoryFilters from "../components/PaymentHistoryFilters";
import ReceiptModal from "../components/ReceiptModal";

function toYear(payment: PaymentRecord): string {
  const src = payment.period_start ?? payment.date;
  return src.slice(0, 4);
}

function SectionHeader({ year, currentYear }: { year: string; currentYear: string }) {
  const isThisYear = year === currentYear;
  if (isThisYear) {
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

function PaymentRowCard({ payment }: { payment: PaymentRecord }) {
  const status = paymentStatusLabel(payment.status);
  const color: "success" | "warning" | "danger" | "default" =
    status === "Paid" ? "success" : status === "Pending" ? "warning" : status === "Failed" ? "danger" : "danger";

  return (
    <Link href={`/tenant/payment/history?receipt=${payment.id}`} className="no-underline" scroll={false}>
      <Card className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm hover:border-primary/30 hover:shadow-md transition-all">
        <Card.Content className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-nunito font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {periodMonthLabel(payment.due_date ?? payment.period_start ?? payment.date)}{" "}
                <span className="text-zinc-400 font-normal">• {formatDateShort(payment.date)}</span>
              </p>
              <p className="text-xs text-zinc-500 truncate mt-0.5">{payment.apartment_name ?? "—"}</p>
              <p className="text-xs text-zinc-400 mt-1">via {methodLabel(payment.method)}</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <span className="text-sm font-nunito font-bold text-primary">{formatPesoDisplay(payment.amount)}</span>
              <Chip size="sm" variant="soft" color={color} className="text-[11px]">
                {status}
              </Chip>
            </div>
          </div>
        </Card.Content>
      </Card>
    </Link>
  );
}

function HistoryContent() {
  const router = useRouter();
  const params = useSearchParams();
  const [filters, setFilters] = useState<PaymentHistoryFilter>({ years: [], statuses: [], sort: "Newest" });
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Receipt popup driven by ?receipt=<id> — deep-linkable, back-button
  // closes it naturally. Unresolvable ids simply never open the modal.
  const receiptId = params.get("receipt");
  const receiptPayment = useMemo(
    () => MOCK_PAYMENTS.find((p) => p.id === receiptId) ?? null,
    [receiptId],
  );
  const receiptState = useOverlayState({
    isOpen: receiptPayment !== null,
    onOpenChange: (open) => {
      if (!open) router.replace("/tenant/payment/history");
    },
  });
  const closeReceipt = () => router.replace("/tenant/payment/history");

  const currentYear = String(new Date().getFullYear());
  const availableYears = useMemo(() => [...new Set(MOCK_PAYMENTS.map(toYear))].sort((a, b) => Number(b) - Number(a)), []);

  const activeCount = filters.years.length + filters.statuses.length;

  const filtered = useMemo(() => {
    let r = [...MOCK_PAYMENTS];
    if (filters.years.length > 0) r = r.filter((p) => filters.years.includes(toYear(p)));
    if (filters.statuses.length > 0) r = r.filter((p) => filters.statuses.includes(paymentStatusLabel(p.status)));
    const dir = filters.sort === "Newest" ? -1 : 1;
    r.sort((a, b) => dir * (new Date(a.date).getTime() - new Date(b.date).getTime()));
    return r;
  }, [filters]);

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

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-1 mb-4">
          <Link href="/tenant/payment" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-700 w-fit">
            <ArrowLeft size={14} /> Back to payment
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-nunito font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Banknote size={22} className="text-primary" /> Payment History
              </h1>
              <p className="text-sm text-zinc-500 mt-1">All rent payments — tap any row for the per-row receipt.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="rounded-full relative" onPress={() => setDrawerOpen(true)}>
                <SlidersHorizontal size={14} /> Filters
                {activeCount > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {activeCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
          {activeCount > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {filters.years.map((y) => (
                <Chip key={y} size="sm" variant="soft" color="accent">
                  {y === currentYear ? "This Year" : y}
                </Chip>
              ))}
              {filters.statuses.map((s) => (
                <Chip key={s} size="sm" variant="soft" color="accent">
                  {s}
                </Chip>
              ))}
              <span className="text-xs text-zinc-400 self-center">• {filtered.length} result(s)</span>
            </div>
          )}
        </div>

        {/* Content */}
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
                  {payments.map((p) => (
                    <PaymentRowCard key={p.id} payment={p} />
                  ))}
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

        {receiptPayment && (
          <ReceiptModal
            payment={receiptPayment}
            state={receiptState}
            ctaLabel="Done"
            onCtaPress={closeReceipt}
          />
        )}
      </div>
    </div>
  );
}

export default function TenantPaymentHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center px-5">
          <Spinner size="lg" color="current" className="text-primary" />
          <p className="text-zinc-500 mt-4 text-base font-inter text-center">Loading payment history…</p>
        </div>
      }
    >
      <HistoryContent />
    </Suspense>
  );
}



