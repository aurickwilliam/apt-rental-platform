import { supabase } from '@repo/supabase';
import type { TutorialPortal, TutorialProgressRow } from '@repo/utils';

export type TutorialOutcome = 'completed' | 'skipped';

/** The saved progress for one portal, or null when the tour was never finished. */
export async function fetchTutorialProgress(
  profileId: string,
  portal: TutorialPortal,
): Promise<TutorialProgressRow | null> {
  const { data, error } = await supabase
    .from('tutorial_progress')
    .select('completed_at, skipped_at')
    .eq('user_id', profileId)
    .eq('portal', portal)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

/**
 * Remembers how the tour ended. The upsert writes only the column for this
 * outcome, so skipping later never erases an earlier completion.
 */
export async function saveTutorialOutcome(
  profileId: string,
  portal: TutorialPortal,
  outcome: TutorialOutcome,
): Promise<TutorialProgressRow> {
  const now = new Date().toISOString();
  const stamp = outcome === 'completed' ? { completed_at: now } : { skipped_at: now };
  const { data, error } = await supabase
    .from('tutorial_progress')
    .upsert(
      { user_id: profileId, portal, ...stamp, updated_at: now },
      { onConflict: 'user_id,portal' },
    )
    .select('completed_at, skipped_at')
    .single();

  if (error) throw error;
  return data;
}

/** Whether a tenant has a running tenancy (a failed read means "no"). */
export async function fetchHasActiveTenancyAsTenant(tenantId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('tenancies')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
