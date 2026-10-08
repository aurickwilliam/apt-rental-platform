import { redirect } from "next/navigation";

// Adding a document is a modal on the wallet; keep old and shared links working.
export default async function TenantAddPassportDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { type } = await searchParams;
  const docType = (Array.isArray(type) ? type[0] : type)?.trim();
  redirect(`/tenant/passport?add=${docType ? encodeURIComponent(docType) : "1"}`);
}
