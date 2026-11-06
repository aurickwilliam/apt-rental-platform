"use client";

import { useState } from 'react';
import { Button, InputGroup, Label, TextArea } from '@heroui/react';
import { IconCalendar, IconInfoCircle, IconPencil, IconSendFilled, IconShieldCheck, IconUpload } from "@tabler/icons-react";
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
  return <form className="grid gap-4 rounded-2xl border border-border bg-card p-5 md:p-6" onSubmit={(event) => { event.preventDefault(); onSubmit(draft,file); }}>
    <div className="flex items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconPencil size={22} aria-hidden /></div>
      <div>
        <h2 className="font-nunito text-xl font-bold">Prepare renewal terms</h2>
        <p className="text-sm text-muted-foreground">Set the details for the next lease term. You can keep the same or update the rent and other charges.</p>
      </div>
    </div>
    <div className="flex gap-2 rounded-xl bg-primary/5 p-3 text-sm">
      <IconInfoCircle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
      <p>Start: {context.renewal?.requested_start}. Rent may stay the same or decrease. For a mid-month start, the new billing rate and any advance apply to the first full calendar month. The current calendar month is not charged twice.</p>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="flex flex-col gap-1.5">
        <Label>Monthly rent (₱) *</Label>
        <InputGroup className="w-full">
          <InputGroup.Prefix><span className="text-sm text-muted-foreground">₱</span></InputGroup.Prefix>
          <InputGroup.Input aria-label="Monthly rent" type="number" min={1000} step="0.01" placeholder="Enter amount" value={draft.monthlyRent} onChange={(e)=>field('monthlyRent',e.target.value)} disabled={busy}/>
        </InputGroup>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Duration (months) *</Label>
        <InputGroup className="w-full">
          <InputGroup.Prefix><IconCalendar size={16} className="text-muted-foreground" aria-hidden /></InputGroup.Prefix>
          <InputGroup.Input aria-label="Renewal duration in months" type="number" min={1} max={120} placeholder="Enter duration" value={draft.durationMonths} onChange={(e)=>field('durationMonths',e.target.value)} disabled={busy}/>
        </InputGroup>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Deposit amount you declare is still retained (₱) *</Label>
        <InputGroup className="w-full">
          <InputGroup.Prefix><span className="text-sm text-muted-foreground">₱</span></InputGroup.Prefix>
          <InputGroup.Input aria-label="Declared retained deposit" type="number" min={0} step="0.01" placeholder="Enter amount" value={draft.retainedDeposit} onChange={(e)=>field('retainedDeposit',e.target.value)} disabled={busy}/>
        </InputGroup>
      </div>
      <div className="flex items-center gap-3 self-start rounded-xl bg-muted/30 p-3 md:self-center">
        <IconShieldCheck size={20} className="shrink-0 text-muted-foreground" aria-hidden />
        <div>
          <p className="text-sm font-semibold">Recorded deposit target: {context.depositTarget===null?'Unknown — needs review':`₱${context.depositTarget.toLocaleString()}`}</p>
          <p className="text-xs text-muted-foreground">This is not the actual remaining balance.</p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Replenishment *</Label>
        <SettingsSelect label="Replenishment" value={draft.replenishmentKind} options={[{value:'none',label:'No replenishment needed'},{value:'partial',label:'Partial replenishment'},{value:'full',label:'Full replenishment'}]} onChange={(v)=>field('replenishmentKind',v)} isDisabled={busy} className="w-full"/>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Advance rent *</Label>
        <SettingsSelect label="Advance rent" value={draft.advanceMonths} options={[{value:'0',label:'No advance rent'},{value:'1',label:'One month advance rent'}]} onChange={(v)=>field('advanceMonths',v)} isDisabled={busy} className="w-full"/>
      </div>
    </div>
    <div className="flex flex-col gap-1.5">
      <Label>Explanation for replenishment</Label>
      <TextArea aria-label="Explanation for replenishment" maxLength={1000} placeholder="Enter explanation (optional)" value={draft.reason} onChange={(e)=>field('reason',e.target.value)} disabled={busy} className="w-full"/>
    </div>
    <div className="flex flex-col gap-1.5">
      <Label>Optional supporting document (up to 10 MB)</Label>
      <span className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-border p-6 text-center">
        <IconUpload size={24} className="text-muted-foreground" aria-hidden />
        <span className="text-sm"><span className="font-semibold text-primary">Choose File</span> or drag and drop</span>
        <span className="text-xs text-muted-foreground">{file?file.name:'No file chosen · Up to 10 MB'}</span>
        <input aria-label="Supporting document" type="file" accept={SIGNED_LEASE_ACCEPT} onChange={(e)=>setFile(e.target.files?.[0]??null)} disabled={busy} className="sr-only" />
      </span>
    </div>
    <div className="flex gap-2 rounded-xl bg-primary/5 p-3 text-sm">
      <IconInfoCircle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
      <p>{RENEWAL_DEPOSIT_NOTICE} APT checks recorded payments before calculating applicable credit. The tenant reviews the final separate charges before acceptance.</p>
    </div>
    <Button type="submit" className="w-full" isDisabled={busy}><IconSendFilled size={16} aria-hidden /> Send proposal for tenant review</Button>
  </form>;
}
