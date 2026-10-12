import PassportClient from "@/app/components/passport/PassportClient";
import { requirePassportViewer } from "@/app/components/passport/requirePassportViewer";

export default async function LandlordPassportPage() {
  const { userId } = await requirePassportViewer("landlord");
  return <PassportClient userId={userId} basePath="/landlord/passport" showApplicationReadiness={false} />;
}
