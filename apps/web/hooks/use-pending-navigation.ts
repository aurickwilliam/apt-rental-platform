"use client";

import { useCallback, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";

/** Dropdown actions aren't Links; keep feedback tied to the router transition. */
export function usePendingNavigation() {
  const router = useRouter();
  const [pendingHref, setPendingHref] = useOptimistic<string | null>(null);
  const [, startTransition] = useTransition();
  const navigate = useCallback((href: string) => {
    startTransition(() => {
      setPendingHref(href);
      router.push(href);
    });
  }, [router, setPendingHref]);
  return { pendingHref, navigate };
}
