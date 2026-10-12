import { PassportPageHeader, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import { PassportWalletSkeleton } from "@/app/components/passport/PassportSkeleton";

export default function TenantPassportLoading() {
  return (
    <PassportPageShell>
      <PassportPageHeader />
      <PassportWalletSkeleton />
    </PassportPageShell>
  );
}
