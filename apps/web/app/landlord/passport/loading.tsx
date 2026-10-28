import { PassportPageHeader, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

export default function LandlordPassportLoading() {
  return (
    <PassportPageShell>
      <PassportPageHeader portal="landlord" />
      <RouteLoadingStatus>Loading documents…</RouteLoadingStatus>
    </PassportPageShell>
  );
}
