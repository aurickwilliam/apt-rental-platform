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
