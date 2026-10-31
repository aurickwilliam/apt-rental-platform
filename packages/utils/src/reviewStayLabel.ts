/** "Stayed at Mabini Residences · Jan 2024 - Mar 2025" from whichever facts are known; undefined when neither is. */
export function formatReviewStayLabel(
  apartmentName: string | null | undefined,
  stayPeriod: string | null | undefined,
): string | undefined {
  const parts: string[] = [];
  if (apartmentName) parts.push(`Stayed at ${apartmentName}`);
  if (stayPeriod) parts.push(stayPeriod);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

const STAY_MONTH_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Manila',
});

/** "Jan 2024 - Mar 2025" for a finished stay; "Present" while it has no end date. Mirrored by the web's `formatStayRange`. */
export function formatStayRange(leaseStart: string | null, leaseEnd: string | null): string {
  const format = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : STAY_MONTH_FORMAT.format(date);
  };
  const start = leaseStart ? format(leaseStart) : null;
  if (!start) return 'Dates not available';
  const end = leaseEnd ? format(leaseEnd) : null;
  return `${start} - ${end ?? 'Present'}`;
}
