import type { RentalsLayoutHint } from '@/service/tenancy/rentalsLayoutHint';

export type RentalsView = 'loading' | 'error' | 'tenancy' | 'applications';
export type RentalsSkeleton = RentalsLayoutHint | 'none';

// Which skeleton to show while loading: the page this account saw last time.
// While the on-device hint is still being read (a few milliseconds, only when
// boot didn't preload it) nothing is drawn, so the skeleton never swaps shape.
export function getRentalsSkeleton(
  hint: RentalsLayoutHint | null,
  isHintReady: boolean,
): RentalsSkeleton {
  if (!isHintReady) return 'none';
  return hint ?? 'tenancy';
}

// The page to remember for next launch, once the real answer is on screen.
export function getRentalsLayoutToRemember(view: RentalsView): RentalsLayoutHint | null {
  return view === 'tenancy' || view === 'applications' ? view : null;
}

export interface RentalsViewInput {
  hasTenancy: boolean;
  tenancyLoading: boolean;
  tenancyError: string | null;
  applicationsLoading: boolean;
  applicationsError: string | null;
  // Queries that only start once the tenancy is known (maintenance, payments).
  tenancyDetailsLoading: boolean;
}

// Decides which Rentals screen to render. Everything the first paint needs is
// loaded behind one skeleton, so sections never pop in or change state after
// the page appears, and a failed fetch never looks like "no rental".
export function getRentalsView({
  hasTenancy,
  tenancyLoading,
  tenancyError,
  applicationsLoading,
  applicationsError,
  tenancyDetailsLoading,
}: RentalsViewInput): RentalsView {
  if (tenancyLoading || applicationsLoading) return 'loading';

  if (hasTenancy) return tenancyDetailsLoading ? 'loading' : 'tenancy';

  if (tenancyError || applicationsError) return 'error';

  return 'applications';
}
