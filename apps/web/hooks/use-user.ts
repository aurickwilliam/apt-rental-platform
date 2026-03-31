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
  role: string | null;
};

export function useUser() {
  const [user, setUser] = useState<User>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    const fetchUserAndProfile = async (userId: string) => {
      const { data } = await supabase
        .from('users')
        .select('id, first_name, last_name, avatar_url, mobile_number, role')
        .eq('user_id', userId)
        .single();
      setProfile(data);
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) fetchUserAndProfile(user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserAndProfile(session.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  return { user, profile, loading };
}