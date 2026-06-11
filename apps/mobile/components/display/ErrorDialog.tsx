import { View } from 'react-native'
import { CircleAlert } from 'lucide-react-native'
import { COLORS } from '@repo/constants'
import {
  Dialog,
  Button,
} from 'heroui-native'

type ErrorDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  message: string | null;
  title?: string;
}

export default function ErrorDialog({ 
  isOpen, 
  onClose, 
  message,
  title = "Something went wrong",
}: ErrorDialogProps) {
  return (
    <Dialog isOpen={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Close variant="ghost" className="absolute top-3 right-3" />

          <View className="mb-5 gap-1.5">
            <View className="flex-row items-center gap-2">
              <CircleAlert size={20} color={COLORS.lightRedHead} />
              <Dialog.Title className="text-redHead-100">
                {title}
              </Dialog.Title>
            </View>
            <Dialog.Description>{message}</Dialog.Description>
          </View>

          <View className="flex-row justify-end">
            <Button size="sm" onPress={onClose} variant="secondary">
              <Button.Label>Dismiss</Button.Label>
            </Button>
          </View>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}