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

// 6-digit email code input (3 + 3 slots), shared by the password-recovery and
// change-email code screens. Center it with the parent (`items-center`).
const CodeInput = forwardRef<InputOTPRef, CodeInputProps>(function CodeInput(
  { value, onChange, onComplete, length, isInvalid, isDisabled },
  ref,
) {
  const half = Math.ceil(length / 2);

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
        {Array.from({ length: half }, (_, index) => (
          <InputOTP.Slot key={index} index={index} />
        ))}
      </InputOTP.Group>
      <InputOTP.Separator />
      <InputOTP.Group>
        {Array.from({ length: length - half }, (_, index) => (
          <InputOTP.Slot key={half + index} index={half + index} />
        ))}
      </InputOTP.Group>
    </InputOTP>
  );
});

export default CodeInput;
