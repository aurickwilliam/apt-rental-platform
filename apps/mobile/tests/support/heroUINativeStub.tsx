// heroui-native ships untranspiled ESM that Jest cannot parse. Interactive
// stand-ins for the components the auth and settings screens use:
// jest.mock("heroui-native", () => require("<relative path>/support/heroUINativeStub")).
import { createContext, useContext, type ReactNode } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

interface ChildrenProps {
  children?: ReactNode;
}

interface PressableStubProps extends ChildrenProps {
  onPress?: () => void;
  isDisabled?: boolean;
  accessibilityLabel?: string;
  className?: string;
}

const Passthrough = ({ children }: ChildrenProps) => <View>{children}</View>;
// `stub*` props mirror the composite HeroUI props that tests assert on. The
// installed RNTL v14 renders host elements only, so a composite's own props are
// unreachable; these carry them onto the host node without changing queries.
const TextStub = ({
  children,
  className,
  isRequired,
}: ChildrenProps & { className?: string; isRequired?: boolean }) => (
  <Text className={className} {...({ stubIsRequired: isRequired } as object)}>{children}</Text>
);

interface ManagedPressableProps extends PressableStubProps, Record<string, unknown> {}

// Forward the stub-managed props explicitly and pass everything else through,
// so shapes queries read off the host node (variant, testID, ...) stay visible.
function PressableStub({ children, onPress, isDisabled, accessibilityLabel, className, ...props }: ManagedPressableProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!isDisabled }}
      className={className}
      {...props}
    >
      {children}
    </Pressable>
  );
}

export const Button = Object.assign(PressableStub, { Label: TextStub });
export const CloseButton = PressableStub;
export const LinkButton = Object.assign(PressableStub, { Label: TextStub });

export const TextField = Passthrough;
export const Label = Object.assign(TextStub, { Text: TextStub });
export const Description = TextStub;
// Card parts and Chip keep their className/style on the host node so layout assertions can read them.
const StyledPassthrough = ({ children, className, style }: ChildrenProps & { className?: string; style?: unknown }) => (
  <View className={className} style={style as never}>{children}</View>
);
export const Card = Object.assign(StyledPassthrough, { Body: StyledPassthrough, Header: Passthrough, Footer: Passthrough });
export const FieldError = TextStub;
export const Input = (props: TextInputProps) => <TextInput {...props} />;
export const InputGroup = Object.assign(Passthrough, { Input, Prefix: Passthrough, Suffix: Passthrough });
export const Spinner = () => null;
export const useThemeColor = () => "#FFFFFF";

function ControlFieldStub({ children, isSelected, onSelectedChange, isDisabled, isRequired, accessibilityLabel }: ChildrenProps & {
  isSelected?: boolean;
  isRequired?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  isDisabled?: boolean;
  accessibilityLabel?: string;
}) {
  return <Pressable accessibilityRole="checkbox" accessibilityLabel={accessibilityLabel}
    accessibilityState={{ checked: !!isSelected, disabled: !!isDisabled }} disabled={isDisabled}
    {...({ stubIsRequired: isRequired } as object)}
    onPress={() => onSelectedChange?.(!isSelected)}>{children}</Pressable>;
}
export const ControlField = Object.assign(ControlFieldStub, { Indicator: Passthrough });
export const Checkbox = () => null;

interface RadioGroupStubProps extends ChildrenProps {
  value?: string;
  onValueChange: (value: string) => void;
  isDisabled?: boolean;
}
const RadioContext = createContext<Omit<RadioGroupStubProps, "children">>({ onValueChange: () => {} });
function RadioGroupStub({ children, ...props }: RadioGroupStubProps) {
  return <RadioContext.Provider value={props}><View>{children}</View></RadioContext.Provider>;
}
function RadioItemStub({ children, value, accessibilityLabel, isDisabled }: ChildrenProps & { value: string; accessibilityLabel?: string; isDisabled?: boolean }) {
  const group = useContext(RadioContext);
  const disabled = !!group.isDisabled || !!isDisabled;
  return <Pressable accessibilityRole="radio" accessibilityLabel={accessibilityLabel} disabled={disabled}
    accessibilityState={{ checked: group.value === value, disabled }}
    onPress={() => group.onValueChange(value)}>{children}</Pressable>;
}
export const RadioGroup = Object.assign(RadioGroupStub, { Item: RadioItemStub });
export const Radio = Object.assign(() => null, { Indicator: () => null });

export const Alert = Object.assign(Passthrough, {
  Indicator: () => null,
  Content: Passthrough,
  Title: TextStub,
  Description: TextStub,
});

interface InputOTPStubProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  maxLength: number;
  isDisabled?: boolean;
}

function InputOTPStub({ value, onChange, onComplete, maxLength, isDisabled }: InputOTPStubProps) {
  return (
    <TextInput
      accessibilityLabel="Recovery code"
      value={value}
      editable={!isDisabled}
      onChangeText={(next) => {
        onChange(next);
        if (next.length === maxLength) onComplete?.(next);
      }}
    />
  );
}

export const InputOTP = Object.assign(InputOTPStub, {
  Group: Passthrough,
  Slot: () => null,
  Separator: () => null,
});
export const REGEXP_ONLY_DIGITS = "^\\d+$";
export type InputOTPRef = { clear: () => void };

// Toasts: tests read calls through jest.requireMock("heroui-native").mockToastShow.
export const mockToastShow = jest.fn();
export const useToast = () => ({ toast: { show: mockToastShow } });

// Settings list
interface ListItemStubProps extends ChildrenProps {
  onPress?: () => void;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

function ListItemStub({
  children,
  onPress,
  disabled,
  accessibilityLabel,
  testID,
}: ListItemStubProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}

export const ListGroup = Object.assign(Passthrough, {
  Item: ListItemStub,
  ItemPrefix: Passthrough,
  ItemContent: Passthrough,
  ItemTitle: TextStub,
  ItemSuffix: Passthrough,
});
export const Separator = () => null;
export const Chip = Object.assign(
  ({ children, style }: ChildrenProps & { style?: unknown }) => (
    <View {...({ stubIsChip: true } as object)} style={style as never}>{children}</View>
  ),
  { Label: TextStub },
);

// Accordion: questions render always; the installed component owns the
// expand/collapse state, so the stub leaves every panel open.
export const Accordion = Object.assign(
  ({ children }: ChildrenProps) => <View>{children}</View>,
  {
    Item: Passthrough,
    Trigger: PressableStub,
    Indicator: () => null,
    Content: Passthrough,
  },
);

// Dialogs: only mounted while open, like the installed HeroUI Portal.
interface DialogStubProps extends ChildrenProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function DialogStub({ children, isOpen = false, onOpenChange }: DialogStubProps) {
  return isOpen ? <View {...({ stubOnOpenChange: onOpenChange } as object)}>{children}</View> : null;
}

function DialogOverlayStub({ children, isCloseOnPress }: ChildrenProps & { isCloseOnPress?: boolean }) {
  return <View {...({ stubIsCloseOnPress: isCloseOnPress } as object)}>{children}</View>;
}

function DialogContentStub({ children, isSwipeable, style }: ChildrenProps & { isSwipeable?: boolean; style?: unknown }) {
  return <View {...({ stubIsSwipeable: isSwipeable, stubStyle: style } as object)}>{children}</View>;
}

export const Dialog = Object.assign(DialogStub, {
  Portal: Passthrough,
  Overlay: DialogOverlayStub,
  Content: DialogContentStub,
  Title: TextStub,
  Description: TextStub,
  Close: PressableStub,
});
