import { Text, View } from "react-native";
import { Button } from "heroui-native";
import { IconHomeHeart } from "@tabler/icons-react-native";
import AppDialog from "@/components/display/AppDialog";
import { useColors } from "@/hooks/useTheme";

interface WelcomeDialogProps {
  isOpen: boolean;
  onContinue: () => void;
}

const IGNORE_OPEN_CHANGE = () => {};

export default function WelcomeDialog({ isOpen, onContinue }: WelcomeDialogProps) {
  const { colors } = useColors();

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={IGNORE_OPEN_CHANGE}
      dismissible={false}
      title="Welcome to APT!"
      titleLayout="centered"
      titleIllustration={
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          className="size-24 items-center justify-center rounded-full bg-primary-light"
        >
          <IconHomeHeart size={48} color={colors.primary} />
        </View>
      }
      fitToViewport
      footer={
        <View className="gap-3">
          <Button onPress={onContinue} className="min-h-12">
            <Button.Label>Continue</Button.Label>
          </Button>
          <Text className="text-center font-inter text-xs leading-4 text-muted">
            Change your preferences anytime in Settings.
          </Text>
        </View>
      }
    >
      <Text className="text-center font-inter text-base leading-6 text-muted">
        Your account is ready. Let’s start your rental journey!
      </Text>
    </AppDialog>
  );
}
