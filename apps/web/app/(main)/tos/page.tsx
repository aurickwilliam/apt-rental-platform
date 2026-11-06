import TermsPolicyPage, { termsPolicyMetadata } from "@/app/components/legal/TermsPolicyPage";
import { redirectSignedInPolicy } from "@/lib/server-policy-navigation";

export const metadata = termsPolicyMetadata;

export default async function TosPage() {
  await redirectSignedInPolicy("terms");
  return <TermsPolicyPage />;
}
