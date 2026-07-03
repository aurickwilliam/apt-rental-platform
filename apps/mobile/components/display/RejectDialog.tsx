import { View } from 'react-native'
import { useState } from 'react'
import { Dialog, Button, TextArea, TextField } from 'heroui-native'

type RejectDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
}

export default function RejectDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title = "Reject Application",
  description = "Provide a reason for rejection (optional). This will be visible to the tenant.",
  placeholder = "e.g. Insufficient proof of income",
}: RejectDialogProps) {
  const [reason, setReason] = useState('');

  function handleConfirm() {
    onConfirm(reason.trim());
    setReason('');
  }

  function handleClose() {
    setReason('');
    onClose();
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Close variant="ghost" className="absolute top-3 right-3" />
          <View className="mb-5 gap-1.5">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description className="text-muted">
              {description}
            </Dialog.Description>
          </View>
          <TextField isDisabled={isLoading} className="mb-4">
            <TextArea
              placeholder={placeholder}
              value={reason}
              onChangeText={setReason}
              numberOfLines={3}
              className="p-3"
            />
          </TextField>
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="secondary"
              onPress={handleClose}
              isDisabled={isLoading}
              className="flex-1"
            >
              <Button.Label>Cancel</Button.Label>
            </Button>
            <Button
              size="sm"
              variant="danger-soft"
              onPress={handleConfirm}
              isDisabled={isLoading}
              className="flex-1"
            >
              <Button.Label>Reject</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
