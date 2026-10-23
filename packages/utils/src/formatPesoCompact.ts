const trimTrailingZero = (value: number): string =>
  value.toFixed(1).replace(/\.0$/, "");

/**
 * Short peso label for chart axes and bar tops: 950 -> "₱950",
 * 12500 -> "₱12.5k", 65000 -> "₱65k", 1200000 -> "₱1.2M".
 * Non-finite input reads as "₱0".
 */
export function formatPesoCompact(value: number): string {
  if (!Number.isFinite(value)) return "₱0";

  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const thousands = Math.round(abs / 100) / 10;

  // Compare the rounded figure so 999,950 reads "₱1M", never "₱1000k".
  if (thousands >= 1000) return `${sign}₱${trimTrailingZero(abs / 1_000_000)}M`;
  if (abs >= 1000) return `${sign}₱${trimTrailingZero(abs / 1000)}k`;
  return `${sign}₱${Math.round(abs)}`;
}
