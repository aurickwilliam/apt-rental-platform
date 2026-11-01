import { PassportBackLink, PassportPageShell } from "@/app/components/passport/PassportPageLayout";
import RouteLoadingStatus from "@/app/components/display/RouteLoadingStatus";

import { translate } from "@repo/i18n";

import { getServerLocale } from "@/lib/i18n/locale";

export default async function LandlordPassportDocumentLoading() {
  const language = await getServerLocale();

  return (
    <PassportPageShell>
      <PassportBackLink basePath="/landlord/passport" />
      <RouteLoadingStatus>{translate(language, "passport.loadingDocument")}</RouteLoadingStatus>
    </PassportPageShell>
  );
}
