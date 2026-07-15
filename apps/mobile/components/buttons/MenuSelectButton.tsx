import { Pressable, Text } from 'react-native'
import { Menu } from 'heroui-native'
import { ChevronDown } from 'lucide-react-native'

type MenuSelectButtonProps<T extends string> = {
  label?: string
  options: T[]
  value: T
  onSelect: (value: T) => void
  width?: number | 'trigger' | 'content-fit' | 'full'
}

export default function MenuSelectButton<T extends string>({
  label,
  options,
  value,
  onSelect,
  width = 200,
}: MenuSelectButtonProps<T>) {
  const selectedKeys = new Set([value])

  return (
    <Menu>
      <Menu.Trigger asChild>
        <Pressable className="bg-surface flex-row items-center gap-1.5 px-3 py-2 rounded-full border border-border">
          <Text className="text-foreground text-sm font-interMedium">
            {value}
          </Text>
          <ChevronDown size={16} className="text-muted" />
        </Pressable>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content presentation="popover" align="end" width={width}>
          {label ? <Menu.Label className="mb-1">{label}</Menu.Label> : null}

          <Menu.Group
            selectionMode="single"
            selectedKeys={selectedKeys}
            onSelectionChange={(keys) => {
              const next = Array.from(keys)[0] as T | undefined
              if (next) onSelect(next)
            }}
          >
            {options.map((option) => (
              <Menu.Item key={option} id={option}>
                <Menu.ItemIndicator />
                <Menu.ItemTitle>{option}</Menu.ItemTitle>
              </Menu.Item>
            ))}
          </Menu.Group>
        </Menu.Content>
      </Menu.Portal>
    </Menu>
  )
}
