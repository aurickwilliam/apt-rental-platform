import { Suspense } from "react";

import { translate } from "@repo/i18n";
import { getServerLocale } from "@/lib/i18n/locale";

import { RateApartmentForm } from "../components/RateApartmentForm";

export default async function RateApartmentPage() {
  const language = await getServerLocale();

  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl p-4 text-sm">{translate(language, "common.loading")}</div>}>
      <RateApartmentForm />
    </Suspense>
  );
}
