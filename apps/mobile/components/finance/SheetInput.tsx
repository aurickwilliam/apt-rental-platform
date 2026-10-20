import {
  FieldError,
  Input,
  Label,
  TextField,
  useBottomSheetAwareHandlers,
} from "heroui-native";
import { useColors } from "@/hooks/useTheme";

/** Widest peso amount the finance forms accept, including its formatting. */
export const MAX_FORMATTED_AMOUNT_LENGTH = "₱ 999,999,999.99".length;

/** Labelled finance text field, shared by the entry forms and their sheets. */
export default function SheetInput({
  label,
  value,
  onChange,
  error,
  numeric = false,
  maxLength = 200,
  placeholder,
  disabled = false,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  numeric?: boolean;
  maxLength?: number;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const handlers = useBottomSheetAwareHandlers();
  const { colors } = useColors();
  return (
    <TextField isInvalid={!!error} isDisabled={disabled} isRequired={required}>
      <Label>
        <Label.Text
          className={`font-nunitoSemiBold text-base ${error ? "text-danger" : "text-foreground"}`}
        >
          {label}
        </Label.Text>
      </Label>
      <Input
        isInvalid={!!error}
        className={`font-inter text-sm text-foreground${error ? " finance-field-invalid" : ""}`}
        style={
          error ? { borderColor: colors.danger, borderWidth: 2 } : undefined
        }
        value={value}
        onChangeText={onChange}
        accessibilityLabel={label}
        placeholder={placeholder}
        keyboardType={numeric ? "decimal-pad" : "default"}
        maxLength={maxLength}
        {...handlers}
      />
      <FieldError>{error}</FieldError>
    </TextField>
  );
}
