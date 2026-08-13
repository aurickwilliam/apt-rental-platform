import { useCurrentUser } from "./useCurrentUser";

export type { UserProfile } from "@/service/currentUserService";

export function useProfile() {
  const { data, isLoading, refetch } = useCurrentUser();

  return {
    profile: data ?? null,
    loading: isLoading,
    refetch,
  };
}
