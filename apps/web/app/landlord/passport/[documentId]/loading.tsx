import { PassportBackLink, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

export default function LandlordPassportDocumentLoading() {
  return (
    <PassportPageShell>
      <PassportBackLink basePath="/landlord/passport" />
      <RouteLoadingStatus>Loading document…</RouteLoadingStatus>
    </PassportPageShell>
  );
}
