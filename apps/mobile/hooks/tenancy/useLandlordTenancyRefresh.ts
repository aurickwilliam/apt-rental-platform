import { useCallback } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { usePortalStore } from "@/stores/usePortalStore";
import { getLandlordTenancyQueryKey } from "./useLandlordTenancy";

// Web uploads and tenant confirmations can happen while this screen is away.
export function useLandlordTenancyRefresh(apartmentId: string | undefined) {
  const client = useQueryClient();
  const refresh = useCallback(() => {
    if (!apartmentId || usePortalStore.getState().portal !== "landlord") return;
    void client.invalidateQueries({ queryKey: getLandlordTenancyQueryKey(apartmentId), exact: true }, { cancelRefetch: false });
  }, [apartmentId, client]);
  useFocusEffect(useCallback(() => {
    if (!apartmentId) return;
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => subscription.remove();
  }, [apartmentId, refresh]));
}
