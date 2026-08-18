import { Pressable, Text } from "react-native";
import { Menu } from "heroui-native";
import { IconChevronDown } from "@tabler/icons-react-native";

interface DropdownButtonProps<T extends string> {
  label?: string;
  options: T[];
  value: T | null;
  onSelect: (value: T) => void;
  width?: number | "trigger" | "content-fit" | "full";
  buttonClassName?: string;
  textClassName?: string;
}

export default function DropdownButton<T extends string>({
  label,
  options,
  value,
  onSelect,
  width = 200,
  buttonClassName,
  textClassName,
}: DropdownButtonProps<T>) {
  const selectedKeys = value ? new Set([value]) : new Set<string>();

  const defaultButtonClassName =
    "bg-surface-secondary px-2 py-1 rounded-xl flex-row items-center justify-start self-start gap-1";
  const defaultTextClassName = "text-foreground text-base font-interMedium";

  return (
    <Menu>
      <Menu.Trigger asChild>
        <Pressable className={buttonClassName || defaultButtonClassName}>
          <Text className={textClassName || defaultTextClassName}>{value}</Text>
          <IconChevronDown size={16} color="currentColor" />
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
              const next = Array.from(keys)[0] as T | undefined;
              if (next) onSelect(next);
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
  );
}