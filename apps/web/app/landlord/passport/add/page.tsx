import { redirect } from "next/navigation";

// Adding a document is a modal on the wallet; keep old and shared links working.
export default async function LandlordAddPassportDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { type } = await searchParams;
  const docType = (Array.isArray(type) ? type[0] : type)?.trim();
  redirect(`/landlord/passport?add=${docType ? encodeURIComponent(docType) : "1"}`);
}
