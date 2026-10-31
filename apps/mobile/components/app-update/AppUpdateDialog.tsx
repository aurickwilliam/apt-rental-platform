import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconDownload } from "@tabler/icons-react-native";
import AppDialog from "@/components/display/AppDialog";
import { useColors } from "@/hooks/useTheme";

interface AppUpdateDialogProps {
  latestVersion: string;
  releaseNotes: string | null;
  errorMessage: string | null;
  onUpdate: () => void;
  onDismiss: () => void;
}

/**
 * The optional prompt: a newer build exists, but this one still works. Only the
 * buttons close it, so a stray tap outside can't silently mark the version as dismissed.
 */
export default function AppUpdateDialog({ latestVersion, releaseNotes, errorMessage, onUpdate, onDismiss }: AppUpdateDialogProps) {
  const { colors } = useColors();
  return (
    <AppDialog
      isOpen
      dismissible={false}
      onOpenChange={() => {}}
      title="A new version is available"
      description={`APT ${latestVersion} is ready to install.`}
      scrollable
      footer={
        <View className="gap-2">
          <Button onPress={onUpdate} className="min-h-12">
            <IconDownload size={18} color={colors.secondaryForeground} />
            <Button.Label>Update</Button.Label>
          </Button>
          <Button variant="secondary" onPress={onDismiss} className="min-h-12">
            <Button.Label>Maybe later</Button.Label>
          </Button>
        </View>
      }
    >
      <View className="gap-3">
        {releaseNotes ? (
          <Text className="font-inter text-sm leading-5 text-foreground">{releaseNotes}</Text>
        ) : null}
        <Text className="font-inter text-sm leading-5 text-muted">
          Tap Update to download the new APK, then open it to install over your current app. Your account and data stay as they are.
        </Text>
        {errorMessage ? (
          <Text accessibilityRole="alert" className="font-inter text-sm text-danger">{errorMessage}</Text>
        ) : null}
      </View>
    </AppDialog>
  );
}
