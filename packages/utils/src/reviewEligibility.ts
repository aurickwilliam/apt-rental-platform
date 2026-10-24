/** Calendar-date feedback only; the database remains authoritative for reviews. */
export function isReviewStayEligible(
  leaseStart: string | null,
  leaseEnd: string | null,
  now: Date = new Date(),
): boolean {
  if (!leaseStart || !Number.isFinite(now.getTime())) return false;
  const start = leaseStart.slice(0, 10);
  const end = leaseEnd?.slice(0, 10);
  const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && Number.isFinite(Date.parse(value))
    && new Date(value).toISOString().slice(0, 10) === value;
  if (!isDate(start)) return false;

  // PostgreSQL subtracts calendar months with month-end clamping. JS setMonth
  // alone would overflow (May 31 minus 3 months could land in March).
  const cutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1));
  const lastDay = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
  cutoff.setUTCDate(Math.min(now.getUTCDate(), lastDay));
  return start <= cutoff.toISOString().slice(0, 10)
    || (!!end && isDate(end) && end <= now.toISOString().slice(0, 10));
}
