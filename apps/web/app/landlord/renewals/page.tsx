import Link from 'next/link';
import { requirePortalViewer } from '@/lib/server-identity';
import EmptyState from '@/app/components/display/EmptyState';
import { IconFileText } from '@tabler/icons-react';
import { RENEWAL_STATUS_LABELS,type RenewalStatus } from '@repo/utils';

interface RenewalListItem {id:string;tenancy_id:string;status:RenewalStatus;updated_at:string;apartment_name:string;tenant_name:string}

export default async function RenewalRequestsPage({searchParams}:{searchParams:Promise<{before?:string;id?:string}>}) {
  const {supabase}=await requirePortalViewer('landlord');
  const search=await searchParams;
  const before=search.before&&Number.isFinite(Date.parse(search.before))?search.before:null;
  const id=search.id&&/^[a-f0-9-]{36}$/i.test(search.id)?search.id:null;
  const {data,error}=await supabase.rpc('list_lease_renewals',{p_before:before&&id?before:null,p_before_id:before&&id?id:null});
  if(error) return <main className="p-6"><h1 className="text-2xl font-bold">Lease renewals</h1><p role="alert">Could not load renewal requests. Reopen this page to retry.</p></main>;
  const items=(data??[]) as unknown as RenewalListItem[];
  const shown=items.slice(0,25),last=shown.at(-1);
  return <main className="mx-auto grid max-w-4xl gap-4 p-6"><h1 className="font-nunito text-2xl font-bold">Lease renewals</h1>
    {shown.length===0?<EmptyState icon={IconFileText} title="No renewal requests" description="Requests from existing tenants will appear here. Lease reminders also open the relevant property."/>:shown.map((item)=><Link key={item.id} href={`/landlord/renewals/${item.tenancy_id}`} className="grid gap-1 rounded-2xl border border-border bg-card p-4"><strong>{item.apartment_name}</strong><span>{item.tenant_name}</span><span>{RENEWAL_STATUS_LABELS[item.status]}</span></Link>)}
    {items.length>25&&last&&<Link className="text-primary" href={`/landlord/renewals?before=${encodeURIComponent(last.updated_at)}&id=${last.id}`}>Next page</Link>}
  </main>;
}
