import { requirePortalViewer } from "@/lib/server-identity";
import { loadPresentationSeed } from "@/lib/presentation-seed-server";
import { applicantPersonalInfo } from "@/lib/application-profile";
import { fetchTenantApplications, type TenantApplication } from "@/service/tenantApplicationsService";
import { fetchVisitRequest } from "@/service/visitRequestsService";
import ApplicationDetailClient from "./ApplicationDetailClient";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { supabase, user, profile } = await requirePortalViewer("tenant");
  const { applicationId } = await params;
  const [application, visits] = await Promise.all([
    loadPresentationSeed(user.id, profile.id,
      () => fetchTenantApplications(profile.id, { applicationId, includeDocuments: false }, supabase),
      [] as TenantApplication[], "Failed to load applications.", applicationId),
    loadPresentationSeed(user.id, profile.id, () => fetchVisitRequest(applicationId, profile.id, supabase),
      { current: null, history: [] }, "Failed to load visit request.", applicationId),
  ]);
  const personalInfo = { ...application, data: applicantPersonalInfo(profile, user.email ?? null), error: null };
  return <ApplicationDetailClient key={`${user.id}:${applicationId}`} initial={{ ...application, data: { application, visits, personalInfo } }} />;
}
