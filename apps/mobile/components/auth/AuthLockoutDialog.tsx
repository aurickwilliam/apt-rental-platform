import { Text, View } from "react-native";

import { IconLock } from "@tabler/icons-react-native";
import { Button } from "heroui-native";

import { AUTH_LOCKOUT_TITLE, formatLockoutClock, lockoutDescription } from "@repo/utils";

import AppDialog from "@/components/display/AppDialog";
import { useColors } from "@/hooks/useTheme";

interface AuthLockoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Seconds left on the lock; the countdown follows it. */
  secondsLeft: number;
}

// Shown when sign-in or a code screen hits the attempt limit. The button behind
// it stays disabled with the same countdown until the lock ends.
export default function AuthLockoutDialog({ isOpen, onOpenChange, secondsLeft }: AuthLockoutDialogProps) {
  const { colors } = useColors();

  return (
    <AppDialog
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={AUTH_LOCKOUT_TITLE}
      titleIcon={<IconLock size={20} color={colors.danger} />}
      description={lockoutDescription(secondsLeft)}
      footer={
        <View className="flex-row justify-end">
          <Button size="sm" variant="secondary" onPress={() => onOpenChange(false)}>
            <Button.Label>Got it</Button.Label>
          </Button>
        </View>
      }
    >
      <Text className="text-foreground font-inter" accessibilityRole="timer">
        You can try again in{" "}
        <Text className="font-nunitoBold">{formatLockoutClock(secondsLeft)}</Text>
      </Text>
    </AppDialog>
  );
}
