export function formatCurrency(value: number): string {
  // Format the number to have two decimal places and commas as thousand separators
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
