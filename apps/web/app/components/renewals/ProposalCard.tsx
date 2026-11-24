"use client";

import type { ReactNode } from "react";
import { Button } from "@heroui/react";
import { IconCoins, IconFileText, IconInfoCircle, IconShieldCheck } from "@tabler/icons-react";
import { formatPesoDisplay, type LeaseRenewalProposal } from "@repo/utils";
import StatusChip from "@/app/components/display/StatusChip";

function formatProposalDate(value: string) {
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface ProposalCardProps {
  proposal: LeaseRenewalProposal;
  onViewEvidence: () => void;
  evidenceBusy?: boolean;
  actions?: ReactNode;
}

export default function ProposalCard({ proposal: p, onViewEvidence, evidenceBusy = false, actions }: ProposalCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconFileText size={22} aria-hidden /></div>
          <div>
            <h2 className="font-nunito text-xl font-bold">Proposal {p.version}</h2>
            <p className="text-sm text-muted-foreground">Landlord&apos;s renewal terms and payment declaration</p>
          </div>
        </div>
        <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">{p.duration_months}-month renewal</span>
      </div>
      <dl className="mt-4 grid gap-4 rounded-xl bg-muted/20 p-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Renewal start</dt>
          <dd className="mt-1 font-semibold">{formatProposalDate(p.lease_start)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Renewal end</dt>
          <dd className="mt-1 font-semibold">{formatProposalDate(p.lease_end)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monthly rent</dt>
          <dd className="mt-1 font-semibold">{formatPesoDisplay(p.monthly_rent)}</dd>
        </div>
      </dl>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><IconCoins size={16} aria-hidden /></span>
            <h3 className="font-nunito font-bold">Advance rent &amp; credits</h3>
          </div>
          <dl className="mt-3 flex flex-col gap-2.5 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5">
              <dt className="text-muted-foreground">Advance rent covering {p.advance_period}</dt>
              <dd className="font-semibold">{formatPesoDisplay(p.monthly_rent * p.advance_months)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5">
              <dt className="text-muted-foreground">Verified applicable credit</dt>
              <dd className="font-semibold">−{formatPesoDisplay(p.advance_credit)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Advance payment due</dt>
              <dd className="font-semibold text-primary">{formatPesoDisplay(p.advance_due)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><IconShieldCheck size={16} aria-hidden /></span>
            <h3 className="font-nunito font-bold">Security deposit</h3>
          </div>
          <dl className="mt-3 flex flex-col gap-2.5 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5">
              <dt className="text-muted-foreground">Declared retained deposit</dt>
              <dd className="font-semibold">{formatPesoDisplay(p.retained_deposit)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5">
              <dt className="text-muted-foreground">Deposit replenishment</dt>
              <dd className="font-semibold text-primary">{formatPesoDisplay(p.deposit_due)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-muted-foreground">Balance verification</dt>
              <dd><StatusChip size="sm" tone="success">Landlord-declared</StatusChip></dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="mt-4 flex gap-2 rounded-xl bg-primary/5 p-3 text-sm">
        <IconInfoCircle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
        <p>The security deposit treatment is declared by the landlord and has not been independently verified by APT. Confirm the amounts with your landlord before accepting the renewal.</p>
      </div>
      {p.replenishment_reason && <p className="mt-3 text-sm"><span className="font-semibold">Landlord note</span> {p.replenishment_reason}</p>}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-border pt-4">
        {p.evidence_path ? (
          <Button variant="outline" className="rounded-full" onPress={onViewEvidence} isDisabled={evidenceBusy}><IconFileText size={14} aria-hidden /> View supporting document</Button>
        ) : <span />}
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total renewal payment</p>
          <p className="text-2xl font-bold text-primary">{formatPesoDisplay(p.advance_due + p.deposit_due)}</p>
        </div>
      </div>
      {actions ? <div className="mt-4 flex flex-wrap items-center gap-3">{actions}</div> : null}
    </section>
  );
}
