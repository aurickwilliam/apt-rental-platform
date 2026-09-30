import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";

import { portalHome, type Portal } from "@/service/auth/portalPreference";
import { usePortalStore } from "@/stores/usePortalStore";

interface PortalSwitcherProps {
  authUserId: string | null | undefined;
  roles: readonly string[];
  currentPortal: Portal;
}

export default function PortalSwitcher({ authUserId, roles, currentPortal }: PortalSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const otherPortal: Portal = currentPortal === "tenant" ? "landlord" : "tenant";

  if (!authUserId || !roles.includes(currentPortal) || !roles.includes(otherPortal)) return null;

  const handleSwitch = async () => {
    setSwitching(true);
    try {
      await usePortalStore.getState().switchTo(authUserId, roles, otherPortal);
      router.replace(portalHome(otherPortal));
    } catch (error) {
      console.error("Could not switch portal", error);
      Alert.alert("Could not switch portal", "Please try again.");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View className="px-5 mt-5">
      <Button variant="outline" isDisabled={switching} onPress={handleSwitch} accessibilityLabel={`Switch to ${otherPortal} portal`}>
        <Button.Label>Switch to {otherPortal === "tenant" ? "Tenant" : "Landlord"} portal</Button.Label>
      </Button>
    </View>
  );
}
