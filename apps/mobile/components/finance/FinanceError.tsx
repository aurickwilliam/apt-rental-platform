import { Text, View } from "react-native";
import { Button } from "heroui-native";

interface FinanceErrorProps {
  onRetry: () => void;
  message?: string;
}

export default function FinanceError({
  onRetry,
  message = "We couldn’t load this information.",
}: FinanceErrorProps) {
  return (
    <View className="gap-3 py-3">
      <Text
        accessibilityRole="alert"
        selectable
        className="font-inter text-sm text-danger"
      >
        {message}
      </Text>
      <Button variant="secondary" onPress={onRetry}>
        <Button.Label>Try again</Button.Label>
      </Button>
    </View>
  );
}
