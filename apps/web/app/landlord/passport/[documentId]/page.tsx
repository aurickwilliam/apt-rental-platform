import PassportDocumentDetailClient from "@/app/components/passport/PassportDocumentDetailClient";
import { requirePassportViewer } from "@/app/components/passport/requirePassportViewer";

export default async function LandlordPassportDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const { userId } = await requirePassportViewer("landlord");
  const { documentId } = await params;

  return <PassportDocumentDetailClient userId={userId} basePath="/landlord/passport" documentId={documentId} />;
}
