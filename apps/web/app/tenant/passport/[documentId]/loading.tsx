import { PassportBackLink, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import { PassportDetailSkeleton } from "@/app/components/passport/PassportSkeleton";

export default function TenantPassportDocumentLoading() {
  return (
    <PassportPageShell>
      <PassportBackLink basePath="/tenant/passport" />
      <PassportDetailSkeleton />
    </PassportPageShell>
  );
}
