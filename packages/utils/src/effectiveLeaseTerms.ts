export interface EffectiveLeaseTerms {
  leaseEnd: string | null;
  monthlyRent: number | null;
  renewalAgreementPath: string | null;
}

interface EffectiveLeaseTermsClient {
  rpc(name: 'get_effective_lease_terms', args: {p_tenancy_id:string}): PromiseLike<{
    data: unknown;
    error: {code?:string;message:string}|null;
  }>;
}

/** Narrow predeployment compatibility only: an absent renewal RPC means no
 * renewal schema exists yet. Other failures never become old, stale terms. */
export async function fetchEffectiveLeaseTermsWith(client:EffectiveLeaseTermsClient,tenancyId:string):Promise<EffectiveLeaseTerms|null> {
  const {data,error}=await client.rpc('get_effective_lease_terms',{p_tenancy_id:tenancyId});
  if(error?.code==='PGRST202')return null;
  if(error)throw new Error(error.message);
  if(!data||typeof data!=='object'||!('leaseEnd' in data)||!('monthlyRent' in data))throw new Error('Could not verify the current agreed lease terms.');
  return data as EffectiveLeaseTerms;
}
