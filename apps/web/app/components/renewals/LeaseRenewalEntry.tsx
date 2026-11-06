"use client";

import { useCallback,useState,useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button,Modal } from '@heroui/react';
import { IconFileText } from "@tabler/icons-react";
import { canRequestLeaseRenewal,renewalDaysRemaining,renewalReminderMilestone,renewalStatusLabel,type RenewalPortal } from '@repo/utils';
import { useUser } from '@/hooks/use-user';
import { useLeaseRenewal } from '@/hooks/use-lease-renewal';
import StatusChip from '@/app/components/display/StatusChip';

const EVENT='apt-renewal-prompt-change';
const subscribe=(listener:()=>void)=>{window.addEventListener('storage',listener);window.addEventListener(EVENT,listener);return()=>{window.removeEventListener('storage',listener);window.removeEventListener(EVENT,listener);};};

export default function LeaseRenewalEntry({tenancyId,portal}:{tenancyId:string;portal:RenewalPortal}) {
  const {user}=useUser();
  const renewal=useLeaseRenewal(tenancyId,portal,user?.id??null),c=renewal.loading?null:renewal.data;
  const [dismissedFor,setDismissedFor]=useState<string|null>(null),[confirm,setConfirm]=useState(false);
  const milestone=c?renewalReminderMilestone(renewalDaysRemaining(c.leaseEnd,c.today)??-1):null;
  const key=`apt-renewal-prompt:v1:${user?.id??'none'}:${tenancyId}:${c?.leaseEnd??'none'}:${milestone}`;
  const seen=useSyncExternalStore(subscribe,useCallback(()=>{try{return localStorage.getItem(key)??'';}catch{return'';}},[key]),()=> 'seen');
  const close=()=>{if(renewal.isLocked())return;setDismissedFor(key);setConfirm(false);try{localStorage.setItem(key,'seen');window.dispatchEvent(new Event(EVENT));}catch{/* Device-only dismissal still lasts for this mount. */}};
  if(!c)return renewal.error?<section className="rounded-2xl border border-border p-4"><p>Lease renewal details could not load.</p><Button variant="outline" onPress={()=>void renewal.refresh()}>Retry renewal details</Button></section>:null;
  const href=`/${portal}/renewals/${tenancyId}`;
  const eligible=portal==='tenant'&&!c.renewal&&canRequestLeaseRenewal(c.leaseEnd,c.today,c.active);
  const statusLabel=c.renewal?renewalStatusLabel(c.renewal.status,c.proposals.find((p)=>p.id===c.renewal?.current_proposal_id)?.lease_start??null,c.today):(canRequestLeaseRenewal(c.leaseEnd,c.today,c.active)?'Ending soon':'No renewal yet');
  const statusTone=c.renewal?(c.renewal.status==='renewed'?'success':c.renewal.status==='declined'?'danger':'warning'):(canRequestLeaseRenewal(c.leaseEnd,c.today,c.active)?'warning':'neutral');
  const promptModal = (
    <Modal isOpen={eligible&&dismissedFor!==key&&seen!== 'seen'} onOpenChange={(open)=>{if(!open)close();}}>
      <Modal.Backdrop><Modal.Container><Modal.Dialog><Modal.Header><Modal.Heading>{confirm?'Confirm you will not renew':'Your lease is ending soon'}</Modal.Heading></Modal.Header><Modal.Body>
        <p className="text-sm text-foreground">{c.apartmentName} · Current lease expires {c.leaseEnd}.</p>
        <p className="text-sm text-foreground">{confirm?'This notifies the landlord but does not end your current tenancy.':'You can request renewal or return to these options from My Rental.'}</p>
        {renewal.actionError&&<p role="alert" className="text-sm text-danger">{renewal.actionError}</p>}
      </Modal.Body><Modal.Footer>{confirm?<><Button variant="outline" isDisabled={renewal.busy} onPress={()=>{if(!renewal.isLocked())setConfirm(false);}}>Go back</Button><Button isDisabled={renewal.busy} onPress={()=>void renewal.act('not_renewing').then((saved)=>{if(saved)close();})}>Confirm I will not renew</Button></>:<><Link href={href} onClick={close} className="text-primary">Request Lease Renewal</Link><Button variant="outline" onPress={()=>setConfirm(true)}>I Will Not Renew</Button><Button variant="outline" onPress={close}>Decide Later</Button></>}</Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  );
  if (portal === "landlord") {
    return <div className="flex flex-col gap-2 rounded-2xl border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-nunito font-semibold text-muted-foreground uppercase tracking-wide">Lease Renewal</p>
        <StatusChip size="sm" tone={statusTone}>{statusLabel}</StatusChip>
      </div>
      <p className="text-xs text-muted-foreground">Current lease ends {c.leaseEnd??"on an unrecorded date"}.</p>
      <div className="grid grid-cols-2 gap-2">
        <Link href={href} className="no-underline"><Button size="sm" variant="secondary" className="w-full justify-center font-nunito"><IconFileText size={14} /> View renewal details</Button></Link>
        <Link href="/landlord/renewals" className="no-underline"><Button size="sm" variant="outline" className="w-full justify-center font-nunito"><IconFileText size={14} /> All renewal requests</Button></Link>
      </div>
      {renewal.actionError&&<p role="alert" className="text-xs text-danger">{renewal.actionError}</p>}
      {promptModal}
    </div>;
  }
  return <section className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><IconFileText size={22} aria-hidden /></div>
        <div>
          <h2 className="font-nunito text-lg font-bold">Lease renewal</h2>
          <p className="text-sm text-muted-foreground">{c.renewal?statusLabel:`Current lease ends ${c.leaseEnd??'on an unrecorded date'}`}</p>
        </div>
      </div>
      <StatusChip tone={statusTone}>{statusLabel}</StatusChip>
    </div>
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
      <Link href={href} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted/50"><IconFileText size={14} aria-hidden /> {eligible?'Review renewal options':'View renewal details'}</Link>
    </div>
    {renewal.actionError&&<p role="alert" className="mt-2 text-sm text-danger">{renewal.actionError}</p>}
    {promptModal}
  </section>;
}
