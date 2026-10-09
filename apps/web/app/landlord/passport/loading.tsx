import { PassportPageHeader, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import { PassportWalletSkeleton } from "@/app/components/passport/PassportSkeleton";

export default function LandlordPassportLoading() {
  return (
    <PassportPageShell>
      <PassportPageHeader />
      <PassportWalletSkeleton showApplicationReadiness={false} />
    </PassportPageShell>
  );
}
