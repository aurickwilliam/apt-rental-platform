import { notFound } from "next/navigation";

import TenantProfileView from "@/app/components/profile/public/TenantProfileView";
import { requirePortalViewer } from "@/lib/server-identity";
import { loadTenantProfile } from "@/lib/public-profile-loaders";

import { browseFrameClass } from "../../../browse/lib/browse-layout";

export default async function LandlordTenantProfilePage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const { supabase, profile } = await requirePortalViewer("landlord");

  // Only tenants who applied to, or rented from, this landlord are viewable.
  const data = await loadTenantProfile(supabase, profile.id, tenantId);
  if (!data) notFound();

  return (
    <div className={browseFrameClass(true)}>
      <TenantProfileView data={data} />
    </div>
  );
}
