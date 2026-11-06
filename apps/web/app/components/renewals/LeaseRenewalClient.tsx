"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button, Input, Label, Modal, Spinner, TextArea } from '@heroui/react';
import { canRequestLeaseRenewal, canTakeRenewalAction, formatPesoDisplay, previousLeaseDurationMonths,
  RENEWAL_DEPOSIT_NOTICE, renewalDefaultStart, renewalStatusLabel, type RenewalPortal } from '@repo/utils';
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

function RenewalContent({tenancyId,portal}:LeaseRenewalClientProps) {
  const renewal=useLeaseRenewal(tenancyId,portal);
  const [reason,setReason]=useState('');
  const [confirm,setConfirm]=useState<'not_renewing'|'decline'|null>(null);
  const [duration,setDuration]=useState('');
  const [file,setFile]=useState<File|null>(null);
  if(renewal.loading) return <div className="p-6" role="status"><Spinner/> Loading renewal…</div>;
  const c=renewal.data;
  if(!c || renewal.error) return <div className="p-6"><p role="alert">{renewal.error??'Renewal unavailable.'}</p><Button onPress={()=>void renewal.refresh()}>Retry</Button></div>;
  const r=c.renewal,p=c.proposals.find((proposal)=>proposal.id===r?.current_proposal_id);
  const allowed=(action:Parameters<typeof canTakeRenewalAction>[2])=>!!r&&canTakeRenewalAction(r.status,portal,action);
  const peer=portal==='tenant'?c.landlordId:c.tenantId;
  const conversation=encodeURIComponent(getContactConversationKey(peer,c.apartmentId));
  const months=duration||String(previousLeaseDurationMonths(c.leaseStart,c.leaseEnd)??'');
  const confirmation=c.agreement&&(portal==='tenant'?c.agreement.tenant_confirmed_at:c.agreement.landlord_confirmed_at);
  return <main className="mx-auto flex w-full max-w-3xl flex-col gap-5 p-4 md:p-6">
    <Link href={portal==='tenant'?'/tenant/my-rental':`/landlord/properties/${c.apartmentId}`} className="text-primary">Back to {portal==='tenant'?'My Rental':'property'}</Link>
    <header><h1 className="font-nunito text-2xl font-bold">Lease renewal</h1><p>{c.apartmentName} · {c.tenantName}</p></header>
    <section className="grid gap-2 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">Current agreed lease</h2><p>{c.leaseStart} – {c.leaseEnd??'No end date recorded'}</p>
      <p>Monthly rent: {formatPesoDisplay(c.monthlyRent??0)}</p>
      <p>Recorded deposit target: {c.depositTarget===null?'Unknown':formatPesoDisplay(c.depositTarget)}</p>
      <p className="text-sm text-muted-foreground">The recorded deposit is not a verified remaining balance. Renewal does not end your current tenancy early.</p>
      {c.originalAgreementPath&&<Button variant="outline" isDisabled={renewal.busy} onPress={()=>void renewal.view(c.originalAgreementPath!,'signed-leases')}>View original agreement</Button>}
      {r&&<StatusChip tone={r.status==='renewed'?'success':r.status==='declined'?'danger':'warning'}>{renewalStatusLabel(r.status,p?.lease_start??null,c.today)}</StatusChip>}
    </section>
    {!r&&portal==='tenant'&&canRequestLeaseRenewal(c.leaseEnd,c.today,c.active)&&<section className="grid gap-3 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">Would you like to renew?</h2>
      <Label>Same duration as the previous lease (months)<Input aria-label="Previous lease duration in months" type="number" min={1} max={120} value={months} onChange={(e)=>setDuration(e.target.value)}/></Label>
      <p>Proposed renewal start: {renewalDefaultStart(c.leaseEnd)}. The landlord will send the end date and charges for your review.</p>
      <Button isDisabled={renewal.busy||!months} onPress={()=>void renewal.act('request',{durationMonths:Number(months)})}>Request Lease Renewal</Button>
      <Button variant="outline" isDisabled={renewal.busy} onPress={()=>setConfirm('not_renewing')}>I Will Not Renew</Button>
      <Link href="/tenant/my-rental" className="text-center text-primary">Decide Later</Link>
    </section>}
    {!r&&!canRequestLeaseRenewal(c.leaseEnd,c.today,c.active)&&<p>Requests open during the final 30 days of an active, dated lease. Missing or expired terms need review.</p>}
    {r&&allowed('approve')&&<Button isDisabled={renewal.busy} onPress={()=>void renewal.act('approve')}>Approve request and prepare payment terms</Button>}
    {r&&allowed('propose')&&<RenewalProposalForm key={r.version} context={c} busy={renewal.busy} onSubmit={(draft,evidence)=>void renewal.propose(draft,evidence)}/>}
    {p&&<section className="grid gap-2 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-nunito text-xl font-bold">Proposal {p.version}</h2>
      <p>{p.lease_start} – {p.lease_end} · {p.duration_months} months</p><p>Monthly rent: {formatPesoDisplay(p.monthly_rent)}</p>
      <p>Advance rent covering {p.advance_period}: {formatPesoDisplay(p.monthly_rent*p.advance_months)}</p>
      <p>Verified applicable credit: −{formatPesoDisplay(p.advance_credit)}</p><p>Advance due: {formatPesoDisplay(p.advance_due)}</p>
      <p>Declared retained deposit: {formatPesoDisplay(p.retained_deposit)}</p><p>Deposit replenishment: {formatPesoDisplay(p.deposit_due)}</p>
      {p.replenishment_reason&&<p>{p.replenishment_reason}</p>}<p className="text-sm text-muted-foreground">{RENEWAL_DEPOSIT_NOTICE}</p>
      {p.evidence_path&&<Button variant="outline" onPress={()=>void renewal.view(p.evidence_path!)} isDisabled={renewal.busy}>View supporting document</Button>}
      <p className="font-bold">Total renewal payment: {formatPesoDisplay(p.advance_due+p.deposit_due)}</p>
      {allowed('accept')&&<Button isDisabled={renewal.busy} onPress={()=>void renewal.act('accept',{proposalId:p.id})}>Accept Renewal Terms</Button>}
      {allowed('discuss')&&<Link className="text-primary" href={`/${portal}/messages?conversation=${conversation}`}>Discuss Charges — message {portal==='tenant'?'landlord':'tenant'}</Link>}
    </section>}
    {r?.status==='awaiting_agreement_confirmation'&&p&&<section className="grid gap-3 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-semibold">Renewal agreement</h2>
      <p>Both parties must confirm the executed agreement matches the proposal above, including deposit treatment and payment conditions.</p>
      {!c.agreement&&portal==='landlord'&&<><Label>Executed renewal agreement<input aria-label="Executed renewal agreement" type="file" accept={SIGNED_LEASE_ACCEPT} disabled={renewal.busy} onChange={(e)=>setFile(e.target.files?.[0]??null)}/></Label><Button isDisabled={!file||renewal.busy} onPress={()=>file&&void renewal.uploadAgreement(file)}>Upload agreement</Button></>}
      {!c.agreement&&portal==='tenant'&&<p>Waiting for the landlord to upload the executed renewal agreement.</p>}
      {c.agreement&&<><Button variant="outline" isDisabled={renewal.busy} onPress={()=>void renewal.view(c.agreement!.path)}>View renewal agreement</Button><Button isDisabled={!!confirmation||renewal.busy} onPress={()=>void renewal.act('confirm_agreement',{proposalId:p.id,path:c.agreement!.path})}>{confirmation?'Your agreement confirmation is saved':'I confirm this agreement matches the proposal'}</Button></>}
    </section>}
    {r&&p&&portal==='tenant'&&['awaiting_payment','payment_verification_pending'].includes(r.status)&&<RenewalPayment key={p.id} context={c} busy={renewal.busy} run={renewal.run}/>}
    {c.payment&&<Link className="text-primary" href={portal==='tenant'?`/tenant/payment/success?referenceId=${encodeURIComponent(c.payment.referenceId??'')}`:`/landlord/payments`}>View payment: {c.payment.status}</Link>}
    {c.proposals.map((history)=><details key={history.id} className="rounded-2xl border border-border p-3"><summary>Saved proposal: {history.lease_start} – {history.lease_end}</summary><p>{formatPesoDisplay(history.monthly_rent)} monthly · Advance due {formatPesoDisplay(history.advance_due)} · Deposit replenishment {formatPesoDisplay(history.deposit_due)}</p>{history.agreement_path&&<Button variant="outline" isDisabled={renewal.busy} onPress={()=>void renewal.view(history.agreement_path!)}>View preserved agreement</Button>}</details>)}
    {r&&allowed('decline')&&<Button variant="outline" isDisabled={renewal.busy} onPress={()=>setConfirm('decline')}>Decline Renewal</Button>}
    {c.events.length>0&&<section className="grid gap-2"><h2 className="font-semibold">Renewal history</h2>{c.events.map((event)=><p key={event.id} className="text-sm">{event.created_at.slice(0,10)} · {event.event.replaceAll('_',' ')}{event.reason?` — ${event.reason}`:''}</p>)}</section>}
    {(renewal.actionError||renewal.revalidationError)&&<p role="alert" className="text-danger">{renewal.actionError||renewal.revalidationError} Refresh to confirm the saved state before repeating an action.</p>}
    <Button variant="outline" isDisabled={renewal.busy} onPress={()=>void renewal.revalidate()}>Refresh renewal</Button>
    <Modal isOpen={confirm!==null} onOpenChange={(open)=>{if(!open&&!renewal.isLocked())setConfirm(null);}}>
      <Modal.Backdrop><Modal.Container><Modal.Dialog><Modal.Header><Modal.Heading>{confirm==='not_renewing'?'Confirm you will not renew':'Decline this renewal?'}</Modal.Heading></Modal.Header><Modal.Body>
        <p>This records your decision and notifies the other party. It does not end the current tenancy.</p>
        {confirm==='decline'&&<Label>Reason<TextArea aria-label="Reason for declining" value={reason} maxLength={1000} onChange={(e)=>setReason(e.target.value)}/></Label>}
        {renewal.actionError&&<p role="alert">{renewal.actionError}</p>}
      </Modal.Body><Modal.Footer><Button variant="outline" isDisabled={renewal.busy} onPress={()=>{if(!renewal.isLocked())setConfirm(null);}}>Cancel</Button><Button isDisabled={renewal.busy||(confirm==='decline'&&!reason.trim())} onPress={()=>{const action=confirm;if(action)void renewal.act(action,{durationMonths:Number(months),reason}).then((saved)=>{if(saved)setConfirm(null);});}}>Confirm decision</Button></Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  </main>;
}
