import { Image, ImageSourcePropType } from "react-native";

import { Button, Spinner } from "heroui-native";

import { useColors } from "hooks/useTheme";

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

  const { colors } = useColors();

  return (
    <Button
      variant="tertiary"
      onPress={onPress}
      isDisabled={isDisabled}
      className="flex-1"
    >
      <Image
        source={imageSource}
        style={{ width: 20, height: 20 }}
        resizeMode="contain"
      />
      <Button.Label className="font-interMedium text-foreground">
        {label}
      </Button.Label>

      {isDisabled && (
        <Spinner
          size="sm"
          color={colors.primary}
          className="ml-2"
        />
      )}
    </Button>
  );
}
