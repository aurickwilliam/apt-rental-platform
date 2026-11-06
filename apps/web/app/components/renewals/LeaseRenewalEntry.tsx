"use client";

import { useCallback,useState,useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button,Modal } from '@heroui/react';
import { canRequestLeaseRenewal,renewalDaysRemaining,renewalReminderMilestone,renewalStatusLabel,type RenewalPortal } from '@repo/utils';
import { useUser } from '@/hooks/use-user';
import { useLeaseRenewal } from '@/hooks/use-lease-renewal';

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
  return <section className="grid gap-2 rounded-2xl border border-border bg-card p-4">
    <h2 className="font-nunito font-bold">Lease renewal</h2><p>{c.renewal?renewalStatusLabel(c.renewal.status,c.proposals.find((p)=>p.id===c.renewal?.current_proposal_id)?.lease_start??null,c.today):`Current lease ends ${c.leaseEnd??'on an unrecorded date'}`}</p>
    <Link href={href} className="text-primary">{eligible?'Review renewal options':'View renewal details'}</Link>
    {portal==='landlord'&&<Link href="/landlord/renewals" className="text-primary">All renewal requests</Link>}
    {renewal.actionError&&<p role="alert">{renewal.actionError}</p>}
    <Modal isOpen={eligible&&dismissedFor!==key&&seen!== 'seen'} onOpenChange={(open)=>{if(!open)close();}}>
      <Modal.Backdrop><Modal.Container><Modal.Dialog><Modal.Header><Modal.Heading>{confirm?'Confirm you will not renew':'Your lease is ending soon'}</Modal.Heading></Modal.Header><Modal.Body>
        <p>{c.apartmentName} · Current lease expires {c.leaseEnd}.</p><p>{confirm?'This notifies the landlord but does not end your current tenancy.':'You can request renewal or return to these options from My Rental.'}</p>
        {renewal.actionError&&<p role="alert">{renewal.actionError}</p>}
      </Modal.Body><Modal.Footer>{confirm?<><Button variant="outline" isDisabled={renewal.busy} onPress={()=>{if(!renewal.isLocked())setConfirm(false);}}>Go back</Button><Button isDisabled={renewal.busy} onPress={()=>void renewal.act('not_renewing').then((saved)=>{if(saved)close();})}>Confirm I will not renew</Button></>:<><Link href={href} onClick={close} className="text-primary">Request Lease Renewal</Link><Button variant="outline" onPress={()=>setConfirm(true)}>I Will Not Renew</Button><Button variant="outline" onPress={close}>Decide Later</Button></>}</Modal.Footer></Modal.Dialog></Modal.Container></Modal.Backdrop>
    </Modal>
  </section>;
}
