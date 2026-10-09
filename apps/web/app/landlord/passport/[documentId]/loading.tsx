import { PassportBackLink, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import { PassportDetailSkeleton } from "@/app/components/passport/PassportSkeleton";

export default function LandlordPassportDocumentLoading() {
  return (
    <PassportPageShell>
      <PassportBackLink basePath="/landlord/passport" />
      <PassportDetailSkeleton />
    </PassportPageShell>
  );
}
