// Single source of truth for birth date / age validation, shared by the web
// auth forms and the mobile sign-up / complete-profile screens: instant
// feedback on the client, real enforcement in the web server actions and in
// the database (guard_user_profile_values). Max age 120 (exactly 120 passes),
// rejection order invalid -> future -> too old -> under 18.

export const MINIMUM_AGE = 18;
export const MAXIMUM_AGE = 120;

export function calculateAge(birthDate: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Returns a user-facing error message, or null when the value is valid.
// Accepts a YYYY-MM-DD string (date-only inputs); parsed as local midnight
// to avoid UTC day-shift.
export function validateBirthDate(value: string | null | undefined): string | null {
  if (!value) {
    return "Please enter a valid date of birth";
  }

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return "Please enter a valid date of birth";
  }

  if (startOfDay(parsed) > startOfDay(new Date())) {
    return "Date of birth cannot be in the future";
  }

  const age = calculateAge(parsed);
  if (age > MAXIMUM_AGE) {
    return "Please enter a valid date of birth";
  }
  if (age < MINIMUM_AGE) {
    return "You must be at least 18 years old";
  }

  return null;
}
