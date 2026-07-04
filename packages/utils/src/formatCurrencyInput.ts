/**
 * Strips everything except digits (and an optional single decimal point)
 * from a string. Use this to go from "₱ 15,000.50" -> "15000.50".
 */
export function extractRawNumber(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  const stringValue = typeof value === "number" ? value.toString() : value;
  if (!stringValue) return "";
  // Keep digits and at most one decimal point
  let cleaned = stringValue.replace(/[^0-9.]/g, "");
  // Collapse multiple decimal points into one (keep the first)
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned =
      cleaned.slice(0, firstDot + 1) +
      cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned;
}

/**
 * Formats a raw numeric value into a display string with ₱ prefix and
 * comma thousand separators, e.g. 15000 -> "₱ 15,000".
 *
 * Accepts either a string (e.g. "15000", already-formatted "₱ 15,000")
 * or a plain number (e.g. 15000, 15000.5).
 *
 * Safe to call with "", null, or undefined (returns "") so empty fields
 * don't show "₱ 0".
 */
export function formatPesoDisplay(rawValue: string | number | null | undefined): string {
  if (rawValue === "" || rawValue === null || rawValue === undefined) return "";
  const raw = extractRawNumber(rawValue);
  if (!raw || raw === ".") return "";
  const [integerPart, decimalPart] = raw.split(".");
  // Add comma separators to the integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted =
    decimalPart !== undefined
      ? `${formattedInteger}.${decimalPart}`
      : formattedInteger;
  return `₱ ${formatted}`;
}

/**
 * Use this directly inside onChangeText. It takes whatever the user just
 * typed (raw or already-formatted, doesn't matter) and returns BOTH the
 * raw numeric string (for state) and the formatted display string, so you
 * can decide how to use them.
 *
 * Example:
 *   onChangeText={(text) => {
 *     const { raw } = handlePesoChange(text);
 *     setField("monthlyRent", raw);
 *   }}
 */
export function handlePesoChange(input: string): {
  raw: string;
  formatted: string;
} {
  const raw = extractRawNumber(input);
  const formatted = formatPesoDisplay(raw);
  return { raw, formatted };
}
