import { useQuery } from '@tanstack/react-query'
import { supabase } from '@repo/supabase'

export const getPayoutBalancesQueryKey = () => ['payout-balances'] as const

type Balances = {
  available: number
  upcoming: number
  inTransit: number
  minPayoutAmount: number
  transferFee: number
}

async function fetchBalances(): Promise<Balances> {
  const nowIso = new Date().toISOString()

  const [{ data: config }, { data: pendingPayouts }, { data: eligibleNow }, { data: upcomingRows }] = await Promise.all([
    supabase.from('payout_config').select('transfer_fee, min_payout_amount').eq('id', 1).maybeSingle(),
    supabase.from('payout').select('net_amount').in('status', ['pending', 'processing']),
    supabase
      .from('payment')
      .select('amount')
      .eq('status', 'paid')
      .is('payout_id', null)
      .lte('payout_eligible_at', nowIso)
      .lt('payout_attempts', 3)
      .in('method', ['gcash', 'maya', 'card', 'qrph']),
    supabase
      .from('payment')
      .select('amount')
      .eq('status', 'paid')
      .is('payout_id', null)
      .gt('payout_eligible_at', nowIso)
      .lt('payout_attempts', 3)
      .in('method', ['gcash', 'maya', 'card', 'qrph']),
  ])

  const availableGross = (eligibleNow ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0)
  const min = Number((config as any)?.min_payout_amount ?? 100)
  const fee = Number((config as any)?.transfer_fee ?? 10)
  const available = availableGross >= min ? availableGross - fee : 0
  const upcoming = (upcomingRows ?? []).reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0)
  const inTransit = (pendingPayouts ?? []).reduce((s: number, r: any) => s + Number(r.net_amount ?? 0), 0)

  return { available, upcoming, inTransit, minPayoutAmount: min, transferFee: fee }
}

export function usePayoutBalances() {
  return useQuery({
    queryKey: getPayoutBalancesQueryKey(),
    queryFn: fetchBalances,
    staleTime: 30_000,
  })
}
