import { useState } from 'react'
import { supabase } from '@repo/supabase'
import { PUBLIC_IMAGE_CACHE_CONTROL } from '@repo/constants'
import { useApartmentFormStore } from '@/stores/useApartmentFormStore'
import { ImagePickerAsset } from 'expo-image-picker'
import { File } from 'expo-file-system'
import { useProfile } from 'hooks/auth'
import { buildImageTiers } from '@/utils/compressImage'
import { DEFAULT_RENT_DUE_DAY, pricingAmountFromMonths } from '@repo/utils'

const APARTMENT_IMAGES_BUCKET = 'apartment-images'

async function uploadBytes(uri: string, fileName: string): Promise<string> {
  const file = new File(uri)
  const bytes = await file.bytes()

  const { error } = await supabase.storage
    .from(APARTMENT_IMAGES_BUCKET)
    .upload(fileName, bytes, { contentType: 'image/jpeg', cacheControl: PUBLIC_IMAGE_CACHE_CONTROL })

  if (error) throw error

  const { data } = supabase.storage.from(APARTMENT_IMAGES_BUCKET).getPublicUrl(fileName)
  return data.publicUrl
}

/** Uploads both tiers; `paths` records every path that reached storage. */
async function uploadImage(
  asset: ImagePickerAsset,
  folder: string,
  paths: string[],
): Promise<{ url: string; urlThumb: string }> {
  const { fullUri, thumbUri } = await buildImageTiers(asset.uri, asset.width, asset.height)
  const base = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}`
  const fullPath = `${base}.jpg`
  const thumbPath = `${base}_thumb.jpg`
  paths.push(fullPath, thumbPath)

  const [url, urlThumb] = await Promise.all([
    uploadBytes(fullUri, fullPath),
    uploadBytes(thumbUri, thumbPath),
  ])

  return { url, urlThumb }
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

  const clearError = () => setError(null);

  const publish = async (): Promise<string | null> => {
    setLoading(true)
    setError(null)

    let apartmentId: string | null = null
    const imagePaths: string[] = []
    let leaseAgreementPath: string | null = null

    try {
      if (!profile) throw new Error('User profile not found.')
      if (!store.thumbnail) throw new Error('Thumbnail is required.')

      const monthlyRent = Number(store.monthlyRent)

      // 1. Insert the listing first so database rules (CAMANAVA location,
      // pricing) reject it before any file is uploaded. New listings always
      // start unverified; the database decides status and verification.
      const { data: apartment, error: insertError } = await supabase
        .from('apartments')
        .insert({
          name: store.name,
          description: store.description,
          monthly_rent: monthlyRent,
          rent_due_day: Number(store.rentDueDay) || DEFAULT_RENT_DUE_DAY,
          security_deposit: pricingAmountFromMonths(monthlyRent, store.securityDepositMonths),
          advance_rent: pricingAmountFromMonths(monthlyRent, store.advanceRentMonths),
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
          lease_agreement_url: null,
          landlord_id: profile.id,
        })
        .select('id')
        .single()

      if (insertError) throw insertError
      apartmentId = apartment.id

      // 2. Upload photos under the listing's folder
      const thumbnail = await uploadImage(store.thumbnail, apartment.id, imagePaths)
      const additional = await Promise.all(
        store.additionalPhotos.map((photo) => uploadImage(photo, apartment.id, imagePaths))
      )

      // 3. Upload lease agreement
      if (store.leaseAgreement) {
        const { uri, name, mimeType } = store.leaseAgreement
        const ext = name.split('.').pop()?.toLowerCase() ?? 'pdf'
        const fileName = `${apartment.id}/lease-agreement.${ext}`

        const file = new File(uri)
        const bytes = await file.bytes()

        const { error: uploadError } = await supabase.storage
          .from('lease-agreements')
          .upload(fileName, bytes, {
            contentType: mimeType ?? getMimeType(name),
            upsert: true,
          })

        if (uploadError) throw uploadError

        leaseAgreementPath = fileName

        const { error: updateError } = await supabase
          .from('apartments')
          .update({ lease_agreement_url: fileName })
          .eq('id', apartment.id)

        if (updateError) throw updateError
      }

      // 4. Insert image records (the cover row queues the listing for review)
      const imageRows = [
        { apartment_id: apartment.id, url: thumbnail.url, url_thumb: thumbnail.urlThumb, is_cover: true },
        ...additional.map((img) => ({
          apartment_id: apartment.id,
          url: img.url,
          url_thumb: img.urlThumb,
          is_cover: false,
        })),
      ]

      const { error: imagesError } = await supabase
        .from('apartment_images')
        .insert(imageRows)

      if (imagesError) throw imagesError

      // 5. Reset form store
      store.reset()

      return apartment.id
    } catch (err: any) {
      // Roll back anything that was saved so a retry starts clean.
      if (imagePaths.length > 0) {
        await supabase.storage.from(APARTMENT_IMAGES_BUCKET).remove(imagePaths)
      }
      if (leaseAgreementPath) {
        await supabase.storage.from('lease-agreements').remove([leaseAgreementPath])
      }
      if (apartmentId) {
        await supabase.from('apartments').delete().eq('id', apartmentId)
      }
      console.error('Publishing apartment failed', err)
      // Database rule messages (CAMANAVA, pricing) are user-facing.
      setError(err.message ?? 'Something went wrong.')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { publish, loading, error, clearError }
}
