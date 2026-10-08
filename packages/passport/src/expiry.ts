/** Passport expiry dates are calendar dates, not instants. Use local dates. */
export function toExpiryDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isExpiredDate(expiresAt: string | null, today = new Date()): boolean {
  if (!expiresAt || !/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) return false
  const parsed = new Date(`${expiresAt}T00:00:00`)
  if (Number.isNaN(parsed.getTime()) || toExpiryDateString(parsed) !== expiresAt) return false
  return expiresAt < toExpiryDateString(today)
}

export function validateExpiryDate(date: Date | null, today = new Date()): string | null {
  if (!date) return null
  if (Number.isNaN(date.getTime())) return 'Select a valid expiry date.'
  return isExpiredDate(toExpiryDateString(date), today)
    ? 'Expiry date cannot be in the past.'
    : null
}
