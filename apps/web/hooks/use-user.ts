"use client";
import { useCallback, useEffect, useState } from "react";
import { createBrowserClient, type Database } from "@repo/supabase";

import { PROFILE_PHOTO_UPDATED_EVENT } from "@/app/components/profile/use-profile-photo";

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

export function useUser() {
  const [user, setUser] = useState<User>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserAndProfile = useCallback(async (userId: string, authUser: User) => {
    const supabase = createBrowserClient();
    const { data: profileData } = await supabase
      .from('users')
      .select('id, first_name, last_name, avatar_url, mobile_number, preferences, roles')
      .eq('user_id', userId)
      .single();
    const data = profileData as unknown as Profile | null;

    setProfile({
      id: data?.id ?? null,
      first_name: data?.first_name ?? null,
      last_name: data?.last_name ?? null,
      avatar_url: data?.avatar_url ?? authUser?.user_metadata?.avatar_url ?? null,
      mobile_number: data?.mobile_number ?? null,
      preferences: data?.preferences ?? null,
      roles: data?.roles ?? [],
    });
  }, []);

  useEffect(() => {
    const supabase = createBrowserClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchUserAndProfile(user.id, user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserAndProfile(session.user.id, session.user);
      else setProfile(null);
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, [fetchUserAndProfile]);

  // Refresh client profile (e.g. navbar avatar) right after a photo
  // upload/remove without waiting for a navigation or reload.
  useEffect(() => {
    const onPhotoUpdated = () => {
      createBrowserClient().auth.getUser().then(({ data: { user: current } }) => {
        if (current) fetchUserAndProfile(current.id, current);
      });
    };
    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, onPhotoUpdated);
    return () => window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, onPhotoUpdated);
  }, [fetchUserAndProfile]);

  return { user, profile, loading };
}