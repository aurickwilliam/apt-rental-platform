"use client";

import { useState } from 'react';
import { Button, Input, Label, TextArea } from '@heroui/react';
import { initialRenewalProposalDraft, RENEWAL_DEPOSIT_NOTICE, type LeaseRenewalContext, type RenewalProposalDraft } from '@repo/utils';
import SettingsSelect from '@/app/components/settings/SettingsSelect';
import { SIGNED_LEASE_ACCEPT } from '@/lib/signed-lease';

interface RenewalProposalFormProps {
  context: LeaseRenewalContext;
  busy: boolean;
  onSubmit: (draft: RenewalProposalDraft, file: File|null) => void;
}

export default function RenewalProposalForm({ context, busy, onSubmit }: RenewalProposalFormProps) {
  const [draft,setDraft] = useState(() => initialRenewalProposalDraft(context));
  const [file,setFile] = useState<File|null>(null);
  const field = (name: keyof RenewalProposalDraft, value: string) => setDraft((current) => ({...current,[name]:value}));
  return <form className="grid gap-4 rounded-2xl border border-border bg-card p-5" onSubmit={(event) => { event.preventDefault(); onSubmit(draft,file); }}>
    <h2 className="font-nunito text-xl font-bold">Prepare renewal terms</h2>
    <p className="text-sm text-muted-foreground">Start: {context.renewal?.requested_start}. Rent may stay the same or decrease. For a mid-month start, the new billing rate and any advance apply to the first full calendar month. The current calendar month is not charged twice.</p>
    <Label>Monthly rent (₱)<Input aria-label="Monthly rent" type="number" min={1000} step="0.01" value={draft.monthlyRent} onChange={(e)=>field('monthlyRent',e.target.value)} disabled={busy}/></Label>
    <Label>Duration (months)<Input aria-label="Renewal duration in months" type="number" min={1} max={120} value={draft.durationMonths} onChange={(e)=>field('durationMonths',e.target.value)} disabled={busy}/></Label>
    <p className="text-sm">Recorded deposit target: {context.depositTarget===null?'Unknown — needs review':`₱${context.depositTarget.toLocaleString()}`}. This is not the actual remaining balance.</p>
    <Label>Deposit amount you declare is still retained (₱)<Input aria-label="Declared retained deposit" type="number" min={0} step="0.01" value={draft.retainedDeposit} onChange={(e)=>field('retainedDeposit',e.target.value)} disabled={busy}/></Label>
    <SettingsSelect label="Deposit replenishment" value={draft.replenishmentKind} options={[{value:'none',label:'No replenishment needed'},{value:'partial',label:'Partial replenishment'},{value:'full',label:'Full replenishment'}]} onChange={(v)=>field('replenishmentKind',v)} isDisabled={busy} className="w-full"/>
    <SettingsSelect label="Advance rent" value={draft.advanceMonths} options={[{value:'0',label:'No advance rent'},{value:'1',label:'One month advance rent'}]} onChange={(v)=>field('advanceMonths',v)} isDisabled={busy} className="w-full"/>
    <Label>Explanation for replenishment<TextArea aria-label="Explanation for replenishment" maxLength={1000} value={draft.reason} onChange={(e)=>field('reason',e.target.value)} disabled={busy}/></Label>
    <Label>Optional supporting document (up to 10 MB)<input aria-label="Supporting document" type="file" accept={SIGNED_LEASE_ACCEPT} onChange={(e)=>setFile(e.target.files?.[0]??null)} disabled={busy}/></Label>
    <p className="text-sm text-muted-foreground">{RENEWAL_DEPOSIT_NOTICE} APT checks recorded payments before calculating applicable credit. The tenant reviews the final separate charges before acceptance.</p>
    <Button type="submit" isDisabled={busy}>Send proposal for tenant review</Button>
  </form>;
}
