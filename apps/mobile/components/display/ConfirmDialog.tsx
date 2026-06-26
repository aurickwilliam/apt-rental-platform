import { View } from 'react-native'
import { Button, Dialog } from 'heroui-native'

type Props = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  confirmVariant?: 'danger' | 'primary' | 'secondary'
  onConfirm: () => void
}

export default function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
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
          </View>
          <View className="flex-row justify-end gap-3">
            <Button variant="ghost" size="sm" onPress={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" variant={confirmVariant} onPress={onConfirm}>
              {confirmLabel}
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
