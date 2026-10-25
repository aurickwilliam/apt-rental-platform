// Registration policy shared by the apps and web server actions. Bounds are
// inclusive calendar anniversaries in Manila, not a rounded-down age in years.
// The database has its own historical guard; changes here do not migrate it.

export const MINIMUM_AGE = 18;
export const MAXIMUM_AGE = 110;
export const BIRTH_DATE_TIME_ZONE = "Asia/Manila";
export const BIRTH_DATE_ERRORS = {
  required: "Birth date is required.",
  invalid: "Please enter a valid birth date.",
  future: "Birth date cannot be in the future.",
  underage: "You must be at least 18 years old.",
} as const;

const manilaDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BIRTH_DATE_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
});

export function getManilaDate(now: Date = new Date()): string {
  const parts = manilaDateFormatter.formatToParts(now);
  const part = (type: string) => parts.find(value => value.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/** Feb 29 anniversaries clamp to Feb 28 when the target year is not leap. */
export function getBirthDateRange(today: string = getManilaDate()): { earliest: string; latest: string } {
  const [year, month, day] = today.split("-").map(Number);
  const anniversary = (years: number) => `${year - years}-${String(month).padStart(2, "0")}-${String(Math.min(day, daysInMonth(year - years, month))).padStart(2, "0")}`;
  return { earliest: anniversary(MAXIMUM_AGE), latest: anniversary(MINIMUM_AGE) };
}

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

// Date <-> the YYYY-MM-DD string the form stores, both in local time. A date
// picker's value carries the current time of day, so `toISOString()` (UTC)
// would save the previous day for anyone ahead of UTC before 8 AM in Manila.
export function toBirthDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromBirthDateValue(value: string | null | undefined): Date | null {
  if (!value || !isCalendarDate(value)) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

// Compare strict Gregorian date-only values: no local/UTC parsing or rollover.
export function validateBirthDate(value: string | null | undefined, now: Date = new Date()): string | null {
  if (!value) {
    return BIRTH_DATE_ERRORS.required;
  }
  if (typeof value !== "string" || !isCalendarDate(value)) {
    return BIRTH_DATE_ERRORS.invalid;
  }
  const today = getManilaDate(now);
  const { earliest, latest } = getBirthDateRange(today);
  if (value > today) {
    return BIRTH_DATE_ERRORS.future;
  }
  if (value < earliest) {
    return BIRTH_DATE_ERRORS.invalid;
  }
  if (value > latest) {
    return BIRTH_DATE_ERRORS.underage;
  }
  return null;
}

// Only known trigger exceptions are field errors. Do not classify arbitrary
// transport/permission/database failures from message fragments.
export function getBirthDateDatabaseError(error: { code?: string; message?: string }): string | null {
  if (error.code !== "P0001") return null;
  switch (error.message) {
    case "Date of birth cannot be in the future.": return BIRTH_DATE_ERRORS.future;
    case "You must be at least 18 years old.": return BIRTH_DATE_ERRORS.underage;
    case "Please enter a valid date of birth.": return BIRTH_DATE_ERRORS.invalid;
    default: return null;
  }
}
