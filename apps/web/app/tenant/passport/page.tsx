import PassportClient from "@/app/components/passport/PassportClient";
import { requirePassportViewer } from "@/app/components/passport/requirePassportViewer";

export default async function TenantPassportPage() {
  const { userId } = await requirePassportViewer("tenant");
  return <PassportClient userId={userId} basePath="/tenant/passport" />;
}
