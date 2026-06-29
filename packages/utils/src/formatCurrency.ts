export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '₱0';
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
  }).format(value);
}
