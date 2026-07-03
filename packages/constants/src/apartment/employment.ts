export const EMPLOYMENT_TYPES = [
  'Full-Time',
  'Part-Time',
  'Self-Employed',
  'Unemployed',
  'Student',
] as const

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number]

/** Employment types that do not require proof of income or a company name. */
export const NO_INCOME_EMPLOYMENT_TYPES: EmploymentType[] = [
  'Unemployed',
  'Student',
]

/** Employment types that require an occupation/job title. */
export const REQUIRES_OCCUPATION_TYPES: EmploymentType[] = [
  'Full-Time',
  'Part-Time',
  'Self-Employed',
]

/** Employment types that require a company/employer name. */
export const REQUIRES_COMPANY_NAME_TYPES: EmploymentType[] = [
  'Full-Time',
  'Part-Time',
]

// ---------------------------------------------------------------------------
// Derived helpers — use these instead of inline .includes() checks
// ---------------------------------------------------------------------------

export function requiresProofOfIncome(employmentType: string): boolean {
  return !NO_INCOME_EMPLOYMENT_TYPES.includes(employmentType as EmploymentType)
}

export function requiresOccupation(employmentType: string): boolean {
  return REQUIRES_OCCUPATION_TYPES.includes(employmentType as EmploymentType)
}

export function requiresCompanyName(employmentType: string): boolean {
  return REQUIRES_COMPANY_NAME_TYPES.includes(employmentType as EmploymentType)
}
