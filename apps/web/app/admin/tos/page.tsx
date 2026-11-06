import TermsPolicyPage, { termsPolicyMetadata } from "@/app/components/legal/TermsPolicyPage";
import { requireAdmin } from "@/app/admin/_lib/require-admin";

export const metadata = termsPolicyMetadata;

export default async function AdminTermsPage() {
  await requireAdmin();
  return <TermsPolicyPage />;
}
