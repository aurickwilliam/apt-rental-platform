import {
  buildApartmentShareMessage as buildShareMessage,
  type ApartmentShareInput,
} from "@repo/utils";

export type { ApartmentShareInput };

/** Public web address of the site (`EXPO_PUBLIC_WEB_URL`), if configured. */
export function getShareWebBaseUrl(): string | undefined {
  return process.env.EXPO_PUBLIC_WEB_URL;
}

/**
 * Builds the text shared from the apartment page. The link is included only
 * when a public web URL is configured (`EXPO_PUBLIC_WEB_URL`), because the
 * app's own `mobile://` scheme can't be opened by people without the app.
 */
export function buildApartmentShareMessage(
  apartment: ApartmentShareInput,
  webBaseUrl: string | null | undefined = getShareWebBaseUrl(),
): string {
  return buildShareMessage(apartment, webBaseUrl);
}
