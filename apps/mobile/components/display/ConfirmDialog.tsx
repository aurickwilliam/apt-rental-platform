import { View, Text } from 'react-native'
import { Button, Dialog } from 'heroui-native'

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  confirmVariant?: 'danger' | 'primary' | 'secondary'
  onConfirm: () => void
  errorMessage?: string | null
  isConfirmDisabled?: boolean
  cancelLabel?: string
}

export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  errorMessage,
  isConfirmDisabled,
  cancelLabel = 'Cancel',
}: Props) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Close variant="ghost" className="absolute top-4 right-4" />
          <View className="mb-5 gap-1.5">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description>{description}</Dialog.Description>
            {errorMessage && (
              <Text className="text-sm text-danger mt-1">
                {errorMessage}
              </Text>
            )}
          </View>
          <View className="flex-row justify-end gap-3">
            <Button variant="ghost" size="sm" onPress={() => onOpenChange(false)}>
              {cancelLabel}
            </Button>
            <Button
              size="sm"
              variant={confirmVariant}
              onPress={onConfirm}
              isDisabled={isConfirmDisabled}
            >
              {confirmLabel}
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
