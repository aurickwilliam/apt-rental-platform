"use client";

import { useState } from 'react';
import { Button, InputGroup, Label, TextArea } from '@heroui/react';
import { IconInfoCircle, IconPencil, IconSendFilled, IconShieldCheck } from "@tabler/icons-react";
import { initialRenewalProposalDraft, lockedRenewalDurationMonths, RENEWAL_DEPOSIT_NOTICE, type LeaseRenewalContext, type RenewalProposalDraft } from '@repo/utils';
import SettingsSelect from '@/app/components/settings/SettingsSelect';
import RenewalFileDropbox from './RenewalFileDropbox';

interface RenewalProposalFormProps {
  context: LeaseRenewalContext;
  busy: boolean;
  onSubmit: (draft: RenewalProposalDraft, file: File|null) => void;
}

export default function RenewalProposalForm({ context, busy, onSubmit }: RenewalProposalFormProps) {
  const [draft,setDraft] = useState(() => initialRenewalProposalDraft(context));
  const [file,setFile] = useState<File|null>(null);
  const field = (name: keyof RenewalProposalDraft, value: string) => setDraft((current) => ({...current,[name]:value}));
  const lockedMonths=lockedRenewalDurationMonths(context);
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
      <p>Start: {context.renewal?.requested_start}. Duration is the same as the previous lease and cannot be changed. Rent may stay the same or decrease. For a mid-month start, the new billing rate and any advance apply to the first full calendar month. The current calendar month is not charged twice.</p>
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
        <Label>Renewal duration (same as previous lease)</Label>
        {lockedMonths===null
          ? <p role="alert" className="text-sm text-danger">Previous lease length is unclear. The renewal needs review.</p>
          : <p className="rounded-xl bg-muted/30 px-3 py-3 text-sm font-semibold">{lockedMonths} months</p>}
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
    <RenewalFileDropbox id="renewal-supporting-document" label="Optional supporting document (up to 10 MB)" file={file} busy={busy} onFileChange={setFile} />
    <div className="flex gap-2 rounded-xl bg-primary/5 p-3 text-sm">
      <IconInfoCircle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
      <p>{RENEWAL_DEPOSIT_NOTICE} APT checks recorded payments before calculating applicable credit. The tenant reviews the final separate charges before acceptance.</p>
    </div>
    <Button type="submit" className="w-full" isDisabled={busy||lockedMonths===null}><IconSendFilled size={16} aria-hidden /> Send proposal for tenant review</Button>
  </form>;
}
