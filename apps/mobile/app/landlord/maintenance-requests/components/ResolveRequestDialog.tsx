import { useState } from "react";
import { View } from "react-native";
import {
  Button,
  Dialog,
  FieldError,
  Input,
  Label,
  Spinner,
  TextField,
  useThemeColor,
} from "heroui-native";

type ResolveRequestDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (notes: string) => Promise<boolean> | boolean;
};

export default function ResolveRequestDialog({
  isOpen,
  onOpenChange,
  onConfirm,
}: ResolveRequestDialogProps) {
  const [notes, setNotes] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const accentForeground = useThemeColor("accent-foreground");

  const resetState = () => {
    setNotes("");
    setIsInvalid(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // block dismiss (backdrop/swipe/close button) mid-submit
      if (isSubmitting) return;
      resetState();
    }
    onOpenChange(open);
  };

  const handleConfirm = async () => {
    const trimmed = notes.trim();
    if (!trimmed) {
      setIsInvalid(true);
      return;
    }

    setIsSubmitting(true);
    const success = await onConfirm(trimmed);
    setIsSubmitting(false);

    if (success) {
      resetState();
      onOpenChange(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <View className="mb-5 gap-1.5">
            <View className="flex-row justify-between items-center">
              <Dialog.Title>Resolve Maintenance Request</Dialog.Title>
              <Dialog.Close variant="ghost" isDisabled={isSubmitting} />
            </View>
            <Dialog.Description className="text-sm">
              Add a note on how this issue was fixed before marking it resolved.
            </Dialog.Description>
          </View>

          <TextField isRequired isInvalid={isInvalid} className="mb-5">
            <Label>Resolution Notes:</Label>
            <Input
              placeholder="e.g. Replaced the faulty valve and tested for leaks."
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={(text) => {
                setNotes(text);
                if (isInvalid && text.trim()) setIsInvalid(false);
              }}
              className="min-h-24 p-3"
              textAlignVertical="top"
              editable={!isSubmitting}
            />
            <FieldError>Please enter resolution notes.</FieldError>
          </TextField>

          <View className="flex-row justify-end gap-3">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => handleOpenChange(false)}
              isDisabled={isSubmitting}
            >
              <Button.Label>Cancel</Button.Label>
            </Button>
            <Button
              size="sm"
              onPress={handleConfirm}
              isDisabled={isSubmitting}
              isIconOnly={isSubmitting}
            >
              {isSubmitting ? (
                <Spinner color={accentForeground} />
              ) : (
                <Button.Label>Mark as Resolved</Button.Label>
              )}
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
