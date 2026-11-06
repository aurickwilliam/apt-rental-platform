import PrivacyPolicyPage, { privacyPolicyMetadata } from "@/app/components/legal/PrivacyPolicyPage";
import { requirePortalViewer } from "@/lib/server-identity";

export const metadata = privacyPolicyMetadata;

export default async function TenantPrivacyPage() {
  await requirePortalViewer("tenant");
  return <PrivacyPolicyPage />;
}
