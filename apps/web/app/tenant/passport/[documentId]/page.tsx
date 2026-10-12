import PassportDocumentDetailClient from "@/app/components/passport/PassportDocumentDetailClient";
import { requirePassportViewer } from "@/app/components/passport/requirePassportViewer";

export default async function TenantPassportDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { userId } = await requirePassportViewer("tenant");
  const { documentId } = await params;

  return <PassportDocumentDetailClient userId={userId} basePath="/tenant/passport" documentId={documentId} />;
}
