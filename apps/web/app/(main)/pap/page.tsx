import PrivacyPolicyPage, { privacyPolicyMetadata } from "@/app/components/legal/PrivacyPolicyPage";
import { redirectSignedInPolicy } from "@/lib/server-policy-navigation";

export const metadata = privacyPolicyMetadata;

export default async function PapPage() {
  await redirectSignedInPolicy("privacy");
  return <PrivacyPolicyPage />;
}
