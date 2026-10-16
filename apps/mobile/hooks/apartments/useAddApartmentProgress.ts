import { useEffect } from 'react'

import { useApartmentFormStore } from '@/stores/useApartmentFormStore'

/**
 * Records that the landlord reached `step` (every earlier step passed its
 * checks, since Next only moves on after them) and returns the furthest step
 * reached, which the progress bar uses to allow jumping forward again.
 */
export function useAddApartmentProgress(step: number): number {
  const furthestStep = useApartmentFormStore((s) => s.furthestStep)
  const reachStep = useApartmentFormStore((s) => s.reachStep)

  useEffect(() => {
    reachStep(step)
  }, [reachStep, step])

  return Math.max(furthestStep, step)
}
