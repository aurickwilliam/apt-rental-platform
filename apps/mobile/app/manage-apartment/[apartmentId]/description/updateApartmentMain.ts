import { supabase } from '@repo/supabase'
import * as ImagePicker from 'expo-image-picker'

export type ApartmentMainFields = {
  name: string
  street_address: string        
  barangay: string              
  city: string                  
  province: string              
  monthly_rent: number           
  security_deposit: number | null
  advance_rent: number | null
}

export type ExistingImage = {
  id: string            
  url: string
  is_cover: boolean
}

export type PendingImage = {
  asset: ImagePicker.ImagePickerAsset
  is_cover: boolean
}

export type UpdateApartmentMainParams = {
  apartmentId: string
  fields: ApartmentMainFields
  keptExistingImages: ExistingImage[]
  pendingImages: PendingImage[]
}

async function uploadImage(
  apartmentId: string,
  asset: ImagePicker.ImagePickerAsset,
  isCover: boolean,
): Promise<string> {
  const ext = asset.uri.split('.').pop() ?? 'jpg'
  const prefix = isCover ? 'cover' : 'photo'
  const path = `apartments/${apartmentId}/${prefix}_${Date.now()}.${ext}`

  const response = await fetch(asset.uri)
  const blob = await response.blob()

  const { error } = await supabase.storage
    .from('apartment-images')
    .upload(path, blob, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from('apartment-images').getPublicUrl(path)
  return data.publicUrl
}

async function deleteStorageImage(url: string) {
  const marker = '/apartment-images/'
  const idx = url.indexOf(marker)
  if (idx === -1) return
  const path = url.slice(idx + marker.length)
  await supabase.storage.from('apartment-images').remove([path])
}

export async function updateApartmentMain({
  apartmentId,
  fields,
  keptExistingImages,
  pendingImages,
}: UpdateApartmentMainParams): Promise<void> {

  // 1. Update core apartment fields
  const { error: aptError } = await supabase
    .from('apartments')
    .update({
      name: fields.name,
      street_address: fields.street_address,
      barangay: fields.barangay,
      city: fields.city,
      province: fields.province,
      monthly_rent: fields.monthly_rent,
      security_deposit: fields.security_deposit,
      advance_rent: fields.advance_rent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', apartmentId)

  if (aptError) throw new Error(`Apartment update failed: ${aptError.message}`)

  // 2. Find which existing images were removed
  const keptIds = new Set(keptExistingImages.map((img) => img.id))

  const { data: allExisting, error: fetchError } = await supabase
    .from('apartment_images')
    .select('id, url, is_cover')
    .eq('apartment_id', apartmentId)

  if (fetchError) throw new Error(`Fetch images failed: ${fetchError.message}`)

  const toDelete = (allExisting ?? []).filter((img) => !keptIds.has(img.id))

  // Delete from storage + DB in parallel
  await Promise.all([
    ...toDelete.map((img) => deleteStorageImage(img.url)),
    toDelete.length > 0
      ? supabase
          .from('apartment_images')
          .delete()
          .in('id', toDelete.map((img) => img.id))
      : Promise.resolve(),
  ])

  // 3. Upload & insert new images
  if (pendingImages.length > 0) {
    const uploadedRows = await Promise.all(
      pendingImages.map(async ({ asset, is_cover }) => {
        const url = await uploadImage(apartmentId, asset, is_cover)
        return { apartment_id: apartmentId, url, is_cover }
      }),
    )

    const { error: insertError } = await supabase
      .from('apartment_images')
      .insert(uploadedRows)

    if (insertError) throw new Error(`Image insert failed: ${insertError.message}`)
  }
}