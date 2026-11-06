"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { renewalProposalPayload, RENEWAL_REFRESH_INTERVAL_MS, type LeaseRenewalContext, type RenewalPortal, type RenewalProposalDraft } from '@repo/utils';
import { actOnLeaseRenewal, fetchLeaseRenewal, openRenewalDocument, uploadRenewalFile } from '@/service/leaseRenewalService';
import { useAsyncResource } from './use-async-resource';

export function useLeaseRenewal(tenancyId: string, portal: RenewalPortal, accountKey:string|null='route') {
  const load=useCallback(()=>accountKey===null?Promise.resolve(null):fetchLeaseRenewal(tenancyId,portal),[tenancyId,portal,accountKey]);
  const resource=useAsyncResource<LeaseRenewalContext|null>(load,null,'Could not load lease renewal.',{clearOnRevalidateError:true});
  const [busy,setBusy]=useState(false);
  const [actionError,setActionError]=useState<string|null>(null);
  const lock=useRef(false);
  const lifetime=useRef({active:true});
  useEffect(()=>{ const scope={active:true}; lifetime.current=scope; return ()=>{scope.active=false;}; },[tenancyId,portal,accountKey]);
  const { revalidate }=resource;
  const status=resource.loading?undefined:resource.data?.renewal?.status;
  useEffect(()=>{
    const refresh=()=>{ if(document.visibilityState==='visible') void revalidate(); };
    window.addEventListener('focus',refresh); document.addEventListener('visibilitychange',refresh);
    return ()=>{window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[revalidate]);
  useEffect(()=>{
    if(!status||['renewed','declined','not_renewing','requires_review'].includes(status)||busy)return;
    const timer=window.setInterval(()=>{if(document.visibilityState==='visible')void revalidate();},RENEWAL_REFRESH_INTERVAL_MS);
    return()=>window.clearInterval(timer);
  },[status,busy,revalidate]);
  async function run(operation:(isCurrent:()=>boolean)=>Promise<unknown>) {
    if(lock.current) return false;
    const scope=lifetime.current;
    lock.current=true;setBusy(true);setActionError(null);
    try { await operation(()=>scope.active); if(scope.active) await resource.revalidate(); return scope.active; }
    catch(error) { if(scope.active) { setActionError(error instanceof Error?error.message:'Could not complete this action. Refresh before trying again.'); await resource.revalidate(); } return false; }
    finally {lock.current=false;if(scope.active)setBusy(false);}
  }
  const act=(action:string,payload:Record<string,string|number|null>={})=>run(()=>actOnLeaseRenewal(tenancyId,portal,action,resource.data?.renewal?.version??null,payload));
  const propose=(draft:RenewalProposalDraft,file:File|null)=>run(async()=>{
    const context=resource.data;if(!context?.renewal) return;
    const scope=lifetime.current,proposal=crypto.randomUUID();
    const payload=renewalProposalPayload(context,draft,proposal,null);
    if(file) payload.evidencePath=await uploadRenewalFile(context.renewal.id,proposal,file);
    if(!scope.active) return;
    await actOnLeaseRenewal(tenancyId,portal,'propose',context.renewal.version,payload);
  });
  const uploadAgreement=(file:File)=>run(async()=>{
    const context=resource.data;if(!context?.renewal?.current_proposal_id) return;
    const scope=lifetime.current;
    const path=await uploadRenewalFile(context.renewal.id,context.renewal.current_proposal_id,file);
    if(scope.active) await actOnLeaseRenewal(tenancyId,portal,'agreement',context.renewal.version,{path});
  });
  return {...resource,busy,actionError,act,propose,uploadAgreement,
    isLocked:()=>lock.current||!lifetime.current.active,
    view:(path:string,bucket?:'signed-leases')=>run((isCurrent)=>openRenewalDocument(path,bucket,isCurrent)),run};
}
