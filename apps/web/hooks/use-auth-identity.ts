"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@repo/supabase/browser";

/** Local session identity retires presentation; it never authorizes a request. */
export function useAuthIdentity(initialAuthUserId?: string) {
  const [identity, setIdentity] = useState<{ authUserId: string | null | undefined; generation: number }>(() => ({ authUserId: initialAuthUserId, generation: 0 }));
  const current = useRef(identity);

  useEffect(() => {
    const { data: { subscription } } = createClient().auth.onAuthStateChange((event, session) => {
      const authUserId = session?.user.id ?? null;
      if (authUserId === current.current.authUserId && event !== "USER_UPDATED") return;
      const next = { authUserId, generation: current.current.generation + 1 };
      current.current = next;
      setIdentity(next);
    });
    return () => subscription.unsubscribe();
  }, []);

  return identity;
}
