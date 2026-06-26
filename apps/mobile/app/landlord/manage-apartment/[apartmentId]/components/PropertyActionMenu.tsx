import { Button, Menu } from 'heroui-native'
import { EllipsisVertical, LogOut, CircleX } from 'lucide-react-native'

import { useColors } from 'hooks/useTheme'

type Props = {
  onVacate: () => void
  onRemove: () => void
  isOccupied: boolean
}

export default function PropertyActionMenu({ onVacate, onRemove, isOccupied }: Props) {
  const { colors } = useColors()

  return (
    <Menu>
      <Menu.Trigger asChild>
        <Button
          className="absolute bottom-8 right-6 rounded-full bg-accent
            items-center justify-center shadow-lg active:opacity-80"
          isIconOnly
        >
          <EllipsisVertical size={26} color={colors.secondaryForeground} />
        </Button>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content
          presentation="popover"
          placement="top"
          align="end"
          width={200}
        >
          <Menu.Label>Actions</Menu.Label>
          <Menu.Item isDisabled={!isOccupied} onPress={onVacate}>
            <LogOut size={20} color={!isOccupied ? colors.gray400 : colors.textPrimary} />
            <Menu.ItemTitle className={!isOccupied ? 'text-gray-400' : ''}>
              Vacate
            </Menu.ItemTitle>
          </Menu.Item>

          <Menu.Item
            variant="danger"
            isDisabled={isOccupied}
            onPress={onRemove}
          >
            <CircleX size={20} color={isOccupied ? colors.gray400 : colors.danger} />
            <Menu.ItemTitle className={isOccupied ? 'text-gray-400' : ''}>
              Remove Unit
            </Menu.ItemTitle>
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  )
}
