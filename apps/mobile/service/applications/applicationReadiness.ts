import type { ApplicationDocumentSlot } from '@repo/constants'

import {
  selectPassportDocsForApplication,
  type PassportApplicationSelection,
  type PassportDocumentRow,
} from '@/service/passport/passportService'

export type ApplicationIssueCode =
  | 'unverified'
  | 'own-listing'
  | 'already-applied'
  | 'passport-missing'
  | 'passport-expired'

export interface ApplicationIssue {
  code: ApplicationIssueCode
  message: string
  slots?: ApplicationDocumentSlot[]
}

export const APPLICATION_SLOT_LABELS: Record<ApplicationDocumentSlot, string> = {
  govId: 'Government ID',
  proofOfIncome: 'Proof of Income',
  proofOfBilling: 'Proof of Billing',
  nbiClearance: 'NBI Clearance',
}

export interface ApplicationReadinessInput {
  accountStatus: string | null | undefined
  tenantId: string | null | undefined
  landlordId: string | null | undefined
  hasActiveApplication: boolean
  passportDocs: readonly PassportDocumentRow[]
  /** Unknown until the tenant picks it in step 1; income is skipped when null. */
  employmentType?: string | null
}

export interface ApplicationReadiness {
  issues: ApplicationIssue[]
  selection: PassportApplicationSelection
  isReady: boolean
}

function labelList(slots: ApplicationDocumentSlot[]): string {
  return slots.map((slot) => APPLICATION_SLOT_LABELS[slot]).join(', ')
}

/**
 * Everything that must be true before a tenant can apply. Shared by the
 * summary/review screens (early feedback) and the submit hook (final check).
 */
export function evaluateApplicationReadiness(
  input: ApplicationReadinessInput
): ApplicationReadiness {
  const issues: ApplicationIssue[] = []

  if (input.accountStatus !== 'verified') {
    issues.push({
      code: 'unverified',
      message: 'Verify your account first. Your APT Passport is submitted with every application.',
    })
  }

  if (input.tenantId && input.landlordId && input.tenantId === input.landlordId) {
    issues.push({ code: 'own-listing', message: 'You cannot apply to your own property.' })
  }

  if (input.hasActiveApplication) {
    issues.push({
      code: 'already-applied',
      message: 'You already have an active application for this apartment.',
    })
  }

  const selection = selectPassportDocsForApplication(
    input.passportDocs,
    input.employmentType ?? null
  )

  if (selection.missing.length > 0) {
    issues.push({
      code: 'passport-missing',
      slots: selection.missing,
      message: `Add to your APT Passport: ${labelList(selection.missing)}.`,
    })
  }

  if (selection.expired.length > 0) {
    issues.push({
      code: 'passport-expired',
      slots: selection.expired,
      message: `Expired in your APT Passport: ${labelList(selection.expired)}. Upload a current copy.`,
    })
  }

  return { issues, selection, isReady: issues.length === 0 }
}
