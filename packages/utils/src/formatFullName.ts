interface NameInput {
  first_name?: string | null;
  last_name?: string | null;
}

export function formatFullName(name: NameInput): string {
  return `${name.first_name ?? ""} ${name.last_name ?? ""}`.trim();
}