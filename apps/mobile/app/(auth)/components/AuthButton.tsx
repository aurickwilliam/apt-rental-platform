import { Image, ImageSourcePropType } from "react-native";

import { Button, Spinner } from "heroui-native";

import { COLORS } from "@repo/constants";

type AuthButtonProps = {
  onPress?: () => void;
  isDisabled?: boolean;
  imageSource: ImageSourcePropType;
  label: string;
};

export default function AuthButton({
  onPress,
  isDisabled,
  imageSource,
  label,
}: AuthButtonProps) {
  return (
    <Button
      variant="outline"
      onPress={onPress}
      isDisabled={isDisabled}
      className="flex-1"
    >
      <Image
        source={imageSource}
        style={{ width: 20, height: 20 }}
        resizeMode="contain"
      />
      <Button.Label className="font-interMedium text-text">
        {label}
      </Button.Label>

      {isDisabled && (
        <Spinner
          size="sm"
          color={COLORS.text}
          className="ml-2"
        />
      )}
    </Button>
  );
}
