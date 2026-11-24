import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Portal } from "@/service/auth/portalPreference";
import { grantRole } from "@/service/auth/roleAccessService";
import { CURRENT_USER_QUERY_KEY } from "@/utils/queryClient";

// Adds the other portal's role to the signed-in account, then refreshes the
// cached profile so every screen sees the new role before the caller switches.
export function useAddRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: Portal): Promise<string[]> => {
      const roles = await grantRole(role);
      await queryClient.refetchQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      return roles;
    },
  });
}
