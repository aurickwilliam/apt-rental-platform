import { formatPesoDisplay } from './formatCurrencyInput';

export interface ApartmentShareInput {
  id: string;
  name?: string | null;
  city?: string | null;
  monthly_rent?: number | null;
}

/** Public listing path shared by web and mobile (`/browse/<apartmentId>`). */
export function getApartmentSharePath(apartmentId: string): string {
  return `/browse/${apartmentId}`;
}

/** One-line share headline, without a link. */
export function buildApartmentShareText(apartment: ApartmentShareInput): string {
  const title = apartment.name?.trim() || 'an apartment';
  const details = [
    apartment.city?.trim(),
    apartment.monthly_rent != null
      ? `${formatPesoDisplay(apartment.monthly_rent)}/month`
      : null,
  ].filter(Boolean);

  return `Check out ${title} on APT${details.length ? ` — ${details.join(' · ')}` : ''}`;
}

// A loop, not /\/+$/: that regex backtracks quadratically on long runs of "/".
function trimTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === '/') end -= 1;
  return value.slice(0, end);
}

/** Headline plus the public link, when a web origin is known. */
export function buildApartmentShareMessage(
  apartment: ApartmentShareInput,
  webBaseUrl: string | null | undefined,
): string {
  const lines = [buildApartmentShareText(apartment)];
  const base = trimTrailingSlashes(webBaseUrl?.trim() ?? '');
  if (base) lines.push(`${base}${getApartmentSharePath(apartment.id)}`);
  return lines.join('\n');
}
