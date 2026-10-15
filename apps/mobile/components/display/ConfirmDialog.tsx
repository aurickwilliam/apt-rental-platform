import { View, Text } from "react-native";
import { Button, Dialog } from "heroui-native";

import { IconCheck } from "@tabler/icons-react-native";

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "danger" | "primary" | "secondary";
  onConfirm: () => void;
  errorMessage?: string | null;
  isConfirmDisabled?: boolean;
  cancelLabel?: string;
  checklistItems?: string[];
};

export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = "danger",
  onConfirm,
  errorMessage,
  isConfirmDisabled,
  cancelLabel = "Cancel",
  checklistItems,
}: Props) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Close variant="ghost" className="absolute top-4 right-4" />
          <View className="mb-5 gap-1.5">
            <Dialog.Title className="font-nunitoBold">{title}</Dialog.Title>
            <Dialog.Description>{description}</Dialog.Description>
            {checklistItems && checklistItems.length > 0 && (
              <View className="mt-2 gap-2">
                {checklistItems.map((item) => (
                  <View key={item} className="flex-row items-center gap-2">
                    <IconCheck size={16} color="#22C55E" />
                    <Text className="flex-1 text-sm text-muted">{item}</Text>
                  </View>
                ))}
              </View>
            )}
            {errorMessage && (
              <Text className="text-sm text-danger mt-1">{errorMessage}</Text>
            )}
          </View>
          <View className="flex-row gap-3">
            <Button
              variant="tertiary"
              size="sm"
              className="flex-1"
              onPress={() => onOpenChange(false)}
            >
              <Button.Label>{cancelLabel}</Button.Label>
            </Button>
            <Button
              size="sm"
              variant={confirmVariant}
              className="flex-1"
              onPress={onConfirm}
              isDisabled={isConfirmDisabled}
            >
              <Button.Label>{confirmLabel}</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
