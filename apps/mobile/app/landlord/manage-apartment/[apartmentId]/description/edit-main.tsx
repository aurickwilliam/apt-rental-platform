import { View, Text, Alert, ActivityIndicator } from 'react-native'
import { useState, useEffect } from 'react'
import { useRouter, useLocalSearchParams } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'

import DropdownField from 'components/inputs/DropdownField'
import ScreenWrapper from 'components/layout/ScreenWrapper'
import StandardHeader from 'components/layout/StandardHeader'
import Divider from 'components/display/Divider'
import UploadImageField from 'components/inputs/UploadImageField'
import UploadFileField from 'components/inputs/UploadFileField'

import { TextField, Label, Input, Button} from "heroui-native"

import {
  updateApartmentMain,
  type ExistingImage,
  type PendingImage,
} from './updateApartmentMain'

import { PROVINCES } from '@repo/constants'
import { supabase } from '@repo/supabase'

type ApartmentInformation = {
  name: string
  street_address: string
  barangay: string
  city: string
  province: string
  monthly_rent: number
  security_deposit: number | null
  advance_rent: number | null
}

type DisplayImage =
  | { kind: 'existing'; record: ExistingImage; asset: never }
  | { kind: 'pending'; asset: ImagePicker.ImagePickerAsset; record: never }

function existingToAsset(url: string): ImagePicker.ImagePickerAsset {
  return { uri: url } as ImagePicker.ImagePickerAsset
}

function validateForm(
  info: ApartmentInformation,
  coverImages: DisplayImage[],
): string | null {
  if (!info.name.trim()) return 'Apartment name is required.'
  if (!info.street_address.trim()) return 'Street address is required.'
  if (!info.barangay.trim()) return 'Barangay is required.'
  if (!info.city.trim()) return 'City is required.'
  if (!info.province) return 'Province is required.'
  if (!info.monthly_rent || info.monthly_rent <= 0) return 'Monthly rent must be greater than 0.'
  if (info.security_deposit === null || info.security_deposit < 0)
    return 'Security deposit is required.'
  if (info.advance_rent === null || info.advance_rent < 0)
    return 'Advance rent is required.'
  if (coverImages.length === 0) return 'A thumbnail photo is required.'
  return null
}

export default function EditMain() {
  const router = useRouter()
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()

  const [info, setInfo] = useState<ApartmentInformation>({
    name: '',
    street_address: '',
    barangay: '',
    city: '',
    province: '',
    monthly_rent: 0,
    security_deposit: 0,
    advance_rent: 0,
  })

  const [coverImages, setCoverImages] = useState<DisplayImage[]>([])
  const [additionalImages, setAdditionalImages] = useState<DisplayImage[]>([])
  const [leaseAsset, setLeaseAsset] = useState<DocumentPicker.DocumentPickerAsset | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!apartmentId) return

    const fetchApartment = async () => {
      // Get apartment details
      const { data: apartment, error } = await supabase
        .from('apartments')
        .select(`
          name,
          street_address,
          barangay,
          city,
          province,
          monthly_rent,
          security_deposit,
          advance_rent,
          lease_agreement_url
        `)
        .eq('id', apartmentId)
        .single()

      if (error) {
        Alert.alert('Error', error.message)
        return
      }

      setInfo({
        name: apartment.name,
        street_address: apartment.street_address,
        barangay: apartment.barangay,
        city: apartment.city,
        province: apartment.province,
        monthly_rent: apartment.monthly_rent,
        security_deposit: apartment.security_deposit,
        advance_rent: apartment.advance_rent,
      })

      // Set lease agreement URI if exists
      if (apartment.lease_agreement_url) {
        setLeaseAsset({
          uri: apartment.lease_agreement_url,
          name: 'lease_agreement',
          mimeType: 'application/pdf',
          size: 0,
          lastModified: 0
        })
      }

      // Get apartment images
      const { data: images, error: imgError } = await supabase
        .from('apartment_images')
        .select('id, url, is_cover')
        .eq('apartment_id', apartmentId)

      if (imgError) {
        Alert.alert('Error', imgError.message)
        return
      }

      // Separate cover and additional images
      const cover: DisplayImage[] = images
        .filter((img) => img.is_cover === true)
        .map((img) => ({
          kind: 'existing' as const,
          record: { ...img, is_cover: img.is_cover as boolean },
          asset: undefined as never,
        }))

      const additional: DisplayImage[] = images
        .filter((img) => img.is_cover === false)
        .map((img) => ({
          kind: 'existing' as const,
          record: { ...img, is_cover: img.is_cover as boolean },
          asset: undefined as never,
        }))

      setCoverImages(cover)
      setAdditionalImages(additional)
    }

    fetchApartment()
  }, [apartmentId])

  function toAssets(images: DisplayImage[]): ImagePicker.ImagePickerAsset[] {
    return images.map((img) =>
      img.kind === 'existing' ? existingToAsset(img.record.url) : img.asset,
    )
  }

  function addCover(assetOrAssets: ImagePicker.ImagePickerAsset | ImagePicker.ImagePickerAsset[]) {
    const asset = Array.isArray(assetOrAssets) ? assetOrAssets[0] : assetOrAssets
    setCoverImages([{ kind: 'pending', asset, record: undefined as never }])
  }

  function removeCover(uri: string) {
    setCoverImages((prev) =>
      prev.filter((img) => (img.kind === 'existing' ? img.record.url !== uri : img.asset.uri !== uri)),
    )
  }

  function addAdditional(assetOrAssets: ImagePicker.ImagePickerAsset | ImagePicker.ImagePickerAsset[]) {
    const assets = Array.isArray(assetOrAssets) ? assetOrAssets : [assetOrAssets]
    setAdditionalImages((prev) => [
      ...prev,
      ...assets.map((asset) => ({ kind: 'pending' as const, asset, record: undefined as never })),
    ])
  }

  function removeAdditional(uri: string) {
    setAdditionalImages((prev) =>
      prev.filter((img) => (img.kind === 'existing' ? img.record.url !== uri : img.asset.uri !== uri)),
    )
  }

  const handleSaveChanges = async () => {
    if (!apartmentId) return

    // Validate form before submitting
    const validationError = validateForm(info, coverImages)
    if (validationError) {
      Alert.alert('Validation Error', validationError)
      return
    }

    setSaving(true)
    try {
      // Determine which existing images are kept vs removed, and prepare pending images for upload
      const keptExistingImages: ExistingImage[] = [...coverImages, ...additionalImages]
        .filter((img): img is Extract<DisplayImage, { kind: 'existing' }> => img.kind === 'existing')
        .map((img) => img.record)

      const pendingImages: PendingImage[] = [
        ...coverImages
          .filter((img): img is Extract<DisplayImage, { kind: 'pending' }> => img.kind === 'pending')
          .map((img) => ({ asset: img.asset, is_cover: true })),
        ...additionalImages
          .filter((img): img is Extract<DisplayImage, { kind: 'pending' }> => img.kind === 'pending')
          .map((img) => ({ asset: img.asset, is_cover: false })),
      ]

      // Update apartment main info, handle image uploads/deletions, and update lease agreement
      await updateApartmentMain({
        apartmentId,
        fields: info,
        keptExistingImages,
        pendingImages,
      })

      router.replace(`/landlord/manage-apartment/${apartmentId}/description`)
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScreenWrapper
      className="p-5"
      header={<StandardHeader title="Edit Main Information" />}
      scrollable
    >
      <View className="flex gap-3">
        <TextField isRequired>
          <Label>Apartment Name</Label>
          <Input
            placeholder="Enter apartment name"
            value={info.name}
            onChangeText={(v) => setInfo({ ...info, name: v })}
          />
        </TextField>

        <TextField isRequired>
          <Label>Street Address</Label>
          <Input
            placeholder="Enter street address"
            value={info.street_address}
            onChangeText={(v) => setInfo({ ...info, street_address: v })}
          />
        </TextField>

        <TextField isRequired>
          <Label>Barangay</Label>
          <Input
            placeholder="Enter barangay"
            value={info.barangay}
            onChangeText={(v) => setInfo({ ...info, barangay: v })}
          />
        </TextField>

        <TextField isRequired>
          <Label>City</Label>
          <Input
            placeholder="Enter city"
            value={info.city}
            onChangeText={(v) => setInfo({ ...info, city: v })}
          />
        </TextField>

        <DropdownField
          label="Province:"
          required
          placeholder="Select province"
          bottomSheetLabel="Select Province"
          options={PROVINCES}
          onSelect={(v) => setInfo({ ...info, province: v ? v : '' })}
          value={info.province}
        />

        <TextField isRequired>
          <Label>Monthly Rent</Label>
          <Input
            placeholder="Enter monthly rent"
            keyboardType="numeric"
            value={info.monthly_rent.toString()}
            onChangeText={(v) => setInfo({ ...info, monthly_rent: parseInt(v) || 0 })}
          />
        </TextField>

        <TextField isRequired>
          <Label>Security Deposit</Label>
          <Input
            placeholder="Enter security deposit"
            keyboardType="numeric"
            value={info.security_deposit?.toString()}
            onChangeText={(v) => setInfo({ ...info, security_deposit: parseInt(v) || 0 })}
          />
        </TextField>

        <TextField isRequired>
          <Label>Advance Rent</Label>
          <Input
            placeholder="Enter advance rent"
            keyboardType="numeric"
            value={info.advance_rent?.toString()}
            onChangeText={(v) => setInfo({ ...info, advance_rent: parseInt(v) || 0 })}
          />
        </TextField>
      </View>

      <Divider marginVertical={30} />

      <UploadImageField
        label="Thumbnail Photo:"
        required
        single
        images={toAssets(coverImages)}
        onAdd={addCover}
        onRemove={removeCover}
      />

      <Divider marginVertical={30} />

      <UploadImageField
        label="Additional Photos:"
        images={toAssets(additionalImages)}
        onAdd={addAdditional}
        onRemove={removeAdditional}
      />

      <Divider marginVertical={30} />

      <View className="flex gap-3">
        <Text className="text-text text-base font-interMedium">
          Change Lease Agreement
        </Text>
        <UploadFileField
          label="Lease Agreement:"
          placeholder="No lease agreement uploaded yet."
          value={leaseAsset}
          onChange={setLeaseAsset}
        />
      </View>

      <View className="h-36" />

      {saving ? (
        <ActivityIndicator size="large" />
      ) : (
        <Button onPress={handleSaveChanges}>
          <Button.Label>
            Save Changes
          </Button.Label>
        </Button>
      )}
    </ScreenWrapper>
  )
}
