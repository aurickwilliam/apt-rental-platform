import { supabase } from '@repo/supabase';
import { readLeaseRenewalContext, type RenewalPortal, type RenewalStatus } from '@repo/utils';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { usePortalStore } from '@/stores/usePortalStore';
import { signedLeaseContentType, validateSignedLeaseFile, SIGNED_LEASE_TYPES } from '@/utils/signedLease';
import { resolvePrivateMediaUrls } from '@/service/media/privateMediaResolver';

interface RenewalListItem {id:string;tenancy_id:string;status:RenewalStatus;updated_at:string;apartment_name:string;tenant_name:string}

export async function fetchRenewalRequests(cursor:{before:string;id:string}|null) {
  const {data,error}=await supabase.rpc('list_lease_renewals',{p_before:cursor?.before??null,p_before_id:cursor?.id??null});
  if(error)throw new Error(error.message);
  return (data??[]) as unknown as RenewalListItem[];
}

async function assertScope(isCurrent:()=>boolean,portal:RenewalPortal) {
  const { data,error }=await supabase.auth.getSession();
  const state=usePortalStore.getState();
  if(error||!isCurrent()||state.portal!==portal||data.session?.user.id!==state.authUserId) throw new Error('Your session changed. Reopen the rental or property.');
}

export async function fetchLeaseRenewal(tenancyId:string,portal:RenewalPortal) {
  const {data,error}=await supabase.rpc('get_lease_renewal',{p_tenancy_id:tenancyId,p_portal:portal});
  if(error) throw new Error(error.message);
  return readLeaseRenewalContext(data,tenancyId);
}

export async function actOnLeaseRenewal(tenancyId:string,portal:RenewalPortal,action:string,version:number|null,payload:Record<string,string|number|null>,isCurrent:()=>boolean) {
  await assertScope(isCurrent,portal);
  const {error}=await supabase.rpc('act_on_lease_renewal',{p_tenancy_id:tenancyId,p_portal:portal,p_action:action,p_expected_version:version,p_payload:payload});
  if(error) throw new Error(error.message);
}

export async function pickRenewalFile() {
  const result=await DocumentPicker.getDocumentAsync({type:SIGNED_LEASE_TYPES,multiple:false,copyToCacheDirectory:true});
  if(result.canceled) return null;
  const asset=result.assets[0],file=new File(asset.uri);
  const validation=validateSignedLeaseFile({name:asset.name,type:asset.mimeType??'',size:file.size});
  if(validation) throw new Error(validation);
  return asset;
}

export async function uploadRenewalFile(renewalId:string,proposalId:string,asset:DocumentPicker.DocumentPickerAsset,isCurrent:()=>boolean) {
  await assertScope(isCurrent,'landlord');
  const file=new File(asset.uri),candidate={name:asset.name,type:asset.mimeType??'',size:file.size};
  const validation=validateSignedLeaseFile(candidate);if(validation)throw new Error(validation);
  const bytes=await file.arrayBuffer();
  await assertScope(isCurrent,'landlord');
  const path=`${renewalId}/${proposalId}/${Crypto.randomUUID()}.${asset.name.split('.').pop()!.toLowerCase()}`;
  const {error}=await supabase.storage.from('lease-renewals').upload(path,bytes,{contentType:signedLeaseContentType(candidate)!});
  if(error)throw new Error('Could not upload the renewal document.');
  return path; // Never delete historical or uncertain uploads.
}

export async function viewRenewalFile(path:string,portal:RenewalPortal,isCurrent:()=>boolean,bucket:'lease-renewals'|'signed-leases'='lease-renewals') {
  await assertScope(isCurrent,portal);
  const result=await resolvePrivateMediaUrls(bucket,[path]);
  await assertScope(isCurrent,portal);
  const url=result.urls[path];if(!url)throw new Error(result.error??'Could not open the document.');
  await WebBrowser.openBrowserAsync(url);
}
