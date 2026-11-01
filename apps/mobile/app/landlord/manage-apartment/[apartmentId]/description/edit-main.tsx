import { View, Text, Alert } from 'react-native'
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

import { TextField, Label, Input, Button, Spinner, Description } from "heroui-native"

import {
  updateApartmentMain,
  type ExistingImage,
  type PendingImage,
} from '@/service/apartments/updateApartmentMain'

import { CAMANAVA_CITIES, getBarangaysByCity, isCamanavaCity } from '@repo/constants'
import {
  ADVANCE_RENT_MONTH_OPTIONS,
  SECURITY_DEPOSIT_MONTH_OPTIONS,
  formatPesoDisplay,
  formatPricingMonths,
  pricingAmountFromMonths,
  pricingMonthsFromAmount,
  validateApartmentPricing,
} from '@repo/utils'
import { supabase } from '@repo/supabase'

const METRO_MANILA = 'Metro Manila'

type ApartmentInformation = {
  name: string
  street_address: string
  barangay: string
  city: string
  province: string
  monthly_rent: number
  /** `null` until chosen when the stored amount is not whole months of rent. */
  securityDepositMonths: number | null
  advanceRentMonths: number | null
}

type StoredPricing = {
  monthly_rent: number
  security_deposit: number | null
  advance_rent: number | null
}

function isPricingChanged(info: ApartmentInformation, stored: StoredPricing): boolean {
  return (
    info.monthly_rent !== stored.monthly_rent ||
    info.securityDepositMonths !==
      pricingMonthsFromAmount(stored.monthly_rent, stored.security_deposit, SECURITY_DEPOSIT_MONTH_OPTIONS) ||
    info.advanceRentMonths !==
      pricingMonthsFromAmount(stored.monthly_rent, stored.advance_rent, ADVANCE_RENT_MONTH_OPTIONS)
  )
}

function monthsFromLabel(options: readonly number[], label: string | null): number | null {
  return options.find((months) => formatPricingMonths(months) === label) ?? null
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
  pricingChanged: boolean,
): string | null {
  if (!info.name.trim()) return 'Apartment name is required.'
  if (!info.street_address.trim()) return 'Street address is required.'
  if (!info.barangay.trim()) return 'Barangay is required.'
  if (!isCamanavaCity(info.city)) return 'Select a city within CAMANAVA.'
  if (pricingChanged) {
    const pricingErrors = validateApartmentPricing({
      monthlyRent: info.monthly_rent,
      securityDepositMonths: info.securityDepositMonths,
      advanceRentMonths: info.advanceRentMonths,
    })
    const firstError =
      pricingErrors.monthlyRent ?? pricingErrors.securityDepositMonths ?? pricingErrors.advanceRentMonths
    if (firstError) return firstError
  }
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
    province: METRO_MANILA,
    monthly_rent: 0,
    securityDepositMonths: 0,
    advanceRentMonths: 0,
  })
  const [storedPricing, setStoredPricing] = useState<StoredPricing>({
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
        province: METRO_MANILA,
        monthly_rent: apartment.monthly_rent,
        securityDepositMonths: pricingMonthsFromAmount(
          apartment.monthly_rent,
          apartment.security_deposit,
          SECURITY_DEPOSIT_MONTH_OPTIONS,
        ),
        advanceRentMonths: pricingMonthsFromAmount(
          apartment.monthly_rent,
          apartment.advance_rent,
          ADVANCE_RENT_MONTH_OPTIONS,
        ),
      })
      setStoredPricing({
        monthly_rent: apartment.monthly_rent,
        security_deposit: apartment.security_deposit,
        advance_rent: apartment.advance_rent,
      })

      // Set lease agreement URI if exists
      if (apartment.lease_agreement_url) {
        const fileName = apartment.lease_agreement_url.split('/').pop() ?? 'lease-agreement';
        setLeaseAsset({
          uri: apartment.lease_agreement_url,
          name: fileName,
          mimeType: 'application/pdf',
          size: 0,
          lastModified: 0
        })
      }

      // Get apartment images
      const { data: images, error: imgError } = await supabase
        .from('apartment_images')
        .select('id, url, url_thumb, is_cover')
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
      img.kind === 'existing' ? existingToAsset(img.record.url_thumb || img.record.url) : img.asset,
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
    const pricingChanged = isPricingChanged(info, storedPricing)
    const validationError = validateForm(info, coverImages, pricingChanged)
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
        fields: {
          name: info.name,
          street_address: info.street_address,
          barangay: info.barangay,
          city: info.city,
          province: METRO_MANILA,
          // Listings priced before the shared rule keep their amounts until
          // the landlord changes the rent or picks new options.
          pricing: pricingChanged
            ? {
                monthly_rent: info.monthly_rent,
                security_deposit: pricingAmountFromMonths(info.monthly_rent, info.securityDepositMonths ?? 0),
                advance_rent: pricingAmountFromMonths(info.monthly_rent, info.advanceRentMonths ?? 0),
              }
            : null,
        },
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

        <TextField isDisabled>
          <Label>Province</Label>
          <Input value={METRO_MANILA} editable={false} />
          <Description>Listings are limited to the CAMANAVA area of Metro Manila.</Description>
        </TextField>

        <DropdownField
          label="City:"
          required
          placeholder="Select CAMANAVA city"
          bottomSheetLabel="Select City"
          options={[...CAMANAVA_CITIES]}
          onSelect={(v) => {
            const city = v ?? ''
            // A barangay from the previous city no longer applies.
            const keepBarangay = getBarangaysByCity(city).includes(info.barangay)
            setInfo({ ...info, city, barangay: keepBarangay ? info.barangay : '' })
          }}
          value={info.city}
        />

        <DropdownField
          label="Barangay:"
          required
          placeholder={info.city ? 'Select barangay' : 'Select a city first'}
          bottomSheetLabel="Select Barangay"
          // A saved barangay that is not in the city's list stays selectable.
          options={
            info.barangay && !getBarangaysByCity(info.city).includes(info.barangay)
              ? [info.barangay, ...getBarangaysByCity(info.city)]
              : getBarangaysByCity(info.city)
          }
          enableSearch
          searchPlaceholder="Search barangays..."
          disabled={!info.city}
          onSelect={(v) => setInfo({ ...info, barangay: v ?? '' })}
          value={info.barangay}
        />

        <TextField isRequired>
          <Label>Street Address</Label>
          <Input
            placeholder="Enter street address"
            value={info.street_address}
            onChangeText={(v) => setInfo({ ...info, street_address: v })}
          />
        </TextField>

        <TextField isRequired>
          <Label>Monthly Rent</Label>
          <Input
            placeholder="Enter monthly rent"
            keyboardType="numeric"
            value={info.monthly_rent.toString()}
            onChangeText={(v) => setInfo({ ...info, monthly_rent: parseInt(v) || 0 })}
          />
        </TextField>

        <DropdownField
          label="Security Deposit:"
          required
          placeholder="Select months"
          bottomSheetLabel="Security Deposit"
          options={SECURITY_DEPOSIT_MONTH_OPTIONS.map(formatPricingMonths)}
          onSelect={(v) =>
            setInfo({ ...info, securityDepositMonths: monthsFromLabel(SECURITY_DEPOSIT_MONTH_OPTIONS, v) })
          }
          value={info.securityDepositMonths == null ? null : formatPricingMonths(info.securityDepositMonths)}
        />
        {info.securityDepositMonths == null && (
          <Text className="text-muted text-sm font-inter">
            Current deposit {formatPesoDisplay(storedPricing.security_deposit ?? 0)} isn&apos;t whole months of rent. Choose an option when you update pricing.
          </Text>
        )}

        <DropdownField
          label="Advance Rent:"
          required
          placeholder="Select months"
          bottomSheetLabel="Advance Rent"
          options={ADVANCE_RENT_MONTH_OPTIONS.map(formatPricingMonths)}
          onSelect={(v) =>
            setInfo({ ...info, advanceRentMonths: monthsFromLabel(ADVANCE_RENT_MONTH_OPTIONS, v) })
          }
          value={info.advanceRentMonths == null ? null : formatPricingMonths(info.advanceRentMonths)}
        />
        {info.advanceRentMonths == null && (
          <Text className="text-muted text-sm font-inter">
            Current advance {formatPesoDisplay(storedPricing.advance_rent ?? 0)} isn&apos;t a whole month of rent. Choose an option when you update pricing.
          </Text>
        )}
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
        <Text className="text-foreground text-base font-nunitoSemiBold">
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
        <Spinner size="lg" />
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
