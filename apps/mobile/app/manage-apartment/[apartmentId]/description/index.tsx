import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router'
import * as DocumentPicker from 'expo-document-picker'
import { readAsStringAsync } from 'expo-file-system/legacy'

import ScreenWrapper from '@/components/layout/ScreenWrapper'
import StandardHeader from '@/components/layout/StandardHeader'
import Divider from '@/components/display/Divider'
import PerkItem from '../../components/PerkItem'
import PillButton from '@/components/buttons/PillButton'

import {
  IconHome,
  IconBath,
  IconBed,
  IconMaximize,
  IconFileText,
  IconEdit,
  IconArmchair,
  IconCalendar,
  IconUsers,
  IconBuildingCommunity,
  IconUpload,
} from '@tabler/icons-react-native'

import { COLORS } from '@repo/constants'
import { supabase } from '@repo/supabase'

type Apartment = {
  id: string
  name: string
  description: string
  monthly_rent: number
  security_deposit: number
  advance_rent: number
  type: string
  street_address: string
  barangay: string
  city: string
  province: string
  no_bedrooms: number
  no_bathrooms: number
  area_sqm: number
  furnished_type: string | null
  floor_level: string | null
  max_occupants: number | null
  lease_duration: string | null
  amenities: string[]
  lease_agreement_url: string | null
  landlord: {
    first_name: string
    last_name: string
  } | null
}

type ActiveTenancy = {
  move_in_date: string
  move_out_date: string | null
  monthly_rent: number | null
  tenant: {
    first_name: string
    last_name: string
  } | null
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatCurrency(amount: number | null | undefined) {
  if (amount == null) return '—'
  return `₱ ${Number(amount).toLocaleString('en-PH')}`
}

export default function Index() {
  const router = useRouter()
  const { apartmentId } = useLocalSearchParams<{ apartmentId: string }>()

  const [apartment, setApartment] = useState<Apartment | null>(null)
  const [tenancy, setTenancy] = useState<ActiveTenancy | null>(null)
  const [loading, setLoading] = useState(true)

  const [uploading, setUploading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!apartmentId) return
    setLoading(true)

    const { data: aptData, error: aptError } = await supabase
      .from('apartments')
      .select(`
        id, name, description, monthly_rent, type,
        street_address, barangay, city, province,
        no_bedrooms, no_bathrooms, area_sqm,
        furnished_type, floor_level, max_occupants,
        lease_duration, amenities, lease_agreement_url,
        security_deposit, advance_rent,
        landlord:landlord_id (
          first_name,
          last_name
        )
      `)
      .eq('id', apartmentId)
      .single()

    if (!aptError && aptData) {
      setApartment(aptData as Apartment)
    }

    const { data: tenancyData, error: tenancyError } = await supabase
      .from('tenancies')
      .select(`
        move_in_date, move_out_date, monthly_rent,
        tenant:users!tenant_id (
          first_name,
          last_name
        )
      `)
      .eq('apartment_id', apartmentId)
      .eq('status', 'active')
      .maybeSingle()

    if (!tenancyError && tenancyData) {
      setTenancy(tenancyData as ActiveTenancy)
    }

    setLoading(false)
  }, [apartmentId])

  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [fetchData])
  )

  const handleUploadLease = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        copyToCacheDirectory: true,
      })

      if (result.canceled) return

      const file = result.assets[0]
      const fileExt = file.name.split('.').pop()
      const filePath = `${apartmentId}/lease_agreement.${fileExt}`

      setUploading(true)

      // Read file as base64 instead of using fetch().blob()
      const base64 = await readAsStringAsync(file.uri, {
        encoding: 'base64',
      })

      // Convert base64 → Uint8Array (what Supabase Storage actually needs)
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const { data: existingFiles } = await supabase.storage
        .from('lease-agreements')
        .list(apartmentId)

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${apartmentId}/${f.name}`)
        await supabase.storage.from('lease-agreements').remove(filesToDelete)
      }

      const { error: uploadError } = await supabase.storage
        .from('lease-agreements')
        .upload(filePath, bytes, {
          upsert: true,
          contentType: file.mimeType ?? 'application/octet-stream',
        })

      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('apartments')
        .update({ lease_agreement_url: filePath })
        .eq('id', apartmentId)

      if (updateError) throw updateError

      Alert.alert('Success', 'Lease agreement uploaded successfully.')
      fetchData()
    } catch (err) {
      Alert.alert('Error', 'Failed to upload lease agreement.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleViewLease = async () => {
    if (!apartment?.lease_agreement_url) return

    try {
      // List the actual files under this apartment's folder in storage
      // instead of trusting the stored path, which may be stale or mismatched
      const { data: files, error: listError } = await supabase.storage
        .from('lease-agreements')
        .list(apartmentId)

      if (listError) throw listError

      if (!files?.length) {
        Alert.alert('Not Found', 'No lease agreement file found in storage.')
        return
      }

      // Use the first file found (there should only ever be one)
      const storagePath = `${apartmentId}/${files[0].name}`

      const { data, error } = await supabase.storage
        .from('lease-agreements')
        .createSignedUrl(storagePath, 3600)

      if (error || !data?.signedUrl) throw error

      router.push({
        pathname: '/manage-apartment/[apartmentId]/description/lease-viewer',
        params: { apartmentId, fileUrl: data.signedUrl },
      })
    } catch (err) {
      Alert.alert('Error', 'Could not open lease agreement.')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <ScreenWrapper header={<StandardHeader title='Apartment Description' />}>
        <View className='flex-1 items-center justify-center mt-20'>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </ScreenWrapper>
    )
  }

  const landlordName = apartment?.landlord
    ? `${apartment.landlord.first_name} ${apartment.landlord.last_name}`
    : '—'

  const fullAddress = apartment
    ? `${apartment.street_address}, ${apartment.barangay}, ${apartment.city}, ${apartment.province}`
    : '—'

  const effectiveRent = tenancy?.monthly_rent ?? apartment?.monthly_rent

  return (
    <ScreenWrapper
      scrollable
      className='p-5'
      header={
        <StandardHeader
          title='Apartment Description'
          onBackPress={() => router.replace(`/manage-apartment/${apartmentId}`)}
        />
      }
    >
      <View className='flex-row items-center justify-between'>
        <Text className='text-text text-lg font-poppinsMedium'>
          Main Information
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/manage-apartment/${apartmentId}/description/edit-main`)}
        >
          <IconEdit size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View className='mt-3'>
        <Text className='text-2xl font-interSemiBold text-text'>
          {apartment?.name ?? '—'}
        </Text>
        <Text className='text-base text-text'>
          {fullAddress}
        </Text>
      </View>

      <View className='mt-5'>
        <Text className='text-text text-sm font-inter'>Landlord</Text>
        <Text className='text-text text-lg font-interMedium'>{landlordName}</Text>
      </View>

      {tenancy && (
        <View className='flex-row mt-5'>
          <View className='flex w-1/2'>
            <Text className='text-text text-sm font-inter'>Lease Start</Text>
            <Text className='text-text text-lg font-interMedium'>
              {formatDate(tenancy.move_in_date)}
            </Text>
          </View>
          <View className='flex w-1/2'>
            <Text className='text-text text-sm font-inter'>Lease End</Text>
            <Text className='text-text text-lg font-interMedium'>
              {formatDate(tenancy.move_out_date)}
            </Text>
          </View>
        </View>
      )}

      <View className='flex-row flex-wrap'>
        <View className='mt-5 flex w-1/2'>
          <Text className='text-text text-sm font-inter'>Monthly Rent</Text>
          <Text className='text-text text-lg font-interMedium'>
            {formatCurrency(effectiveRent)}
          </Text>
        </View>
        <View className='mt-5 flex w-1/2'>
          <Text className='text-text text-sm font-inter'>Security Deposit</Text>
          <Text className='text-text text-lg font-interMedium'>
            {formatCurrency(apartment?.security_deposit ?? 0)}
          </Text>
        </View>
        <View className='mt-5 flex w-1/2'>
          <Text className='text-text text-sm font-inter'>Advance Rent</Text>
          <Text className='text-text text-lg font-interMedium'>
            {formatCurrency(apartment?.advance_rent ?? 0)}
          </Text>
        </View>
      </View>

      <Divider />

      <View className='flex-row items-center justify-between'>
        <Text className='text-text text-lg font-poppinsMedium'>
          Apartment Full Description
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/manage-apartment/${apartmentId}/description/edit-description`)}
        >
          <IconEdit size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View className='mt-3 bg-darkerWhite p-4 rounded-2xl'>
        <Text className='text-text text-base font-inter'>
          {apartment?.description ?? '—'}
        </Text>
      </View>

      <View className='flex-row items-center justify-between'>
        <Text className='text-text text-lg font-poppinsMedium mt-5'>
          Room/Unit Details
        </Text>
        <TouchableOpacity
          onPress={() => router.push(`/manage-apartment/${apartmentId}/description/edit-specs`)}
        >
          <IconEdit size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View className='flex-row flex-wrap justify-between mt-5'>
        <View className='w-1/2 mb-5'>
          <PerkItem customIcon={IconHome} customText={apartment?.type ?? '—'} iconColor={COLORS.mediumGrey} />
        </View>
        <View className='w-1/2 mb-5'>
          <PerkItem customIcon={IconCalendar} customText={apartment?.lease_duration ?? '—'} iconColor={COLORS.mediumGrey} />
        </View>
        <View className='w-1/2 mb-5'>
          <PerkItem
            customIcon={IconBed}
            customText={`${apartment?.no_bedrooms ?? '—'} Bedroom${apartment?.no_bedrooms !== 1 ? 's' : ''}`}
            iconColor={COLORS.mediumGrey}
          />
        </View>
        <View className='w-1/2 mb-5'>
          <PerkItem
            customIcon={IconBath}
            customText={`${apartment?.no_bathrooms ?? '—'} Bathroom${apartment?.no_bathrooms !== 1 ? 's' : ''}`}
            iconColor={COLORS.mediumGrey}
          />
        </View>
        <View className='w-1/2 mb-5'>
          <PerkItem customIcon={IconArmchair} customText={apartment?.furnished_type ?? '—'} iconColor={COLORS.mediumGrey} />
        </View>
        <View className='w-1/2 mb-5'>
          <PerkItem customIcon={IconBuildingCommunity} customText={apartment?.floor_level ?? '—'} iconColor={COLORS.mediumGrey} />
        </View>
        <View className='w-1/2 mb-5'>
          <PerkItem
            customIcon={IconUsers}
            customText={apartment?.max_occupants ? `Max ${apartment.max_occupants} Occupants` : '—'}
            iconColor={COLORS.mediumGrey}
          />
        </View>
        <View className='w-1/2 mb-5'>
          <PerkItem
            customIcon={IconMaximize}
            customText={apartment?.area_sqm ? `${apartment.area_sqm} sqm` : '—'}
            iconColor={COLORS.mediumGrey}
          />
        </View>
      </View>

      {(apartment?.amenities?.length ?? 0) > 0 && (
        <>
          <View className='flex-row items-center justify-between'>
            <Text className='text-text text-lg font-poppinsMedium mt-5'>
              Included Perks
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/manage-apartment/${apartmentId}/description/edit-perks`)}
            >
              <IconEdit size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View className='flex-row flex-wrap justify-between mt-5'>
            {apartment!.amenities.map((perk, index) => (
              <View className='w-1/2 mb-5' key={index}>
                <PerkItem iconColor={COLORS.primary} perkId={perk} />
              </View>
            ))}
          </View>
        </>
      )}

      <Divider />

      <View className='mt-5 gap-3'>
        <PillButton
          label='View Lease Agreement'
          isFullWidth
          type='outline'
          leftIconName={IconFileText}
          isDisabled={!apartment?.lease_agreement_url}
          onPress={handleViewLease}
        />

        <PillButton
          label={uploading ? 'Uploading...' : 'Upload Lease Agreement'}
          isFullWidth
          leftIconName={IconUpload}
          isDisabled={uploading}
          onPress={handleUploadLease}
        />
      </View>
    </ScreenWrapper>
  )
}