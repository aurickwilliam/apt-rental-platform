import { Stack } from "expo-router"
import { useEffect } from "react";
import { useTenancyStore } from '@/store/useTenancyStore';


export default function TenantLayout() {
  useEffect(() => {
    useTenancyStore.getState().fetchTenancy();
  }, []);
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="current-apartment"/>
      <Stack.Screen name="edit-profile"/>
      <Stack.Screen name="current-lease"/>
      <Stack.Screen name="favorites"/>
    </Stack>
  )
}