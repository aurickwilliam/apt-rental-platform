import { IconView } from 'react-native'

import { CircleAlert as View } from 'react-native'

import { CircleAlert } from '@tabler/icons-react-native';

import { useColors } from 'hooks/useTheme';

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
  const { colors } = useColors();

  return (
    <Dialog isOpen={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay />
        <Dialog.Content>
          <Dialog.Close variant="ghost" className="absolute top-3 right-3" />

          <View className="mb-5 gap-1.5">
            <View className="flex-row items-center gap-2">
              <CircleAlert size={20} color={colors.danger} />
              <Dialog.Title className="text-danger">
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