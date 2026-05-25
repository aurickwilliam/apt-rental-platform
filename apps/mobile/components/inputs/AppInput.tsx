import { Input, inputClassNames, cn, useTextField } from "heroui-native";
import type { ComponentProps } from "react";

type AppInputProps = ComponentProps<typeof Input>;

export default function AppInput({ className, style, ...props }: AppInputProps) {
  const { isInvalid } = useTextField();

  return (
    <Input
      className={cn(
        inputClassNames.input({ variant: "primary", isInvalid }),
        className
      )}
      style={[{ shadowOpacity: 0, elevation: 0 }, style]}
      {...props}
    />
  );
}