export function getInitials(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'U';
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}