import { useState, useCallback } from 'react'
import { File } from 'expo-file-system'
import { randomUUID } from 'expo-crypto'

import { supabase } from '@repo/supabase'
import { useProfile } from '@/hooks/useProfile'
import {
  useApplicationFormStore,
  type UploadedDocumentPaths,
} from '@/stores/useApplicationFormStore'

import { requiresProofOfIncome } from '@repo/constants'

const BUCKET = 'application-documents'

type DocKey = keyof UploadedDocumentPaths

type SubmitArgs = {
  apartmentId: string
}

type SubmitResult = {
  success: boolean
  applicationId?: string
  error?: string
}

const MIME_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  pdf: 'application/pdf',
}

function getContentType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return MIME_MAP[ext] ?? 'application/octet-stream'
}

async function uploadDoc(
  uri: string,
  fileName: string,
  tenantId: string,
  applicationId: string,
  docKey: DocKey,
): Promise<string> {
  const file = new File(uri)
  const bytes = await file.bytes()

  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${tenantId}/${applicationId}/${docKey}-${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: getContentType(fileName),
  })

  if (error) throw new Error(`Failed to upload ${docKey}: ${error.message}`)

  return path
}

export function useSubmitApplication() {
  const { profile } = useProfile()

  const {
    tenantInformation,
    rentalPreferences,
    documents,
    setUploadedPath,
    setIsSubmitting,
    resetApplicationForm,
  } = useApplicationFormStore()

  const [error, setError] = useState<string | null>(null)

  const submit = useCallback(
    async ({ apartmentId }: SubmitArgs): Promise<SubmitResult> => {
      setError(null)

      if (!profile?.id) {
        const msg = 'You must be signed in to submit an application.'
        setError(msg)
        return { success: false, error: msg }
      }

      if (documents.govId.length === 0) {
        const msg = 'Government-issued ID is required.'
        setError(msg)
        return { success: false, error: msg }
      }
      if (requiresProofOfIncome(tenantInformation.employmentType) && !documents.proofOfIncome) {
        const msg = 'Proof of income is required.'
        setError(msg)
        return { success: false, error: msg }
      }
      if (documents.proofOfBilling.length === 0) {
        const msg = 'Proof of billing is required.'
        setError(msg)
        return { success: false, error: msg }
      }
      if (!rentalPreferences.moveInDate) {
        const msg = 'Move-in date is required.'
        setError(msg)
        return { success: false, error: msg }
      }

      const monthlyIncome = tenantInformation.monthlyIncome
      if (monthlyIncome === null) {
        const msg = 'Monthly income is required.'
        setError(msg)
        return { success: false, error: msg }
      }

      const noOccupants = rentalPreferences.noOccupants
      if (noOccupants === null || noOccupants <= 0) {
        const msg = 'Number of occupants is required.'
        setError(msg)
        return { success: false, error: msg }
      }

      setIsSubmitting(true)

      const tenantId = profile.id
      const applicationId = randomUUID()

      const uploadedSoFar: string[] = []

      try {
        const govIdAsset = documents.govId[0]
        const proofOfBillingAsset = documents.proofOfBilling[0]
        const proofOfIncomeAsset = documents.proofOfIncome
        const nbiAsset = documents.nbiClearance

        const govIdPath = await uploadDoc(
          govIdAsset.uri,
          govIdAsset.fileName ?? 'gov-id.jpg',
          tenantId,
          applicationId,
          'govId',
        )
        uploadedSoFar.push(govIdPath)
        setUploadedPath('govId', govIdPath)

        let proofOfIncomePath: string | null = null
        if (proofOfIncomeAsset) {
          proofOfIncomePath = await uploadDoc(
            proofOfIncomeAsset.uri,
            proofOfIncomeAsset.name,
            tenantId,
            applicationId,
            'proofOfIncome',
          )
          uploadedSoFar.push(proofOfIncomePath)
          setUploadedPath('proofOfIncome', proofOfIncomePath)
        }

        const proofOfBillingPath = await uploadDoc(
          proofOfBillingAsset.uri,
          proofOfBillingAsset.fileName ?? 'proof-of-billing.jpg',
          tenantId,
          applicationId,
          'proofOfBilling',
        )
        uploadedSoFar.push(proofOfBillingPath)
        setUploadedPath('proofOfBilling', proofOfBillingPath)

        let nbiPath: string | null = null
        if (nbiAsset) {
          nbiPath = await uploadDoc(
            nbiAsset.uri,
            nbiAsset.name,
            tenantId,
            applicationId,
            'nbiClearance',
          )
          uploadedSoFar.push(nbiPath)
          setUploadedPath('nbiClearance', nbiPath)
        }

        const { error: insertError } = await supabase
          .from('rental_application')
          .insert({
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
            gov_id_url: govIdPath,
            proof_of_income_url: proofOfIncomePath ?? null,
            proof_of_billing_url: proofOfBillingPath,
            nbi_clearance_url: nbiPath,
            status: 'pending',
          })

        if (insertError) {
          if (insertError.message.includes('unique_active_application_per_tenant_apartment')) {
            throw new Error('You already have an active application for this apartment.')
          }
          throw new Error(insertError.message)
        }

        resetApplicationForm()
        return { success: true }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to submit application.'
        setError(msg)

        if (uploadedSoFar.length > 0) {
          const { error: removeError } = await supabase.storage
            .from(BUCKET)
            .remove(uploadedSoFar)

          if (removeError) {
            console.warn('Cleanup failed for', uploadedSoFar, removeError.message)
          }
        }

        return { success: false, error: msg }
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      profile?.id,
      tenantInformation,
      rentalPreferences,
      documents,
      setUploadedPath,
      setIsSubmitting,
      resetApplicationForm,
    ],
  )

  const { isSubmitting } = useApplicationFormStore()

  return { submit, isSubmitting, error }
}
