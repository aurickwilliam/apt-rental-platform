import { View } from 'react-native'

import { CircleCheck } from 'lucide-react-native'

import { useColors } from 'hooks/useTheme';

import {
  Dialog,
  Button,
} from 'heroui-native'

type SuccessDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  message: string | null;
  title?: string;
}

export default function SuccessDialog({ 
  isOpen, 
  onClose, 
  message,
  title = "Success",
}: SuccessDialogProps) {
  const { colors } = useColors();

  return (
    <Dialog isOpen={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Close variant="ghost" className="absolute top-3 right-3" />

          <View className="mb-5 gap-1.5">
            <View className="flex-row items-center gap-2">
              <CircleCheck size={20} color={colors.success} />
              <Dialog.Title className="text-success">
                {title}
              </Dialog.Title>
            </View>
            <Dialog.Description className="text-foreground">
              {message}
            </Dialog.Description>
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