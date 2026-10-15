import { formatPesoDisplay } from "@repo/utils";

export interface ApartmentShareInput {
  id: string;
  name?: string | null;
  city?: string | null;
  monthly_rent?: number | null;
}

/**
 * Builds the text shared from the apartment page. The link is included only
 * when a public web URL is configured (`EXPO_PUBLIC_WEB_URL`), because the
 * app's own `mobile://` scheme can't be opened by people without the app.
 */
export function buildApartmentShareMessage(
  apartment: ApartmentShareInput,
  webBaseUrl?: string | null,
): string {
  const title = apartment.name?.trim() || "an apartment";
  const details = [
    apartment.city?.trim(),
    apartment.monthly_rent != null
      ? `${formatPesoDisplay(apartment.monthly_rent)}/month`
      : null,
  ].filter(Boolean);

  const lines = [
    `Check out ${title} on APT${details.length ? ` — ${details.join(" · ")}` : ""}`,
  ];

  const base = webBaseUrl?.trim().replace(/\/+$/, "");
  if (base) lines.push(`${base}/browse/${apartment.id}`);

  return lines.join("\n");
}
