"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@repo/supabase";

type SupabaseClient = ReturnType<typeof createBrowserClient>;
type UserResponse = Awaited<ReturnType<SupabaseClient["auth"]["getUser"]>>;
type User = UserResponse["data"]["user"];

export function useUser() {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Get the initial user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Subscribe to auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, loading };
}
