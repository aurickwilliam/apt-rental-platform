import { Button, Menu} from 'heroui-native'
import {
  IconDotsVertical,
  IconLogout,
  IconCircleX,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react-native';

import { useColors } from 'hooks/useTheme'

type Props = {
  onVacate: () => void
  onRemove: () => void
  isOccupied: boolean
  visibilityLabel?: string
  isListingHidden?: boolean
  onVisibilityPress?: () => void
  isBusy?: boolean
}

export default function PropertyActionMenu({ onVacate, onRemove, isOccupied, visibilityLabel, isListingHidden, onVisibilityPress, isBusy = false }: Props) {
  const { colors } = useColors()

  return (
    <Menu>
      <Menu.Trigger asChild>
        <Button
          className="absolute bottom-8 right-6 rounded-full bg-accent
            items-center justify-center shadow-lg active:opacity-80"
          isIconOnly
          accessibilityLabel="Property actions"
          isDisabled={isBusy}
        >
          <IconDotsVertical
            size={26}
            color={colors.secondaryForeground}
          />
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
          {onVisibilityPress && visibilityLabel ? (
            <Menu.Item isDisabled={isBusy} onPress={onVisibilityPress}>
              {isListingHidden ? <IconEye size={20} color={colors.textPrimary} /> : <IconEyeOff size={20} color={colors.textPrimary} />}
              <Menu.ItemTitle>{visibilityLabel}</Menu.ItemTitle>
            </Menu.Item>
          ) : null}
          <Menu.Item isDisabled={!isOccupied || isBusy} onPress={onVacate}>
            <IconLogout
              size={20}
              color={!isOccupied ? colors.gray400 : colors.textPrimary}
            />
            <Menu.ItemTitle className={!isOccupied ? 'text-gray-400' : ''}>
              Vacate
            </Menu.ItemTitle>
          </Menu.Item>

          <Menu.Item
            variant="danger"
            isDisabled={isOccupied || isBusy}
            onPress={onRemove}
          >
            <IconCircleX
              size={20}
              color={isOccupied ? colors.gray400 : colors.danger}
            />
            <Menu.ItemTitle className={isOccupied ? 'text-gray-400' : ''}>
              Remove Unit
            </Menu.ItemTitle>
          </Menu.Item>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  )
}
