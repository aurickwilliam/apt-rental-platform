"use client";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@repo/supabase";

type SupabaseClient = ReturnType<typeof createBrowserClient>;
type UserResponse = Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>;
type User = UserResponse["data"]["user"];

type Profile = {
  id: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  mobile_number: string | null;
  roles: string[];
};

export function useUser() {
  const [user, setUser] = useState<User>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    const fetchUserAndProfile = async (userId: string, authUser: User) => {
      const { data: profileData } = await supabase
        .from('users')
        .select('id, first_name, last_name, avatar_url, mobile_number, roles')
        .eq('user_id', userId)
        .single();
      const data = profileData as unknown as Profile | null;

      setProfile({
        id: data?.id ?? null,
        first_name: data?.first_name ?? null,
        last_name: data?.last_name ?? null,
        avatar_url: data?.avatar_url ?? authUser?.user_metadata?.avatar_url ?? null,
        mobile_number: data?.mobile_number ?? null,
        roles: data?.roles ?? [],
      });
    };

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
  }, []);

  return { user, profile, loading };
}
