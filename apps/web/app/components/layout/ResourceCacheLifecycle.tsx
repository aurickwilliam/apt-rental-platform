"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@repo/supabase/browser";
import { getBrowserResourceCache } from "@/lib/browser-resource-cache";

/** One browser Auth subscription; route props never authorize cache ownership. */
export default function ResourceCacheLifecycle() {
  const pathname = usePathname();
  const lifecycle = useRef({ sequence: 0 });

  useEffect(() => {
    const state = lifecycle.current;
    const cache = getBrowserResourceCache();
    const supabase = createClient();
    let disposed = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (disposed) return;
      state.sequence++;
      if (event === "SIGNED_OUT" || event === "USER_UPDATED") cache?.reset();
      cache?.setAccount(session?.user.id ?? null);
    });
    // Server actions update cookies without broadcasting browser Auth events.
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") channel = new BroadcastChannel("apt-resource-session");
    } catch {
      console.warn("Cross-tab resource reset unavailable; session checks remain active.");
    }
    if (channel) channel.onmessage = () => { if (!disposed) { state.sequence++; cache?.reset(); } };
    const onFocus = () => {
      const request = ++state.sequence;
      void supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!disposed && request === state.sequence) cache?.setAccount(error ? null : session?.user.id ?? null);
      }).catch(() => {
        if (!disposed && request === state.sequence) {
          console.warn("Resource session check failed; retained data discarded.");
          cache?.reset();
        }
      });
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("pageshow", onFocus);
    return () => {
      disposed = true;
      state.sequence++;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("pageshow", onFocus);
      channel?.close();
      subscription.unsubscribe();
      cache?.reset();
    };
  }, []);

  useEffect(() => {
    const state = lifecycle.current;
    const cache = getBrowserResourceCache();
    const request = ++state.sequence;
    // Recovery/suspension/server-action sign-outs must retire retained data too.
    if (/^\/(sign-in|sign-up|sign-up-form|forgot-password|suspended)(\/|$)/.test(pathname)) {
      cache?.reset();
      return;
    }
    // Local cookie/session read only, not a substitute for server guards or RLS.
    void createClient().auth.getSession().then(({ data: { session }, error }) => {
      if (request === state.sequence) cache?.setAccount(error ? null : session?.user.id ?? null);
    }).catch(() => {
      if (request === state.sequence) {
        console.warn("Resource session check failed; retained data discarded.");
        cache?.reset();
      }
    });
    return () => { state.sequence++; };
  }, [pathname]);

  return null;
}
