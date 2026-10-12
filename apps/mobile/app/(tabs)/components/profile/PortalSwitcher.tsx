import { useState } from "react";
import { Alert, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { IconSwitchHorizontal } from "@tabler/icons-react-native";

import { portalHome, type Portal } from "@/service/auth/portalPreference";
import { useColors } from "@/hooks/useTheme";
import { usePortalStore } from "@/stores/usePortalStore";

interface PortalSwitcherProps {
  authUserId: string | null | undefined;
  roles: readonly string[];
  currentPortal: Portal;
}

export default function PortalSwitcher({ authUserId, roles, currentPortal }: PortalSwitcherProps) {
  const router = useRouter();
  const { colors } = useColors();
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
    <View className="px-5 pt-5">
      <Button
        variant="secondary"
        isDisabled={switching}
        onPress={handleSwitch}
        style={{
          backgroundColor: `${colors.primary}26`,
          borderWidth: 1,
          borderColor: `${colors.primary}80`,
        }}
        accessibilityLabel={`Switch to ${otherPortal} portal`}
      >
        <IconSwitchHorizontal size={18} color={colors.primary} />
        <Button.Label className="font-nunitoSemiBold" style={{ color: colors.primary }}>
          Switch to {otherPortal === "tenant" ? "Tenant" : "Landlord"} portal
        </Button.Label>
      </Button>
    </View>
  );
}
