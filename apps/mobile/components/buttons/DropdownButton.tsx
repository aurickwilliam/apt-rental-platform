import { Pressable, Text } from "react-native";
import { Menu } from "heroui-native";
import { IconChevronDown } from "@tabler/icons-react-native";

interface DropdownButtonProps<T extends string> {
  label?: string;
  options: T[];
  value: T | null;
  values?: T[];
  onSelect: (value: T) => void;
  onToggle?: (value: T) => void;
  onValuesChange?: (values: T[]) => void;
  multi?: boolean;
  placeholder?: string;
  width?: number | "trigger" | "content-fit" | "full";
  buttonClassName?: string;
  textClassName?: string;
}

function formatMultiDisplay(values: string[], placeholder: string): string {
  if (values.length === 0) return placeholder;
  const joined = values.join(", ");
  const truncated = joined.length > 28 ? `${joined.slice(0, 28)}…` : joined;
  return truncated;
}

export default function DropdownButton<T extends string>({
  label,
  options,
  value,
  values,
  onSelect,
  onToggle,
  onValuesChange,
  multi = false,
  placeholder = "Select",
  width = 200,
  buttonClassName,
  textClassName,
}: DropdownButtonProps<T>) {
  const selectedKeys = multi ? new Set<string>(values ?? []) : value ? new Set([value]) : new Set<string>();

  const defaultButtonClassName =
    "bg-surface-secondary px-3 py-1.5 rounded-xl flex-row items-center justify-start self-start gap-1.5 border border-border";
  const defaultTextClassName = "text-foreground text-sm font-inter";

  const displayText = multi
    ? formatMultiDisplay((values ?? []) as string[], placeholder)
    : value ?? placeholder;

  return (
    <Menu>
      <Menu.Trigger asChild>
        <Pressable className={buttonClassName || defaultButtonClassName}>
          <Text className={textClassName || defaultTextClassName} numberOfLines={1}>{displayText}</Text>
          <IconChevronDown size={14} color="currentColor" />
        </Pressable>
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Overlay />
        <Menu.Content presentation="popover" align="end" width={width}>
          {label ? <Menu.Label className="mb-1">{label}</Menu.Label> : null}

          <Menu.Group
            selectionMode={multi ? "multiple" : "single"}
            selectedKeys={selectedKeys}
            onSelectionChange={(keys) => {
              const nextKeys = Array.from(keys) as T[];
              if (multi) {
                if (onValuesChange) {
                  onValuesChange(nextKeys);
                  return;
                }
                if (onToggle) {
                  const oldSet = new Set<string>(values ?? []);
                  const newSet = new Set<string>(nextKeys as string[]);
                  let toggled: T | undefined;
                  for (const k of newSet) if (!oldSet.has(k as string)) toggled = k as T;
                  if (!toggled) for (const k of oldSet) if (!newSet.has(k as string)) toggled = k as T;
                  if (toggled) onToggle(toggled);
                  return;
                }
              } else {
                const next = nextKeys[0] as T | undefined;
                if (next) onSelect(next);
              }
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