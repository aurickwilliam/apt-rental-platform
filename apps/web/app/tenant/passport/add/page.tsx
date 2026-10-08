import AddPassportDocument from "@/app/components/passport/AddPassportDocument";
import { requirePassportViewer } from "@/app/components/passport/requirePassportViewer";

export default async function TenantAddPassportDocumentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string | string[] }>;
}) {
  const { userId } = await requirePassportViewer("tenant");
  const { type } = await searchParams;
  const docType = (Array.isArray(type) ? type[0] : type)?.trim() || null;

  return <AddPassportDocument userId={userId} basePath="/tenant/passport" docType={docType} />;
}
