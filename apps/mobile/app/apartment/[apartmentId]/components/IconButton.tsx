import { TouchableOpacity } from 'react-native';

import { LucideIcon } from 'lucide-react-native';

import { useColors } from 'hooks/useTheme';

interface IconButtonProps {
  iconName: LucideIcon;
  buttonColor?: string;
  iconColor?: string;
  onPress?: () => void;
}

export default function IconButton({
  iconName: IconName,
  buttonColor,
  iconColor,
  onPress
}: IconButtonProps) {
  const { colors } = useColors();

  buttonColor = buttonColor || colors.surface;
  iconColor = iconColor || colors.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`p-4 rounded-full`}
      style={{
        backgroundColor: buttonColor,
        opacity: 0.9
      }}
    >
      <IconName
        size={24}
        color={iconColor}
      />
    </TouchableOpacity>
  );
}
