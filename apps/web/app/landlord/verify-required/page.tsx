import { redirect } from "next/navigation";
import { canUseLandlordFeatures } from "@repo/utils";
import { requirePortalViewer } from "@/lib/server-identity";
import LandlordVerificationWall from "../components/LandlordVerificationWall";

export default async function VerifyRequiredPage() {
  const { profile } = await requirePortalViewer("landlord", true);
  if (canUseLandlordFeatures(profile.account_status)) redirect("/landlord/dashboard");
  return <LandlordVerificationWall accountStatus={profile.account_status} />;
}
