import { PassportBackLink, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

export default function TenantPassportDocumentLoading() {
  return (
    <PassportPageShell>
      <PassportBackLink basePath="/tenant/passport" />
      <RouteLoadingStatus>Loading document…</RouteLoadingStatus>
    </PassportPageShell>
  );
}
