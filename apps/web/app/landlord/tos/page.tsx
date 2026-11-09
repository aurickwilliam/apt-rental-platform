import TermsPolicyPage, { termsPolicyMetadata } from "@/app/components/legal/TermsPolicyPage";
import { requirePortalViewer } from "@/lib/server-identity";

export const metadata = termsPolicyMetadata;

export default async function LandlordTermsPage() {
  await requirePortalViewer("landlord", true);
  return <TermsPolicyPage layout="portal" />;
}
