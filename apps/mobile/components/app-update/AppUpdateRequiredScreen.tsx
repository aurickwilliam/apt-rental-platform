import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "heroui-native";
import { IconDownload } from "@tabler/icons-react-native";
import { useColors } from "@/hooks/useTheme";

interface AppUpdateRequiredScreenProps {
  installedVersion: string | null;
  latestVersion: string;
  releaseNotes: string | null;
  errorMessage: string | null;
  onUpdate: () => void;
}

/** Covers the whole app: this build is older than the release's required version. */
export default function AppUpdateRequiredScreen({
  installedVersion,
  latestVersion,
  releaseNotes,
  errorMessage,
  onUpdate,
}: AppUpdateRequiredScreenProps) {
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityViewIsModal
      className="bg-background"
      style={[StyleSheet.absoluteFill, { zIndex: 1000, elevation: 1000, paddingTop: insets.top, paddingBottom: insets.bottom }]}
    >
      <ScrollView contentContainerClassName="flex-grow items-center justify-center gap-5 px-6 py-8">
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="size-28 items-center justify-center rounded-full bg-primary-light"
        >
          <IconDownload size={52} color={colors.primary} />
        </View>
        <View className="items-center gap-2">
          <Text accessibilityRole="header" className="text-center font-nunitoBold text-2xl text-foreground">
            Update required
          </Text>
          <Text className="text-center font-inter text-sm leading-5 text-muted">
            {`This version of APT${installedVersion ? ` (${installedVersion})` : ""} is no longer supported. Install version ${latestVersion} to keep using the app.`}
          </Text>
        </View>
        {releaseNotes ? (
          <Text className="w-full rounded-2xl bg-surface p-4 font-inter text-sm leading-5 text-foreground">{releaseNotes}</Text>
        ) : null}
        <Text className="text-center font-inter text-sm leading-5 text-muted">
          Tap Update to download the new APK, then open it to install over your current app. Your account and data stay as they are.
        </Text>
        {errorMessage ? (
          <Text accessibilityRole="alert" className="text-center font-inter text-sm text-danger">{errorMessage}</Text>
        ) : null}
        <Button onPress={onUpdate} className="min-h-12 w-full">
          <IconDownload size={18} color={colors.secondaryForeground} />
          <Button.Label>Update</Button.Label>
        </Button>
      </ScrollView>
    </View>
  );
}
