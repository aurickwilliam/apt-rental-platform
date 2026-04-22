import {
  Image,
  View,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";

interface LogoButtonProps {
  image: ImageSourcePropType;
  onPress?: () => void;
  disabled?: boolean;
}

export default function LogoButton({
  image,
  onPress,
  disabled,
}: LogoButtonProps) {
  return (
    <TouchableOpacity
      className="p-4 bg-white border border-grey-200
      rounded-full self-center"
      onPress={onPress}
      disabled={disabled}
    >
      <View className="h-9 w-9">
        <Image source={image} style={{ width: "100%", height: "100%" }} />
      </View>
    </TouchableOpacity>
  );
}
