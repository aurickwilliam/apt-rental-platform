import { createContext, useContext, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface Option { value: string; label: string }
interface SelectProps {
  children: ReactNode;
  selectionMode?: "single" | "multiple";
  value?: Option | Option[];
  onValueChange: (value: Option | Option[] | undefined) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}
const Context = createContext<SelectProps | null>(null);
const useSelect = () => useContext(Context)!;
function Root(props: SelectProps) {
  return <Context.Provider value={props}><View>{props.children}</View></Context.Provider>;
}
function Trigger({ children, accessibilityLabel }: { children: ReactNode; accessibilityLabel: string }) {
  const context = useSelect();
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={() => context.onOpenChange(!context.isOpen)}>{children}</Pressable>;
}
function Value({ placeholder }: { placeholder: string }) {
  const { value } = useSelect();
  return <Text>{Array.isArray(value) ? value.map((option) => option.label).join(", ") || placeholder : value?.label ?? placeholder}</Text>;
}
function Content({ children }: { children: ReactNode }) {
  return useSelect().isOpen ? <View>{children}</View> : null;
}
function Overlay() {
  const context = useSelect();
  return context.isOpen ? <Pressable accessibilityLabel="Dismiss dropdown" onPress={() => context.onOpenChange(false)} /> : null;
}
function Item({ value, label, accessibilityLabel, closeOnPress = true }: Option & { accessibilityLabel: string; closeOnPress?: boolean }) {
  const context = useSelect();
  const multiple = context.selectionMode === "multiple";
  const selected = Array.isArray(context.value) ? context.value.some((option) => option.value === value) : context.value?.value === value;
  return <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole={multiple ? "checkbox" : "radio"} accessibilityState={{ checked: selected }} onPress={() => {
    const current = Array.isArray(context.value) ? context.value : [];
    context.onValueChange(multiple ? selected ? current.filter((option) => option.value !== value) : [...current, { value, label }] : { value, label });
    if (closeOnPress) context.onOpenChange(false);
  }}><Text>{label}</Text></Pressable>;
}
export default Object.assign(Root, {
  Trigger, Value, Content, Overlay, Item,
  Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
  TriggerIndicator: () => null, ItemLabel: () => null, ItemIndicator: () => null,
});
