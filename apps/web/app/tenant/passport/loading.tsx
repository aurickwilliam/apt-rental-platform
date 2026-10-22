import { PassportPageHeader, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

export default function TenantPassportLoading() {
  return (
    <PassportPageShell>
      <PassportPageHeader />
      <RouteLoadingStatus>Loading documents…</RouteLoadingStatus>
    </PassportPageShell>
  );
}
