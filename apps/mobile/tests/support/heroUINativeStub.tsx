// heroui-native ships untranspiled ESM that Jest cannot parse. Interactive
// stand-ins for the components the auth and settings screens use:
// jest.mock("heroui-native", () => require("<relative path>/support/heroUINativeStub")).
import type { ReactNode } from "react";
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
const TextStub = ({ children }: ChildrenProps) => <Text>{children}</Text>;

function PressableStub({ children, onPress, isDisabled, accessibilityLabel, className }: PressableStubProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!isDisabled }}
      className={className}
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
export const FieldError = TextStub;
export const Input = (props: TextInputProps) => <TextInput {...props} />;
export const InputGroup = Object.assign(Passthrough, { Input, Prefix: Passthrough, Suffix: Passthrough });
export const Spinner = () => null;

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
}

function ListItemStub({ children, onPress, disabled }: ListItemStubProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
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
export const Chip = Object.assign(Passthrough, { Label: TextStub });

// Dialogs: only mounted while open, like the installed HeroUI Portal.
interface DialogStubProps extends ChildrenProps {
  isOpen?: boolean;
}

function DialogStub({ children, isOpen = false }: DialogStubProps) {
  return isOpen ? <View>{children}</View> : null;
}

export const Dialog = Object.assign(DialogStub, {
  Portal: Passthrough,
  Overlay: Passthrough,
  Content: Passthrough,
  Title: TextStub,
  Description: TextStub,
  Close: PressableStub,
});
