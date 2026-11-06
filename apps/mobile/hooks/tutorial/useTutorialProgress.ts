import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { TutorialPortal, TutorialProgressRow } from '@repo/utils';
import {
  fetchHasActiveTenancyAsTenant,
  fetchTutorialProgress,
  saveTutorialOutcome,
  type TutorialOutcome,
} from '@/service/tutorial/tutorialService';
import { fetchHasActiveTenancyAsLandlord } from '@/service/landlord/activeTenancyService';

export const getTutorialProgressQueryKey = (profileId: string, portal: TutorialPortal) =>
  ['tutorial-progress', profileId, portal] as const;

const getTutorialTenancyQueryKey = (profileId: string, portal: TutorialPortal) =>
  ['tutorial-active-tenancy', profileId, portal] as const;

/**
 * Saved tour progress for one account and portal, plus whether that account
 * has a running tenancy (it decides which steps are usable). Keys carry the
 * internal profile id, so a different account never sees another's state.
 */
export function useTutorialProgress(profileId: string | null, portal: TutorialPortal | null) {
  const queryClient = useQueryClient();
  const enabled = profileId !== null && portal !== null;

  const progressQuery = useQuery({
    queryKey: getTutorialProgressQueryKey(profileId as string, portal as TutorialPortal),
    queryFn: () => fetchTutorialProgress(profileId as string, portal as TutorialPortal),
    enabled,
    staleTime: Infinity,
  });

  const tenancyQuery = useQuery({
    queryKey: getTutorialTenancyQueryKey(profileId as string, portal as TutorialPortal),
    queryFn: () =>
      portal === 'tenant'
        ? fetchHasActiveTenancyAsTenant(profileId as string)
        : fetchHasActiveTenancyAsLandlord(profileId as string),
    enabled,
  });

  const saveOutcome = useMutation({
    mutationFn: (outcome: TutorialOutcome) =>
      saveTutorialOutcome(profileId as string, portal as TutorialPortal, outcome),
    onSuccess: (row: TutorialProgressRow) => {
      if (enabled) {
        queryClient.setQueryData(
          getTutorialProgressQueryKey(profileId as string, portal as TutorialPortal),
          row,
        );
      }
    },
    onError: (error) => {
      console.error('Could not save tutorial progress', error);
    },
  });

  return {
    progress: progressQuery.data ?? null,
    // A failed read is "not loaded": the tour then never starts by itself.
    progressLoaded: progressQuery.isSuccess,
    tenancySettled: tenancyQuery.isSuccess || tenancyQuery.isError,
    hasActiveTenancy: tenancyQuery.data ?? false,
    saveOutcome: saveOutcome.mutate,
  };
}
