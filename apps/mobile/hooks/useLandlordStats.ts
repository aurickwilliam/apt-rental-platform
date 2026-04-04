import { useEffect, useState } from 'react'
import { supabase } from '@repo/supabase'

type LandlordStats = {
  averageRating: number
  totalProperties: number
}

export function useLandlordStats(landlordId: string | undefined) {
  const [stats, setStats] = useState<LandlordStats>({ averageRating: 0, totalProperties: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!landlordId) {
      setLoading(false)
      return
    }

    async function fetchStats() {
      try {
        const { data: apartments } = await supabase
          .from('apartments')
          .select('average_rating')
          .eq('landlord_id', landlordId!)
          .is('deleted_at', null)

        const totalProperties = apartments?.length ?? 0
        const validRatings = apartments
          ?.map(a => a.average_rating)
          .filter((r): r is number => r !== null && r !== undefined) ?? []

        const averageRating = validRatings.length > 0
          ? Math.round((validRatings.reduce((sum, r) => sum + r, 0) / validRatings.length) * 10) / 10
          : 0

        setStats({ averageRating, totalProperties })
      } catch (err) {
        console.error('useLandlordStats error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [landlordId])

  return { stats, loading }
}