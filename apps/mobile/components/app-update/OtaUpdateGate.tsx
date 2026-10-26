import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconRefresh } from "@tabler/icons-react-native";
import AppDialog from "@/components/display/AppDialog";
import { useOtaUpdate } from "@/hooks/appRelease/useOtaUpdate";
import { useColors } from "@/hooks/useTheme";

/** Mounted once at the root: an over-the-air update has been downloaded and a restart applies it. */
export default function OtaUpdateGate() {
  const { colors } = useColors();
  const { isReady, restart, defer } = useOtaUpdate();
  if (!isReady) return null;

  return (
    <AppDialog
      isOpen
      onOpenChange={open => { if (!open) defer(); }}
      title="Update ready"
      description="A new version of APT has been downloaded."
      footer={
        <View className="gap-2">
          <Button onPress={restart} className="min-h-12">
            <IconRefresh size={18} color={colors.secondaryForeground} />
            <Button.Label>Restart now</Button.Label>
          </Button>
          <Button variant="secondary" onPress={defer} className="min-h-12">
            <Button.Label>Later</Button.Label>
          </Button>
        </View>
      }
    >
      <Text className="font-inter text-sm leading-5 text-muted">
        Restart the app to start using it. If you pick Later, it applies the next time you open APT.
      </Text>
    </AppDialog>
  );
}
