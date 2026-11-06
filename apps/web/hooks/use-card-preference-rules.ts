"use client";

import { useMemo } from "react";
import { useUser } from "./use-user";
import { cardPreferenceRules } from "@/lib/card-preference-matches";

/** One consumer per list, using the existing account-keyed profile request cache. */
export function useCardPreferenceRules() {
  const { user, profile, loading } = useUser();
  return useMemo(() => !loading && user && profile?.roles.includes("tenant")
    ? cardPreferenceRules(profile.preferences) : [], [loading, user, profile]);
}
