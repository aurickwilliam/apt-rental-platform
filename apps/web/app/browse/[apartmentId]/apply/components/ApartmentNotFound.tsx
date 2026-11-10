import { translate } from "@repo/i18n";

import { getServerLocale } from "@/lib/i18n/locale";

export default async function ApartmentNotFound() {
  const language = await getServerLocale();

  return (
    <div className="mx-auto max-w-3xl p-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">{translate(language, "apply.notFound.title")}</h1>
      <p className="mt-2 text-muted-foreground">{translate(language, "apply.notFound.body")}</p>
    </div>
  );
}
