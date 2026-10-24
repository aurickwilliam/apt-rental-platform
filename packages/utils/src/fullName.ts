// Lowercase words that belong to the surname that follows them, so
// "Juan de la Cruz" splits into "Juan" / "de la Cruz" rather than "Juan de la" / "Cruz".
const SURNAME_PARTICLES = new Set([
  "da",
  "de",
  "del",
  "dela",
  "delos",
  "di",
  "la",
  "los",
  "san",
  "santa",
  "van",
  "von",
]);

// Splits a single display name (an OAuth provider's `full_name`) into the two
// profile fields. The last word is the surname, with any particles directly in
// front of it; everything before is the given name, so "Mary Grace Reyes" keeps
// both given names. It is only a starting point: the user edits both fields.
export function splitFullName(fullName: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  const words = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return { firstName: words[0] ?? "", lastName: "" };

  let surnameStart = words.length - 1;
  while (surnameStart > 1 && SURNAME_PARTICLES.has(words[surnameStart - 1].toLowerCase())) {
    surnameStart -= 1;
  }

  return {
    firstName: words.slice(0, surnameStart).join(" "),
    lastName: words.slice(surnameStart).join(" "),
  };
}

interface FullNameParts {
  firstName: string;
  lastName: string;
  suffix?: string | null;
}

// The display name written to Auth `full_name`; blank parts are skipped, so no
// trailing space when there is no suffix.
export function joinFullName({ firstName, lastName, suffix }: FullNameParts): string {
  return [firstName, lastName, suffix]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}
