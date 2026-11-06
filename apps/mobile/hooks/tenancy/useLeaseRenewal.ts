import { useCallback,useEffect,useRef,useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { renewalProposalPayload, RENEWAL_REFRESH_INTERVAL_MS, type RenewalPortal, type RenewalProposalDraft } from '@repo/utils';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { usePortalStore } from '@/stores/usePortalStore';
import { signedLeaseOperationGuard } from '@/service/tenancy/signedLeaseService';
import { actOnLeaseRenewal, fetchLeaseRenewal, pickRenewalFile, uploadRenewalFile, viewRenewalFile } from '@/service/tenancy/leaseRenewalService';

export function useLeaseRenewal(tenancyId:string,portal:RenewalPortal) {
  const authId=usePortalStore((s)=>s.authUserId);
  const currentPortal=usePortalStore((s)=>s.portal);
  const [focused,setFocused]=useState(false);
  const query=useQuery({queryKey:['lease-renewal',authId,portal,tenancyId],
    queryFn:()=>fetchLeaseRenewal(tenancyId,portal),enabled:!!authId&&currentPortal===portal&&focused,
    refetchInterval:(current)=>focused&&current.state.data?.renewal&&!['renewed','declined','not_renewing','requires_review'].includes(current.state.data.renewal.status)?RENEWAL_REFRESH_INTERVAL_MS:false});
  const {refetch}=query;
  useFocusEffect(useCallback(()=>{setFocused(true);if(authId&&currentPortal===portal)void refetch();return()=>setFocused(false);},[refetch,authId,currentPortal,portal]));
  const lock=useRef(false);
  const lifetime=useRef({active:true});
  useEffect(()=>{const scope={active:focused};lifetime.current=scope;return()=>{scope.active=false;};},[authId,portal,tenancyId,focused]);
  const guard=()=>{const scope=lifetime.current,identity=signedLeaseOperationGuard(portal);return()=>scope.active&&identity();};
  const mutation=useMutation({mutationFn:async(operation:()=>Promise<unknown>)=>{
    const scope=lifetime.current;
    try {await operation();} finally {if(scope.active)await refetch();}
  }});
  async function run(operation:(isCurrent:()=>boolean)=>Promise<unknown>) {
    if(lock.current||!lifetime.current.active)return false;
    const scope=lifetime.current;
    lock.current=true;
    try {await mutation.mutateAsync(()=>operation(()=>scope.active));return scope.active;}
    catch{return false; /* The mutation exposes its error to the screen. */}
    finally{lock.current=false;}
  }
  const act=(action:string,payload:Record<string,string|number|null>={})=>{
    const isCurrent=guard();
    return run(()=>actOnLeaseRenewal(tenancyId,portal,action,query.data?.renewal?.version??null,payload,isCurrent));
  };
  const propose=(draft:RenewalProposalDraft,asset:DocumentPickerAsset|null)=>{
    const c=query.data;if(!c?.renewal)return;
    const isCurrent=guard(),proposal=Crypto.randomUUID();
    void run(async()=>{
      const payload=renewalProposalPayload(c,draft,proposal,null);
      if(asset)payload.evidencePath=await uploadRenewalFile(c.renewal!.id,proposal,asset,isCurrent);
      await actOnLeaseRenewal(tenancyId,portal,'propose',c.renewal!.version,payload,isCurrent);
    });
  };
  const uploadAgreement=()=>{
    const c=query.data;if(!c?.renewal?.current_proposal_id)return;
    const isCurrent=guard();
    void run(async()=>{
      const asset=await pickRenewalFile();if(!asset||!isCurrent())return;
      const path=await uploadRenewalFile(c.renewal!.id,c.renewal!.current_proposal_id!,asset,isCurrent);
      await actOnLeaseRenewal(tenancyId,portal,'agreement',c.renewal!.version,{path},isCurrent);
    });
  };
  return { ...query,busy:mutation.isPending,actionError:mutation.error instanceof Error?mutation.error.message:null,
    act,propose,uploadAgreement,run,focused,isLocked:()=>lock.current||!lifetime.current.active,
    view:(path:string,bucket?:'signed-leases')=>{
      const isCurrent=guard();void run(()=>viewRenewalFile(path,portal,isCurrent,bucket));
    } };
}
