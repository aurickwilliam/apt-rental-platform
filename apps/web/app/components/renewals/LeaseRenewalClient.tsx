"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Label, Modal, Spinner, TextArea } from "@heroui/react";
import {
  IconArrowLeft,
  IconCalendar,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconCoins,
  IconFileText,
  IconInfoCircle,
  IconRefresh,
  IconSendFilled,
  IconShieldCheck,
  IconX,
} from "@tabler/icons-react";
import { canRequestLeaseRenewal, canTakeRenewalAction, formatPesoDisplay, lockedRenewalDurationMonths,
  RENEWAL_DEPOSIT_NOTICE, renewalDefaultStart, renewalStatusLabel, type RenewalPortal,
  type RenewalStatus } from '@repo/utils';
import { useAuthIdentity } from '@/hooks/use-auth-identity';
import { useLeaseRenewal } from '@/hooks/use-lease-renewal';
import { getContactConversationKey } from '@/lib/conversation-contacts';
import StatusChip from '@/app/components/display/StatusChip';
import RenewalProposalForm from './RenewalProposalForm';
import RenewalPayment from './RenewalPayment';
import { SIGNED_LEASE_ACCEPT } from '@/lib/signed-lease';

interface LeaseRenewalClientProps { tenancyId:string;portal:RenewalPortal;authUserId:string }

export default function LeaseRenewalClient(props:LeaseRenewalClientProps) {
  const identity=useAuthIdentity(props.authUserId);
  if(identity.authUserId!==props.authUserId) return <p role="status">Your session changed. Reopen your rental to continue.</p>;
  return <RenewalContent key={`${props.authUserId}:${identity.generation}:${props.portal}:${props.tenancyId}`} {...props}/>;
}

function getProgressSteps(status: RenewalStatus | null) {
  const labels = ["Renewal request", "Payment configuration", "Renewal decision"];
  type StepState = "done" | "current" | "todo";
  if (!status) return labels.map((label, i) => ({ label, state: (i === 0 ? "current" : "todo") as StepState }));
  if (status === "pending_landlord_review") return [
    { label: labels[0], state: "current" as StepState },
    { label: labels[1], state: "todo" as StepState },
    { label: labels[2], state: "todo" as StepState },
  ];
  if (status === "awaiting_payment_configuration" || status === "awaiting_tenant_confirmation" || status === "awaiting_agreement_confirmation") return [
    { label: labels[0], state: "done" as StepState },
    { label: labels[1], state: "current" as StepState },
    { label: labels[2], state: "todo" as StepState },
  ];
  if (status === "awaiting_payment" || status === "payment_verification_pending") return [
    { label: labels[0], state: "done" as StepState },
    { label: labels[1], state: "done" as StepState },
    { label: labels[2], state: "current" as StepState },
  ];
  if (status === "renewed" || status === "declined" || status === "not_renewing") return [
    { label: labels[0], state: "done" as StepState },
    { label: labels[1], state: "done" as StepState },
    { label: labels[2], state: "done" as StepState },
  ];
  return [
    { label: labels[0], state: "done" as StepState },
    { label: labels[1], state: "current" as StepState },
    { label: labels[2], state: "todo" as StepState },
  ];
}

function RenewalContent({tenancyId,portal}:LeaseRenewalClientProps) {
  const renewal=useLeaseRenewal(tenancyId,portal);
  const [reason,setReason]=useState('');
  const [confirm,setConfirm]=useState<'not_renewing'|'decline'|null>(null);
  const [file,setFile]=useState<File|null>(null);
  const [showProposal,setShowProposal]=useState(false);
  if(renewal.loading) return <div className="p-6" role="status"><Spinner/> Loading renewal…</div>;
  const c=renewal.data;
  if(!c || renewal.error) return <div className="p-6"><p role="alert">{renewal.error??'Renewal unavailable.'}</p><Button onPress={()=>void renewal.refresh()}>Retry</Button></div>;
  const r=c.renewal,p=c.proposals.find((proposal)=>proposal.id===r?.current_proposal_id);
  const allowed=(action:Parameters<typeof canTakeRenewalAction>[2])=>!!r&&canTakeRenewalAction(r.status,portal,action);
  const canApprove=allowed('approve');
  const canPropose=allowed('propose');
  const canDecline=allowed('decline');
  const peer=portal==='tenant'?c.landlordId:c.tenantId;
  const conversation=encodeURIComponent(getContactConversationKey(peer,c.apartmentId));
  const lockedMonths=lockedRenewalDurationMonths(c);
  const confirmation=c.agreement&&(portal==='tenant'?c.agreement.tenant_confirmed_at:c.agreement.landlord_confirmed_at);
  const statusLabel=r?renewalStatusLabel(r.status,p?.lease_start??null,c.today):null;
  const statusTone=r?(r.status==='renewed'?'success':r.status==='declined'?'danger':'warning'):'neutral';
  const steps=getProgressSteps(r?.status??null);
  const currentStatusText=statusLabel ?? (canRequestLeaseRenewal(c.leaseEnd,c.today,c.active)
    ? `Current lease ends ${c.leaseEnd??'on an unrecorded date'}.`
    : `Current lease ends ${c.leaseEnd??'on an unrecorded date'}. Requests open during the final 30 days.`);
  const renewsOn = (() => {
    const start = renewalDefaultStart(c.leaseEnd);
    if (!start) return null;
    const d = new Date(`${start}T00:00:00`);
    return Number.isNaN(d.getTime()) ? start : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  })();
  const renewalModal = (
    <Modal isOpen={confirm!==null} onOpenChange={(open)=>{if(!open&&!renewal.isLocked())setConfirm(null);}}>
      <Modal.Backdrop><Modal.Container><Modal.Dialog><Modal.Header><Modal.Heading>{confirm==='not_renewing'?'Confirm you will not renew':'Decline this renewal?'}</Modal.Heading></Modal.Header><Modal.Body>
        <p className="text-sm text-foreground">This records your decision and notifies the other party. It does not end the current tenancy.</p>
        {confirm==='decline'&&<Label>Reason<TextArea aria-label="Reason for declining" value={reason} maxLength={1000} onChange={(e)=>setReason(e.target.value)}/></Label>}
        {renewal.actionError&&<p role="alert" className="text-sm text-danger">{renewal.actionError}</p>}
      </Modal.Body><Modal.Footer><Button variant="outline" isDisabled={renewal.busy} onPress={()=>{if(!renewal.isLocked())setConfirm(null);}}>Cancel</Button><Button isDisabled={renewal.busy||(confirm==='decline'&&!reason.trim())} onPress={()=>{const action=confirm;if(action)void renewal.act(action,{durationMonths:lockedMonths,reason}).then((saved)=>{if(saved)setConfirm(null);});}}>Confirm decision</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  );
  if (portal === "landlord") {
    return <main className="w-full min-w-0 px-4 py-6 sm:px-6">
      <Link href={`/landlord/properties/${c.apartmentId}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50"><IconArrowLeft size={16} aria-hidden /> Back to property</Link>
      <header className="mt-3">
        <h1 className="font-nunito text-3xl font-bold">Lease Renewal</h1>
        <p className="mt-1 text-muted-foreground">{c.apartmentName} · {c.tenantName}</p>
      </header>
      <div className="mt-6 flex min-w-0 flex-col gap-5">
        {(renewal.actionError||renewal.revalidationError)&&<p role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{renewal.actionError||renewal.revalidationError} Refresh to confirm the saved state before repeating an action.</p>}
        <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconFileText size={22} aria-hidden /></div>
            <div>
              <h2 className="font-nunito text-xl font-bold">Current agreed lease</h2>
              <p className="text-sm text-muted-foreground">Your existing lease agreement and key details.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-6 md:grid-cols-[minmax(0,1fr)_220px]">
            <dl className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground"><IconCalendar size={16} aria-hidden /> Lease period</dt>
                <dd className="text-right font-semibold">{c.leaseStart} – {c.leaseEnd??"No end date recorded"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground"><IconCoins size={16} aria-hidden /> Monthly rent</dt>
                <dd className="text-right font-semibold">{formatPesoDisplay(c.monthlyRent??0)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-sm text-muted-foreground"><IconShieldCheck size={16} aria-hidden /> Recorded deposit target</dt>
                <dd className="text-right font-semibold">{c.depositTarget===null?"Unknown":formatPesoDisplay(c.depositTarget)}</dd>
              </div>
            </dl>
            <div className="border-t border-border pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><IconCalendar size={18} className="text-primary" aria-hidden /> Renews on</p>
              <p className="mt-1 text-xl font-bold text-primary">{renewsOn ?? "—"}</p>
              <p className="mt-2 text-sm text-muted-foreground">Prepare your renewal terms to continue your tenancy.</p>
            </div>
          </div>
          <div className="mt-5 flex gap-2 rounded-xl bg-primary/5 p-3 text-sm">
            <IconInfoCircle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <p>The recorded deposit is not a verified remaining balance. Renewal does not end your current tenancy early.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {c.originalAgreementPath&&<Button variant="outline" isDisabled={renewal.busy} onPress={()=>void renewal.view(c.originalAgreementPath!,'signed-leases')}><IconFileText size={16} aria-hidden /> View original agreement</Button>}
            {r ? <StatusChip tone={statusTone}><IconClock size={14} aria-hidden /> {statusLabel}</StatusChip> : <StatusChip tone="neutral">No renewal yet</StatusChip>}
          </div>
        </section>
        {r&&canApprove&&<section className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-nunito text-xl font-bold">Renewal decision</h2>
          <p className="text-sm text-muted-foreground">Review the tenant&apos;s request and approve to prepare payment terms, or decline.</p>
          <Button isDisabled={renewal.busy} onPress={()=>void renewal.act('approve')}>Approve request and prepare payment terms</Button>
        </section>}
        {r&&canPropose&&<RenewalProposalForm key={r.version} context={c} busy={renewal.busy} onSubmit={(draft,evidence)=>void renewal.propose(draft,evidence)}/>}
        {r&&canDecline&&<div><Button variant="outline" className="rounded-full" isDisabled={renewal.busy} onPress={()=>setConfirm('decline')}><IconX size={16} aria-hidden /> Decline Renewal</Button></div>}
        {p&&<section className="grid gap-2 rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-nunito text-xl font-bold">Proposal {p.version}</h2>
          <p>{p.lease_start} – {p.lease_end} · {p.duration_months} months</p><p>Monthly rent: {formatPesoDisplay(p.monthly_rent)}</p>
          <p>Advance rent covering {p.advance_period}: {formatPesoDisplay(p.monthly_rent*p.advance_months)}</p>
          <p>Verified applicable credit: −{formatPesoDisplay(p.advance_credit)}</p><p>Advance due: {formatPesoDisplay(p.advance_due)}</p>
          <p>Declared retained deposit: {formatPesoDisplay(p.retained_deposit)}</p><p>Deposit replenishment: {formatPesoDisplay(p.deposit_due)}</p>
          {p.replenishment_reason&&<p>{p.replenishment_reason}</p>}<p className="text-sm text-muted-foreground">{RENEWAL_DEPOSIT_NOTICE}</p>
          {p.evidence_path&&<Button variant="outline" onPress={()=>void renewal.view(p.evidence_path!)} isDisabled={renewal.busy}>View supporting document</Button>}
          <p className="font-bold">Total renewal payment: {formatPesoDisplay(p.advance_due+p.deposit_due)}</p>
          {allowed('discuss')&&<Link className="text-sm text-primary" href={`/landlord/messages?conversation=${conversation}`}>Discuss Charges — message tenant</Link>}
        </section>}
        {r?.status==='awaiting_agreement_confirmation'&&p&&<section className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-nunito text-xl font-bold">Renewal agreement</h2>
          <p className="text-sm text-muted-foreground">Both parties must confirm the executed agreement matches the proposal above, including deposit treatment and payment conditions.</p>
          {!c.agreement&&<><Label>Executed renewal agreement<input aria-label="Executed renewal agreement" type="file" accept={SIGNED_LEASE_ACCEPT} disabled={renewal.busy} onChange={(e)=>setFile(e.target.files?.[0]??null)}/></Label><Button isDisabled={!file||renewal.busy} onPress={()=>file&&void renewal.uploadAgreement(file)}>Upload agreement</Button></>}
          {c.agreement&&<><Button variant="outline" isDisabled={renewal.busy} onPress={()=>void renewal.view(c.agreement!.path)}>View renewal agreement</Button><Button isDisabled={!!confirmation||renewal.busy} onPress={()=>void renewal.act('confirm_agreement',{proposalId:p.id,path:c.agreement!.path})}>{confirmation?'Your agreement confirmation is saved':'I confirm this agreement matches the proposal'}</Button></>}
        </section>}
        {c.payment&&<Link className="text-sm text-primary" href="/landlord/payments">View payment: {c.payment.status}</Link>}
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconClock size={22} aria-hidden /></div>
              <div>
                <h2 className="font-nunito text-lg font-bold">Renewal history</h2>
                <p className="text-sm text-muted-foreground">A record of your renewal requests and their status.</p>
              </div>
            </div>
            <Button variant="outline" isDisabled={renewal.busy} onPress={()=>void renewal.revalidate()}><IconRefresh size={16} aria-hidden /> Refresh renewal</Button>
          </div>
          {c.events.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">No renewal actions yet.</p> : (
            <ul className="mt-4 flex flex-col gap-2">
              {c.events.map((event) => {
                const key = event.event;
                const label = key === "approve" ? "Approved" : key === "request" ? "Request" : key.replaceAll("_", " ");
                const tone = key === "approve" || key === "renewed" || key === "confirm_agreement" || key === "accept" ? "success" : key === "declined" || key === "not_renewing" ? "danger" : key === "request" || key === "propose" ? "primary" : "neutral";
                const text = key === "approve" ? "Approved" : key === "request" ? "Request" : label;
                const pill = tone === "success"
                  ? <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success"><IconCheck size={14} aria-hidden /> {text}</span>
                  : tone === "primary"
                    ? <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><IconSendFilled size={14} aria-hidden /> {text}</span>
                    : <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{text}</span>;
                return (
                  <li key={event.id} className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-sm hover:bg-muted/30">
                    <span className="flex min-w-0 items-center gap-3"><IconCalendar size={16} className="shrink-0 text-muted-foreground" aria-hidden /><span className="truncate"><span className="font-semibold">{event.created_at.slice(0,10)}</span> · {event.event.replaceAll("_"," ")}</span></span>
                    {pill}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
      {renewalModal}
    </main>;
  }
  return <main className="w-full min-w-0 px-4 py-6 sm:px-6">
    <Link href={portal==='tenant'?'/tenant/my-rental':`/landlord/properties/${c.apartmentId}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50"><IconArrowLeft size={16} aria-hidden /> Back to {portal==='tenant'?'My Rental':'property'}</Link>
    <header className="mt-3">
      <h1 className="font-nunito text-3xl font-bold">Lease renewal</h1>
      <p className="mt-1 text-muted-foreground">{c.apartmentName} · {c.tenantName}</p>
    </header>
    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-5">
        {(renewal.actionError||renewal.revalidationError)&&<p role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{renewal.actionError||renewal.revalidationError} Refresh to confirm the saved state before repeating an action.</p>}
        <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconFileText size={22} aria-hidden /></div>
              <h2 className="font-nunito text-xl font-bold">Current agreed lease</h2>
            </div>
            {r ? <StatusChip tone={statusTone}><IconClock size={14} aria-hidden /> {statusLabel}</StatusChip> : <StatusChip tone="neutral">No renewal yet</StatusChip>}
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconCalendar size={22} aria-hidden /></div>
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">Lease dates</dt>
                <dd className="mt-0.5 font-semibold">{c.leaseStart} – {c.leaseEnd??'No end date recorded'}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconCoins size={22} aria-hidden /></div>
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">Monthly rent</dt>
                <dd className="mt-0.5 font-semibold">{formatPesoDisplay(c.monthlyRent??0)}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconShieldCheck size={22} aria-hidden /></div>
              <div className="min-w-0">
                <dt className="text-sm text-muted-foreground">Recorded deposit target</dt>
                <dd className="mt-0.5 font-semibold">{c.depositTarget===null?'Unknown':formatPesoDisplay(c.depositTarget)}</dd>
              </div>
            </div>
          </dl>
          <div className="mt-5 flex gap-2 rounded-xl bg-primary/5 p-3 text-sm">
            <IconInfoCircle size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <p>The recorded deposit is not a verified remaining balance. Renewal does not end your current tenancy early.</p>
          </div>
          {c.originalAgreementPath&&<Button variant="outline" className="mt-4" isDisabled={renewal.busy} onPress={()=>void renewal.view(c.originalAgreementPath!,'signed-leases')}><IconFileText size={16} aria-hidden /> View original agreement</Button>}
        </section>

        {!r&&portal==='tenant'&&canRequestLeaseRenewal(c.leaseEnd,c.today,c.active)&&<section className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-nunito text-xl font-bold">Would you like to renew?</h2>
          {lockedMonths===null
            ? <p role="alert" className="text-sm text-danger">Previous lease length is unclear. The renewal needs review.</p>
            : <p className="text-sm font-medium">Same duration as the previous lease: <span className="font-semibold">{lockedMonths} months</span></p>}
          <p className="text-sm text-muted-foreground">Proposed renewal start: {renewalDefaultStart(c.leaseEnd)}. The landlord will send the end date and charges for your review.</p>
          <div className="flex flex-wrap gap-3">
            <Button className="min-w-[10rem] flex-1 justify-center" isDisabled={renewal.busy||lockedMonths===null} onPress={()=>void renewal.act('request',{durationMonths:lockedMonths})}>Request Lease Renewal</Button>
            <Button variant="outline" className="min-w-[10rem] flex-1 justify-center" isDisabled={renewal.busy} onPress={()=>setConfirm('not_renewing')}>I Will Not Renew</Button>
            <Link href="/tenant/my-rental" className="inline-flex h-10 min-w-[10rem] flex-1 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-medium hover:bg-muted/50">Decide Later</Link>
          </div>
        </section>}
        {!r&&!canRequestLeaseRenewal(c.leaseEnd,c.today,c.active)&&<p className="text-sm text-muted-foreground">Requests open during the final 30 days of an active, dated lease. Missing or expired terms need review.</p>}
        {r&&(canApprove||canPropose)&&<section className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-nunito text-xl font-bold">Renewal decision</h2>
          <p className="mt-1 text-sm text-muted-foreground">Configure the renewal details and payment to proceed, or decline if you don&apos;t wish to renew.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {canDecline&&<Button variant="outline" isDisabled={renewal.busy} onPress={()=>setConfirm('decline')}>Decline Renewal</Button>}
            {canApprove&&<Button isDisabled={renewal.busy} onPress={()=>void renewal.act('approve')}>Approve request and prepare payment terms</Button>}
            {canPropose&&<Button isDisabled={renewal.busy} aria-expanded={showProposal} onPress={()=>setShowProposal((v)=>!v)}>{showProposal?'Hide renewal form':'Configure Renewal & Payment'} <IconChevronRight size={16} aria-hidden /></Button>}
          </div>
        </section>}
        {r&&canPropose&&<div hidden={!showProposal}><RenewalProposalForm key={r.version} context={c} busy={renewal.busy} onSubmit={(draft,evidence)=>void renewal.propose(draft,evidence)}/></div>}
        {r&&!canApprove&&!canPropose&&portal==='tenant'&&r.status==='awaiting_payment_configuration'&&<section className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-nunito text-xl font-bold">Waiting for landlord</h2>
          <p className="mt-1 text-sm text-muted-foreground">The landlord is configuring the renewal terms. You&apos;ll review the proposal here once it&apos;s ready.</p>
          {canDecline&&<Button variant="outline" className="mt-4" isDisabled={renewal.busy} onPress={()=>setConfirm('decline')}>Decline Renewal</Button>}
        </section>}
        {p&&<section className="grid gap-2 rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-nunito text-xl font-bold">Proposal {p.version}</h2>
          <p>{p.lease_start} – {p.lease_end} · {p.duration_months} months</p><p>Monthly rent: {formatPesoDisplay(p.monthly_rent)}</p>
          <p>Advance rent covering {p.advance_period}: {formatPesoDisplay(p.monthly_rent*p.advance_months)}</p>
          <p>Verified applicable credit: −{formatPesoDisplay(p.advance_credit)}</p><p>Advance due: {formatPesoDisplay(p.advance_due)}</p>
          <p>Declared retained deposit: {formatPesoDisplay(p.retained_deposit)}</p><p>Deposit replenishment: {formatPesoDisplay(p.deposit_due)}</p>
          {p.replenishment_reason&&<p>{p.replenishment_reason}</p>}<p className="text-sm text-muted-foreground">{RENEWAL_DEPOSIT_NOTICE}</p>
          {p.evidence_path&&<Button variant="outline" onPress={()=>void renewal.view(p.evidence_path!)} isDisabled={renewal.busy}>View supporting document</Button>}
          <p className="font-bold">Total renewal payment: {formatPesoDisplay(p.advance_due+p.deposit_due)}</p>
          {allowed('accept')&&<Button isDisabled={renewal.busy} onPress={()=>void renewal.act('accept',{proposalId:p.id})}>Accept Renewal Terms</Button>}
          {allowed('discuss')&&<Link className="text-sm text-primary" href={`/${portal}/messages?conversation=${conversation}`}>Discuss Charges — message {portal==='tenant'?'landlord':'tenant'}</Link>}
        </section>}
        {r?.status==='awaiting_agreement_confirmation'&&p&&<section className="grid gap-3 rounded-2xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-nunito text-xl font-bold">Renewal agreement</h2>
          <p className="text-sm text-muted-foreground">Both parties must confirm the executed agreement matches the proposal above, including deposit treatment and payment conditions.</p>
          {!c.agreement&&<p className="text-sm">Waiting for the landlord to upload the executed renewal agreement.</p>}
          {c.agreement&&<><Button variant="outline" isDisabled={renewal.busy} onPress={()=>void renewal.view(c.agreement!.path)}>View renewal agreement</Button><Button isDisabled={!!confirmation||renewal.busy} onPress={()=>void renewal.act('confirm_agreement',{proposalId:p.id,path:c.agreement!.path})}>{confirmation?'Your agreement confirmation is saved':'I confirm this agreement matches the proposal'}</Button></>}
        </section>}
        {r&&p&&portal==='tenant'&&['awaiting_payment','payment_verification_pending'].includes(r.status)&&<RenewalPayment key={p.id} context={c} busy={renewal.busy} run={renewal.run}/>}
        {c.payment&&<Link className="text-sm text-primary" href={portal==='tenant'?`/tenant/payment/success?referenceId=${encodeURIComponent(c.payment.referenceId??'')}`:`/landlord/payments`}>View payment: {c.payment.status}</Link>}
        {c.proposals.map((history) => (
          <details key={history.id} className="rounded-2xl border border-border bg-card p-3 md:p-4">
            <summary className="cursor-pointer text-sm font-medium">Saved proposal: {history.lease_start} – {history.lease_end}</summary>
            <p className="mt-2 text-sm">{formatPesoDisplay(history.monthly_rent)} monthly · Advance due {formatPesoDisplay(history.advance_due)} · Deposit replenishment {formatPesoDisplay(history.deposit_due)}</p>
            {history.agreement_path && <Button variant="outline" className="mt-3" isDisabled={renewal.busy} onPress={() => void renewal.view(history.agreement_path!)}>View preserved agreement</Button>}
          </details>
        ))}
      </div>

      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-nunito text-lg font-bold">Renewal progress</h2>
          <div className="mt-4 flex items-start" role="list" aria-label="Renewal progress">
            {steps.map((step, i) => (
              <div key={step.label} role="listitem" aria-current={step.state === "current" ? "step" : undefined} className={i === 0 ? "flex shrink-0 flex-col items-center text-center" : "flex flex-1 flex-col items-center text-center"}>
                <div className={`flex size-8 items-center justify-center rounded-full border-2 ${step.state === "done" ? "border-primary bg-primary text-white" : step.state === "current" ? "border-primary bg-card text-primary" : "border-border bg-card text-muted-foreground"}`}>
                  {step.state === "done" ? <IconCheck size={16} aria-hidden /> : step.state === "current" ? <span className="size-2.5 rounded-full bg-primary" aria-hidden /> : null}
                </div>
                <p className={`mt-2 w-20 text-xs leading-tight ${step.state === "current" ? "font-semibold text-primary" : step.state === "done" ? "font-medium text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                {i < steps.length - 1 && <div className={`mx-1 mt-4 h-0.5 min-w-8 flex-1 ${step.state === "done" ? "bg-primary" : "bg-muted/40"}`} aria-hidden />}
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-3 rounded-xl bg-primary/5 p-3">
            <IconClock size={20} className="mt-0.5 shrink-0 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-semibold">Current status</p>
              <p className="text-sm">{currentStatusText}</p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <h2 className="font-nunito text-lg font-bold">Renewal history</h2>
          {c.events.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No renewal actions yet.</p> : (
            <ol className="mt-4 flex flex-col gap-3">
              {c.events.map((event, index) => {
                const done = /approve|renewed|confirm/.test(event.event);
                return (
                  <li key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`mt-2 size-2.5 shrink-0 rounded-full ${index === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} aria-hidden />
                      {index < c.events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" aria-hidden />}
                    </div>
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl bg-muted/20 px-3 py-2 text-sm">
                      <span className="min-w-0"><span className="font-semibold">{event.created_at.slice(0,10)}</span> · {event.event.replaceAll('_',' ')}{event.reason?` — ${event.reason}`:''}</span>
                      {done ? <IconCheck size={16} className="shrink-0 text-success" aria-hidden /> : <IconFileText size={16} className="shrink-0 text-muted-foreground" aria-hidden />}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <Button variant="outline" className="mt-4" isDisabled={renewal.busy} onPress={()=>void renewal.revalidate()}><IconRefresh size={16} aria-hidden /> Refresh renewal</Button>
        </section>
      </div>
    </div>
    {renewalModal}
  </main>;
}
