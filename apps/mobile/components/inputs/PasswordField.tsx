import { Pressable } from "react-native";
import { useState } from "react";

import { FieldError, InputGroup, Label, TextField } from "heroui-native";

import { IconEye, IconEyeOff } from "@tabler/icons-react-native";

import { useColors } from "@/hooks/useTheme";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  error?: string;
  isDisabled?: boolean;
  // "password" for an existing password, "newPassword" for one being created.
  textContentType?: "password" | "newPassword";
}

// Canonical password input (DESIGN.md §10): HeroUI InputGroup with an eye
// toggle suffix, label above, FieldError below.
export default function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  isDisabled = false,
  textContentType = "password",
}: PasswordFieldProps) {
  const { colors } = useColors();
  const [isVisible, setIsVisible] = useState(false);

  return (
    <TextField isRequired isInvalid={!!error} isDisabled={isDisabled}>
      <Label>{label}</Label>
      <InputGroup>
        <InputGroup.Input
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType={textContentType}
          autoComplete={textContentType === "newPassword" ? "new-password" : "current-password"}
          editable={!isDisabled}
        />
        <InputGroup.Suffix>
          <Pressable
            onPress={() => setIsVisible((visible) => !visible)}
            hitSlop={20}
            accessibilityRole="button"
            accessibilityLabel={`${isVisible ? "Hide" : "Show"} ${label.replace(/:$/, "").toLowerCase()}`}
          >
            {isVisible ? (
              <IconEyeOff size={20} color={colors.gray400} />
            ) : (
              <IconEye size={20} color={colors.gray400} />
            )}
          </Pressable>
        </InputGroup.Suffix>
      </InputGroup>
      {!!error && <FieldError>{error}</FieldError>}
    </TextField>
  );
}
