"use client";
import { useCallback, useEffect, useState } from "react";
import type { Database } from "@repo/supabase";
import { createClient as createBrowserClient } from "@repo/supabase/browser";

import { PROFILE_PHOTO_UPDATED_EVENT } from "@/app/components/profile/use-profile-photo";
import { RequestCache } from "@/lib/profile-request-cache";

type SupabaseClient = ReturnType<typeof createBrowserClient>;
type UserResponse = Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>;
type User = UserResponse["data"]["user"];
type Preferences = Database["public"]["Tables"]["users"]["Row"]["preferences"];

type Profile = {
  id: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  mobile_number: string | null;
  roles: string[];
  preferences: Preferences;
};

interface Snapshot {
  /** Auth user id the snapshot was verified for (null when signed out). */
  userId: string | null;
  user: User;
  profile: Profile | null;
}

/** Signed-out snapshots share one cache entry (never mixed with user keys). */
const SIGNED_OUT_KEY = "";

/**
 * Resolved-snapshot reuse window. Matches mobile's 30s server-data staleTime:
 * concurrent mounts share one request and immediate remounts cost nothing,
 * while roles/preferences still converge quickly without re-login.
 */
const SNAPSHOT_TTL_MS = 30_000;

function keyFor(userId: string | null): string {
  return userId ?? SIGNED_OUT_KEY;
}

function mapProfile(profileData: unknown, authUser: User): Profile {
  const data = profileData as unknown as Profile | null;
  return {
    id: data?.id ?? null,
    first_name: data?.first_name ?? null,
    last_name: data?.last_name ?? null,
    avatar_url: data?.avatar_url ?? authUser?.user_metadata?.avatar_url ?? null,
    mobile_number: data?.mobile_number ?? null,
    preferences: data?.preferences ?? null,
    roles: data?.roles ?? [],
  };
}

/** The session changed between key derivation and network validation. */
export class SnapshotKeyMismatch extends Error {
  constructor(readonly resolvedUserId: string | null) {
    super("auth session changed during profile load");
  }
}

async function fetchSnapshot(userId: string | null): Promise<Snapshot> {
  const supabase = createBrowserClient();
  // getUser (not getSession) is the authoritative, network-validated check.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const resolvedId = user?.id ?? null;
  if (resolvedId !== userId) {
    // Never serve this result under the requested key — it belongs to a
    // different account (or session state). The caller retries once with
    // the corrected key; rejections are never cached.
    throw new SnapshotKeyMismatch(resolvedId);
  }
  let profile: Profile | null = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('users')
      .select('id, first_name, last_name, avatar_url, mobile_number, preferences, roles')
      .eq('user_id', user.id)
      .single();
    profile = mapProfile(profileData, user);
  }
  return { userId: resolvedId, user, profile };
}

const snapshots = new RequestCache<Snapshot>(fetchSnapshot, {
  staleTimeMs: SNAPSHOT_TTL_MS,
});

async function loadSnapshot(userId: string | null): Promise<Snapshot> {
  try {
    return await snapshots.get(keyFor(userId));
  } catch (err) {
    if (err instanceof SnapshotKeyMismatch) {
      return snapshots.get(keyFor(err.resolvedUserId));
    }
    throw err;
  }
}

/** Local session read (no network) used to verify a snapshot is still ours. */
async function currentSessionUserId(
  supabase: SupabaseClient,
): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

export function useUser() {
  const [user, setUser] = useState<User>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const applySnapshot = useCallback((snap: Snapshot) => {
    setUser(snap.user);
    setProfile(snap.profile);
    setLoading(false);
  }, []);

  const loadForUser = useCallback(
    async (supabase: SupabaseClient, userId: string | null) => {
      const snap = await loadSnapshot(userId);
      // The account may have switched mid-flight: confirm against the
      // local session before touching state, so a stale resolution can
      // never repopulate this instance. The auth subscription below drives
      // the correct load for the new account.
      if ((await currentSessionUserId(supabase)) !== snap.userId) {
        snapshots.invalidate();
        return null;
      }
      return snap;
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    const supabase = createBrowserClient();

    void (async () => {
      try {
        // Local session read picks the cache key with no network: warm
        // mounts reuse a recent snapshot, cold mounts share one request.
        const userId = await currentSessionUserId(supabase);
        const snap = await loadForUser(supabase, userId);
        if (!cancelled && snap) applySnapshot(snap);
        else if (!cancelled && !snap) setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        snapshots.invalidate();
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      // A changed user record (display name, avatar) invalidates that
      // account's entry so the reload below is fresh; token refreshes keep
      // the cache since the account is unchanged.
      if (event === "USER_UPDATED") snapshots.invalidate(keyFor(session.user.id));
      void (async () => {
        try {
          const snap = await loadForUser(supabase, session.user.id);
          if (!cancelled && snap) applySnapshot(snap);
        } catch {
          // Keep previous state; a later event retries the load.
        }
      })();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applySnapshot, loadForUser]);

  // Refresh client profile (e.g. navbar avatar) right after a photo
  // upload/remove without waiting for a navigation or reload. The entry
  // is invalidated first so every instance reloads the fresh row through
  // one shared request.
  useEffect(() => {
    const onPhotoUpdated = () => {
      void (async () => {
        const supabase = createBrowserClient();
        const {
          data: { user: current },
        } = await supabase.auth.getUser();
        if (!current) return;
        snapshots.invalidate(keyFor(current.id));
        try {
          const snap = await loadForUser(supabase, current.id);
          if (snap) applySnapshot(snap);
        } catch {
          // Keep previous state; next mount reloads.
        }
      })();
    };
    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, onPhotoUpdated);
    return () => window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, onPhotoUpdated);
  }, [applySnapshot, loadForUser]);

  return { user, profile, loading };
}
