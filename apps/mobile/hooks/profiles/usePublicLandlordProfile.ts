import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { supabase } from '@repo/supabase'

import { useLandlordStats } from 'hooks/landlord'
import { useLandlordReviews } from 'hooks/ratings'

import type { ApartmentCardProps } from 'components/cards/ApartmentCard'

export type LandlordProfileData = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  mobile_number: string | null
  avatar_url: string | null
  background_url: string | null
  account_status: string | null
  street_address: string | null
  barangay: string | null
  city: string | null
  province: string | null
  created_at: string | null
}

type LandlordListing = ApartmentCardProps

export function usePublicLandlordProfile(landlordId?: string) {
  const { stats, refetch: refetchStats } = useLandlordStats(landlordId)
  const { reviews, totalReviews, loading: reviewsLoading } = useLandlordReviews(landlordId)

  const [profile, setProfile] = useState<LandlordProfileData | null>(null)
  const [listings, setListings] = useState<LandlordListing[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async () => {
    if (!landlordId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('users')
      .select(
        'id, first_name, last_name, email, mobile_number, avatar_url, background_url, account_status, street_address, barangay, city, province, created_at'
      )
      .eq('id', landlordId)
      .returns<LandlordProfileData>()
      .single()

    if (error) {
      console.error('Error fetching landlord profile:', error)
    } else {
      setProfile(data)
    }

    setLoading(false)
  }, [landlordId])

  const fetchListings = useCallback(async () => {
    if (!landlordId) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('apartments')
      .select(
        `
          id,
          name,
          monthly_rent,
          no_bedrooms,
          no_bathrooms,
          area_sqm,
          average_rating,
          barangay,
          city,
          apartment_images (
            url,
            is_cover,
            created_at
          )
        `
      )
      .eq('landlord_id', landlordId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching landlord listings:', error)
      setListings([])
      setLoading(false)
      return
    }

    const mapped = ((data ?? []) as unknown as {
      id: string
      name: string
      monthly_rent: number
      no_bedrooms: number
      no_bathrooms: number
      area_sqm: number
      average_rating: number | null
      barangay: string
      city: string
      apartment_images: { url: string; is_cover: boolean | null; created_at: string | null }[]
    }[]).map((apt): LandlordListing => {
      const images = apt.apartment_images ?? []
      const thumbnailUrl =
        images.find((img) => img.is_cover)?.url ??
        images
          .slice()
          .sort(
            (a, b) =>
              new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
          )[0]?.url ??
        undefined

      return {
        id: apt.id,
        thumbnail: thumbnailUrl ? { uri: thumbnailUrl } : undefined,
        name: apt.name,
        location: `${apt.barangay}, ${apt.city}`,
        ratings: apt.average_rating?.toFixed(1) ?? '0.0',
        monthlyRent: apt.monthly_rent,
        noBedroom: apt.no_bedrooms,
        noBathroom: apt.no_bathrooms,
        areaSqm: apt.area_sqm,
        isFavorite: false,
        isGrid: true,
      }
    })

    setListings(mapped)
    setLoading(false)
  }, [landlordId])

  const refetch = useCallback(async () => {
    await Promise.all([fetchProfile(), fetchListings(), refetchStats()])
  }, [fetchProfile, fetchListings, refetchStats])

  useFocusEffect(
    useCallback(() => {
      void refetch()
    }, [refetch])
  )

  return {
    profile,
    listings,
    stats,
    reviews,
    totalReviews,
    loading,
    reviewsLoading,
    refetch,
  }
}