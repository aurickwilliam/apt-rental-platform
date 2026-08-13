import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { Image as RNImage } from 'react-native'
import { supabase } from '@repo/supabase'
import { DEFAULT_IMAGES } from 'constants/images'

export type PublicTenantProfile = {
  id: string
  fullName: string
  email: string
  phoneNumber: string
  location: string
  memberSinceYear: string
  isVerified: boolean
  avatarUrl: string | null
  reviewsCount: number
}

export type PastApartment = {
  id: string
  name: string
  city: string
  barangay: string
  leaseStartMonth: string
  leaseStartYear: string
  leaseEndMonth: string
  leaseEndYear: string
  thumbnailUrl: string
}

function formatMonth(isoDate: string | null): string {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleString('default', { month: 'long' })
}

function formatYear(isoDate: string | null): string {
  if (!isoDate) return '—'
  return String(new Date(isoDate).getFullYear())
}

type TenantUserRow = {
  first_name: string | null
  last_name: string | null
  email: string | null
  mobile_number: string | null
  avatar_url: string | null
  created_at: string | null
  city: string | null
  province: string | null
  account_status: string | null
}

export function usePublicTenantProfile(tenantId?: string) {
  const [profile, setProfile] = useState<PublicTenantProfile | null>(null)
  const [pastApartments, setPastApartments] = useState<PastApartment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTenantProfile = useCallback(async () => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    setLoading(true)

    try {
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select(`
          first_name,
          last_name,
          email,
          mobile_number,
          avatar_url,
          created_at,
          city,
          province,
          account_status
        `)
        .eq('id', tenantId)
        .single()

      if (userError) throw userError

      const user = userRow as unknown as TenantUserRow

      const { count: reviewCount } = await supabase
        .from('reviews')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)

      const location = [user.city, user.province].filter(Boolean).join(', ') || '—'

      setProfile({
        id: tenantId,
        fullName: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Tenant',
        email: user.email ?? '—',
        phoneNumber: user.mobile_number ?? '—',
        location,
        memberSinceYear: user.created_at
          ? String(new Date(user.created_at).getFullYear())
          : '—',
        isVerified: user.account_status === 'verified',
        avatarUrl: user.avatar_url ?? null,
        reviewsCount: reviewCount ?? 0,
      })

      const { data: tenancies } = await supabase
        .from('tenancies')
        .select(`
          id,
          lease_start,
          lease_end,
          apartment:apartments!tenancies_apartment_id_fkey (
            id,
            name,
            barangay,
            city,
            apartment_images (url, is_cover)
          )
        `)
        .eq('tenant_id', tenantId)
        .in('status', ['ended'])
        .order('lease_end', { ascending: false })

      const mapped: PastApartment[] = ((tenancies ?? []) as unknown as {
        id: string
        lease_start: string | null
        lease_end: string | null
        apartment: {
          id: string
          name: string
          barangay: string
          city: string
          apartment_images: { url: string; is_cover: boolean | null }[]
        } | null
      }[]).map((t) => {
        const apt = t.apartment ?? { id: '', name: '', barangay: '', city: '', apartment_images: [] }

        const images = apt.apartment_images ?? []
        const cover = images.find((img) => img.is_cover) ?? images[0]
        const thumbnailUrl =
          cover?.url ??
          RNImage.resolveAssetSource(DEFAULT_IMAGES.defaultThumbnail).uri

        return {
          id: t.id,
          name: apt.name,
          city: apt.city,
          barangay: apt.barangay,
          leaseStartMonth: formatMonth(t.lease_start),
          leaseStartYear: formatYear(t.lease_start),
          leaseEndMonth: formatMonth(t.lease_end),
          leaseEndYear: formatYear(t.lease_end),
          thumbnailUrl,
        }
      })

      setPastApartments(mapped)
    } catch (err) {
      console.error('Error fetching tenant profile:', err)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useFocusEffect(
    useCallback(() => {
      void fetchTenantProfile()
    }, [fetchTenantProfile])
  )

  return { profile, pastApartments, loading, refetch: fetchTenantProfile }
}