import { useMemo } from 'react'

import { useProfile } from 'hooks/auth'
import { usePassportDocuments } from '@/hooks/passport'
import { useTenantApplications } from './useTenantApplications'
import { evaluateApplicationReadiness } from '@/service/applications/applicationReadiness'

/**
 * Live "can this tenant apply to this apartment?" state: account verified,
 * not their own listing, no active application, and a complete APT Passport.
 */
export function useApplicationReadiness(
  apartmentId: string | undefined,
  landlordId: string | null | undefined,
  employmentType: string | null = null
) {
  const { profile, loading: profileLoading } = useProfile()
  const { documents, loading: passportLoading } = usePassportDocuments()
  const { applications, loading: applicationsLoading } = useTenantApplications()

  const readiness = useMemo(
    () =>
      evaluateApplicationReadiness({
        accountStatus: profile?.account_status,
        tenantId: profile?.id,
        landlordId,
        hasActiveApplication: applications.some(
          (application) =>
            application.apartment_id === apartmentId && application.status === 'pending'
        ),
        passportDocs: documents,
        employmentType,
      }),
    [profile, landlordId, applications, apartmentId, documents, employmentType]
  )

  return {
    ...readiness,
    loading: profileLoading || passportLoading || applicationsLoading,
  }
}
