import { forwardRef } from "react";

import { InputOTP, REGEXP_ONLY_DIGITS, type InputOTPRef } from "heroui-native";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length: number;
  isInvalid?: boolean;
  isDisabled?: boolean;
}

// 6-digit email code input (one row of slots), shared by the password-recovery and
// change-email code screens. Center it with the parent (`items-center`).
const CodeInput = forwardRef<InputOTPRef, CodeInputProps>(function CodeInput(
  { value, onChange, onComplete, length, isInvalid, isDisabled },
  ref,
) {
  return (
    <InputOTP
      ref={ref}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      maxLength={length}
      isInvalid={isInvalid}
      isDisabled={isDisabled}
      inputMode="numeric"
      pattern={REGEXP_ONLY_DIGITS}
      textInputProps={{
        textContentType: "oneTimeCode",
        autoComplete: "one-time-code",
      }}
    >
      <InputOTP.Group>
        {Array.from({ length }, (_, index) => (
          <InputOTP.Slot key={index} index={index} />
        ))}
      </InputOTP.Group>
    </InputOTP>
  );
});

export default CodeInput;
