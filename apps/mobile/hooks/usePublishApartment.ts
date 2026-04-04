// hooks/usePublishApartment.ts
import { useState } from 'react'
import { supabase } from '@repo/supabase'
import { useApartmentFormStore } from '@/store/useApartmentFormStore'
import { ImagePickerAsset } from 'expo-image-picker'
import { File } from 'expo-file-system/next'
import { useProfile } from './useProfile'

async function uploadImage(asset: ImagePickerAsset, folder: string): Promise<string> {
  const ext = asset.uri.split('.').pop() ?? 'jpg'
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const contentType = asset.mimeType ?? 'image/jpeg'

  const file = new File(asset.uri)
  const bytes = await file.bytes()

  const { error } = await supabase.storage
    .from('apartment-images')
    .upload(fileName, bytes, { contentType })

  if (error) throw error

  const { data } = supabase.storage.from('apartment-images').getPublicUrl(fileName)
  return data.publicUrl
}

function getMimeType(uri: string): string {
  const ext = uri.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'pdf':  return 'application/pdf'
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    case 'doc':  return 'application/msword'
    default:     return 'application/octet-stream'
  }
}

export function usePublishApartment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const store = useApartmentFormStore()
  const { profile } = useProfile()

  const publish = async (): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      if (!profile) throw new Error('User profile not found.')
      if (!store.thumbnail) throw new Error('Thumbnail is required.')

      // 1. Upload thumbnail
      const thumbnailUrl = await uploadImage(store.thumbnail, 'thumbnails')

      // 2. Upload additional photos
      const additionalUrls: string[] = await Promise.all(
        store.additionalPhotos.map((photo) => uploadImage(photo, 'additional'))
      )

      // 3. Insert apartment row
      const { data: apartment, error: insertError } = await supabase
        .from('apartments')
        .insert({
          name: store.name,
          description: store.description,
          monthly_rent: Number(store.monthlyRent),
          security_deposit: store.securityDeposit ? Number(store.securityDeposit) : null,
          advance_rent: store.advanceRent ? Number(store.advanceRent) : null,
          type: store.apartmentType,
          street_address: store.streetName,
          barangay: store.barangay,
          city: store.city,
          province: store.province,
          zip_code: store.postalCode ? Number(store.postalCode) : null,
          furnished_type: store.furnishingType || null,
          area_sqm: Number(store.floorArea) || 0,
          floor_level: store.floorLevel || null,
          no_bedrooms: store.bedrooms,
          no_bathrooms: store.bathrooms,
          max_occupants: store.maxOccupants,
          latitude: store.latitude,
          longitude: store.longitude,
          amenities: store.amenities,
          lease_duration: store.leaseDuration || null,
          status: 'unverified' as const,
          lease_agreement_url: null,
          landlord_id: profile.id,
        })
        .select('id')
        .single()

      if (insertError) throw insertError

      // 4. Upload lease agreement (apartment.id is guaranteed non-null here)
      let leaseAgreementUrl: string | null = null

      if (store.leaseAgreement) {
        const ext = store.leaseAgreement.split('.').pop()?.toLowerCase() ?? 'pdf'
        const fileName = `${apartment.id}/lease-agreement.${ext}`

        const file = new File(store.leaseAgreement)
        const bytes = await file.bytes()

        const { error: uploadError } = await supabase.storage
          .from('lease-agreements')
          .upload(fileName, bytes, {
            contentType: getMimeType(store.leaseAgreement),
            upsert: true,
          })

        if (uploadError) throw uploadError

        const { data: signedData, error: signedError } = await supabase.storage
          .from('lease-agreements')
          .createSignedUrl(fileName, 60 * 60 * 24 * 365)

        if (signedError) throw signedError
        leaseAgreementUrl = signedData.signedUrl
      }

      // 5. Update apartment with lease URL
      if (leaseAgreementUrl) {
        const { error: updateError } = await supabase
          .from('apartments')
          .update({ lease_agreement_url: leaseAgreementUrl })
          .eq('id', apartment.id)

        if (updateError) throw updateError
      }

      // 6. Insert image records
      const imageRows = [
        { apartment_id: apartment.id, url: thumbnailUrl, is_cover: true },
        ...additionalUrls.map((url) => ({
          apartment_id: apartment.id,
          url,
          is_cover: false,
        })),
      ]

      const { error: imagesError } = await supabase
        .from('apartment_images')
        .insert(imageRows)

      if (imagesError) throw imagesError

      // 7. Reset form store
      store.reset()

      return true
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { publish, loading, error }
}