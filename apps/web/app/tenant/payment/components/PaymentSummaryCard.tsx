"use client";

import { Card, Chip, Separator } from "@heroui/react";
import { formatPesoDisplay } from "../utils";
import type { TenancyBill } from "@repo/utils";

interface PaymentSummaryCardProps {
  bill?: TenancyBill | null;
  month: string;
  year: string;
  dueDate: string;
  monthlyRent: number;
  fees?: { title: string; amount: number }[];
  className?: string;
}

function formatDueDate(iso: string): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(d);
}

type DueStatus = { label: string; color: "default" | "danger" | "warning" } | null;

function getDueStatus(iso: string): DueStatus {
  const due = new Date(`${iso.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    return { label: `${daysOverdue} day${daysOverdue === 1 ? "" : "s"} overdue`, color: "danger" };
  }
  if (daysUntilDue === 0) return { label: "Due today", color: "danger" };
  if (daysUntilDue <= 5) return { label: `${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"} left`, color: "danger" };
  return { label: `${daysUntilDue} days left`, color: "warning" };
}

export default function PaymentSummaryCard({ month, year, dueDate, monthlyRent, fees = [], bill, className = "" }: PaymentSummaryCardProps) {
  const feesTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const total = bill?.totalDue ?? monthlyRent + feesTotal;
  const dueStatus = total > 0 ? getDueStatus(dueDate) : null;
  return (
    <Card className={`flex h-full flex-col rounded-2xl border border-border bg-card shadow-none ${className}`}>
      <Card.Header className="px-4 pt-4 pb-3">
        <div className="flex w-full flex-wrap items-center justify-between gap-2 text-left">
          <h3 className="text-lg font-nunito font-bold text-foreground">Payment Summary</h3>
          <Chip size="sm" variant="soft" color="success" className="shrink-0">{bill?.kind === "move_in" ? "Move-in payment" : bill?.coveredByAdvance ? "Covered by advance rent" : "Monthly rent · Billed in full"}</Chip>
        </div>
      </Card.Header>
      <Card.Content className="flex flex-1 flex-col space-y-3 px-4 pb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Billing Period</span>
          <span className="font-nunito font-semibold text-foreground">
            {month}, {year}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-2">
            <span className="text-muted-foreground">Due Date</span>
            {dueStatus && (
              <Chip size="sm" variant="soft" color={dueStatus.color} className="shrink-0">
                {dueStatus.label}
              </Chip>
            )}
          </span>
          <span className="text-right font-nunito font-semibold text-foreground">{formatDueDate(dueDate)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{bill?.kind === "move_in" ? "First month’s rent" : "Rent due"}</span>
          <span className="font-nunito font-semibold text-foreground">{formatPesoDisplay(bill?.rentDue ?? monthlyRent)}</span>
        </div>
        {bill?.kind === "move_in" && <>
          <p className="text-xs text-muted-foreground">{formatDueDate(bill.dueDate)} – {formatDueDate(bill.periodEnd)}. Billed in full; no prorating.</p>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Security deposit</span>
            <span className="font-nunito font-semibold text-foreground">{formatPesoDisplay(bill.securityDeposit)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Advance rent — month 2</span>
            <span className="font-nunito font-semibold text-foreground">{formatPesoDisplay(bill.advanceRent)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The security deposit is held separately, not used as rent.
            {bill.advancePeriodStart && bill.advancePeriodEnd ? ` Advance rent covers ${formatDueDate(bill.advancePeriodStart)} – ${formatDueDate(bill.advancePeriodEnd)}, once payment is confirmed.` : " No advance rent is included; month 2 is payable normally."}
          </p>
        </>}
        {bill?.coveredByAdvance && <p className="text-xs text-muted-foreground">Month 2 rent was prepaid. Any maintenance fees below are separate.</p>}
        {fees.slice(0, 3).map((fee) => (
          <div key={fee.title} className="flex items-center justify-between text-sm">
            <span className="truncate text-muted-foreground">Fee — {fee.title}</span>
            <span className="shrink-0 font-nunito font-semibold text-foreground">+ {formatPesoDisplay(fee.amount)}</span>
          </div>
        ))}
        {fees.length > 3 && (
          <p className="text-xs text-muted-foreground">+{fees.length - 3} more fees included</p>
        )}

        <Separator className="my-1" />

        <div className="mt-auto flex items-center justify-between rounded-xl bg-primary/10 p-3">
          <span className="text-base font-nunito font-bold text-primary">Total Payment</span>
          <span className="text-2xl font-nunito font-bold text-primary">{formatPesoDisplay(total)}</span>
        </div>
      </Card.Content>
    </Card>
  );
}



