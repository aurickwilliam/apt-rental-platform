import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "heroui-native";
import { IconKey } from "@tabler/icons-react-native";

import ConfirmDialog from "@/components/display/ConfirmDialog";
import { useAddRole } from "@/hooks/auth/useAddRole";
import { useColors } from "@/hooks/useTheme";
import { portalHome, type Portal } from "@/service/auth/portalPreference";
import { usePortalStore } from "@/stores/usePortalStore";

interface AddRoleCardProps {
  authUserId: string | null | undefined;
  roles: readonly string[];
  currentPortal: Portal;
}

// Lets a single-role account add the other portal's role. Renders nothing once
// the account holds it. Confirming grants the role, then opens that portal.
export default function AddRoleCard({ authUserId, roles, currentPortal }: AddRoleCardProps) {
  const router = useRouter();
  const { colors } = useColors();
  const { mutateAsync, isPending, error, reset } = useAddRole();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const targetRole: Portal = currentPortal === "tenant" ? "landlord" : "tenant";

  if (!authUserId || !roles.includes(currentPortal) || roles.includes(targetRole)) return null;

  const targetLabel = targetRole === "landlord" ? "Landlord" : "Tenant";
  const keptLabel = currentPortal === "landlord" ? "Landlord" : "Tenant";

  const handleOpenChange = (open: boolean) => {
    if (!open) reset();
    setConfirmOpen(open);
  };

  const handleConfirm = async () => {
    try {
      const nextRoles = await mutateAsync(targetRole);
      await usePortalStore.getState().switchTo(authUserId, nextRoles, targetRole);
      setConfirmOpen(false);
      router.replace(portalHome(targetRole));
    } catch {
      // The hook keeps the message; the dialog shows it and stays open.
    }
  };

  return (
    <View className="px-5 pt-5 gap-2">
      <View className="flex-row items-center gap-2">
        <IconKey size={18} color={colors.primary} />
        <Text className="font-nunitoBold text-base text-foreground">Account roles</Text>
      </View>
      <Text className="text-sm text-muted">
        Add {targetLabel.toLowerCase()} access to use this account as {targetRole === "landlord" ? "an owner" : "a renter"} too.
        No re-registration needed.
      </Text>
      <Button variant="secondary" onPress={() => setConfirmOpen(true)} accessibilityLabel={`Add ${targetLabel} access`}>
        <Button.Label className="font-nunitoSemiBold">Add {targetLabel} access</Button.Label>
      </Button>

      <ConfirmDialog
        isOpen={confirmOpen}
        onOpenChange={handleOpenChange}
        title={`Add ${targetLabel} access?`}
        description={`Your ${keptLabel} access will remain active.`}
        confirmLabel={isPending ? "Adding..." : `Add ${targetLabel} access`}
        confirmVariant="primary"
        onConfirm={handleConfirm}
        errorMessage={error?.message ?? null}
        isPending={isPending}
      />
    </View>
  );
}
