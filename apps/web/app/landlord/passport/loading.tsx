import { PassportPageHeader, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

import { translate } from "@repo/i18n";

import { getServerLocale } from "@/lib/i18n/locale";

export default async function LandlordPassportLoading() {
  const language = await getServerLocale();

  return (
    <PassportPageShell>
      <PassportPageHeader portal="landlord" />
      <RouteLoadingStatus>{translate(language, "passport.loadingDocuments")}</RouteLoadingStatus>
    </PassportPageShell>
  );
}
