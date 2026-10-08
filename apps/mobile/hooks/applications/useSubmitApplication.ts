import { useState, useCallback } from 'react'

import { supabase } from '@repo/supabase'
import { useProfile } from 'hooks/auth'
import { useApplicationFormStore } from '@/stores/useApplicationFormStore'
import { fetchPassportDocumentsWithVerification } from '@/service/passport/passportService'
import { evaluateApplicationReadiness } from '@/service/applications/applicationReadiness'

type SubmitArgs = {
  apartmentId: string
}

type SubmitResult = {
  success: boolean
  applicationId?: string
  error?: string
}

/**
 * Submits a rental application. Documents are never uploaded here: the
 * tenant's APT Passport documents are attached by reference (same private
 * storage path), chosen from a fresh passport read at submit time.
 */
export function useSubmitApplication() {
  const { profile } = useProfile()
  const tenantId = profile?.id ?? null

  const {
    tenantInformation,
    rentalPreferences,
    setIsSubmitting,
    resetApplicationForm,
  } = useApplicationFormStore()

  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    async ({ apartmentId }: SubmitArgs): Promise<SubmitResult> => {
      const fail = (msg: string): SubmitResult => {
        setError(msg)
        return { success: false, error: msg }
      }

      setError(null)

      if (!tenantId) return fail('You must be signed in to submit an application.')

      if (!rentalPreferences.moveInDate) return fail('Move-in date is required.')

      const monthlyIncome = tenantInformation.monthlyIncome
      if (monthlyIncome === null) return fail('Monthly income is required.')

      const noOccupants = rentalPreferences.noOccupants
      if (noOccupants === null || noOccupants <= 0) {
        return fail('Number of occupants is required.')
      }

      const { data: apartment, error: apartmentError } = await supabase
        .from('apartments')
        .select('landlord_id')
        .eq('id', apartmentId)
        .single()

      if (apartmentError || !apartment) {
        if (apartmentError) console.error('Could not verify apartment ownership', apartmentError)
        return fail('Could not verify this apartment. Please try again.')
      }

      setIsSubmitting(true)

      try {
        // Authoritative passport read: links the approved ID first, so the
        // primary ID is present even if the passport screen was never opened.
        const passportDocs = await fetchPassportDocumentsWithVerification(tenantId)

        const readiness = evaluateApplicationReadiness({
          accountStatus: profile?.account_status,
          tenantId,
          landlordId: apartment.landlord_id,
          // The unique index rejects a duplicate pending application below.
          hasActiveApplication: false,
          passportDocs,
          employmentType: tenantInformation.employmentType,
        })

        if (!readiness.isReady) return fail(readiness.issues[0].message)

        const { docs } = readiness.selection
        // Readiness guarantees these; the check narrows the nullable types.
        if (!docs.govId || !docs.proofOfBilling) {
          return fail('Your APT Passport is missing required documents.')
        }

        const { error: insertError } = await supabase.from('rental_application').insert({
          tenant_id: tenantId,
          apartment_id: apartmentId,
          occupation: tenantInformation.occupation,
          employer_name: tenantInformation.companyName,
          monthly_income: monthlyIncome,
          employment_type: tenantInformation.employmentType,
          prev_landlord_name: tenantInformation.previousLandlordName || null,
          prev_landlord_contact: tenantInformation.previousLandlordContact || null,
          move_in_date: rentalPreferences.moveInDate.toISOString().slice(0, 10),
          no_occupants: noOccupants,
          has_pets: rentalPreferences.hasPets ?? false,
          has_smoker: rentalPreferences.isSmoker ?? false,
          need_parking: rentalPreferences.needParking ?? false,
          message: rentalPreferences.additionalNotes || null,
          gov_id_url: docs.govId.storage_path,
          // Only a verification-linked ID has a back capture to share.
          gov_id_back_url: docs.govId.verification_id ? docs.govId.storage_path_back : null,
          proof_of_income_url: docs.proofOfIncome?.storage_path ?? null,
          proof_of_billing_url: docs.proofOfBilling.storage_path,
          nbi_clearance_url: docs.nbiClearance?.storage_path ?? null,
          status: 'pending',
        })

        if (insertError) {
          if (insertError.message.includes('unique_active_application_per_tenant_apartment')) {
            return fail('You already have an active application for this apartment.')
          }
          return fail(insertError.message)
        }

        resetApplicationForm()
        return { success: true }
      } catch (err) {
        return fail(err instanceof Error ? err.message : 'Failed to submit application.')
      } finally {
        setIsSubmitting(false)
      }
    },
    [tenantId, profile, tenantInformation, rentalPreferences, setIsSubmitting, resetApplicationForm],
  )

  const { isSubmitting } = useApplicationFormStore()

  return { submit, isSubmitting, error }
}
