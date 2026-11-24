"use client";

import { createClient } from '@repo/supabase/browser';
import { readLeaseRenewalContext, type RenewalPortal } from '@repo/utils';
import { signedLeaseContentType, validateSignedLeaseFile } from '@/lib/signed-lease';

export async function fetchLeaseRenewal(tenancyId: string, portal: RenewalPortal) {
  const { data, error } = await createClient().rpc('get_lease_renewal', { p_tenancy_id: tenancyId, p_portal: portal });
  if (error) throw new Error(error.message);
  return readLeaseRenewalContext(data,tenancyId);
}

export async function actOnLeaseRenewal(tenancyId: string, portal: RenewalPortal, action: string, version: number | null, payload: Record<string,string|number|null> = {}) {
  const { error } = await createClient().rpc('act_on_lease_renewal', {
    p_tenancy_id: tenancyId, p_portal: portal, p_action: action, p_expected_version: version, p_payload: payload,
  });
  if (error) throw new Error(error.message);
}

export async function uploadRenewalFile(renewalId: string, proposalId: string, file: File): Promise<string> {
  const error = validateSignedLeaseFile(file);
  if (error) throw new Error(error);
  const extension = file.name.split('.').pop()!.toLowerCase();
  const path = `${renewalId}/${proposalId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await createClient().storage.from('lease-renewals').upload(path,file,{ contentType: signedLeaseContentType(file)! });
  if (uploadError) throw new Error('Could not upload the renewal document.');
  // Retain uploads after an uncertain save. Referenced history is never deleted.
  return path;
}

export async function openRenewalDocument(path: string, bucket: 'lease-renewals'|'signed-leases' = 'lease-renewals',isCurrent:()=>boolean=()=>true) {
  const popup = window.open('about:blank','_blank');
  if (popup) popup.opener = null;
  try {
    const { data, error } = await createClient().storage.from(bucket).createSignedUrl(path,900);
    if(!isCurrent()){popup?.close();return;}
    if (error || !data?.signedUrl) throw new Error('Could not open this private document.');
    if (popup) popup.location.href=data.signedUrl;
    else throw new Error('Allow pop-ups to view the document, then try again.');
  } catch (error) { popup?.close(); throw error; }
}
