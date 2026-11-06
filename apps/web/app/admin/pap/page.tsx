import PrivacyPolicyPage, { privacyPolicyMetadata } from "@/app/components/legal/PrivacyPolicyPage";
import { requireAdmin } from "@/app/admin/_lib/require-admin";

export const metadata = privacyPolicyMetadata;

export default async function AdminPrivacyPage() {
  await requireAdmin();
  return <PrivacyPolicyPage layout="portal" />;
}
