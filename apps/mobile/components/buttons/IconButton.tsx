import { TouchableOpacity } from 'react-native';
import { IconProps } from '@tabler/icons-react-native';

import { COLORS } from '../../constants/colors';

interface IconButtonProps {
  iconName: React.ComponentType<IconProps>;
  buttonColor?: string;
  iconColor?: string;
  onPress?: () => void;
}

export default function IconButton({
  iconName: IconName,
  buttonColor = COLORS.white,
  iconColor = COLORS.text,
  onPress
}: IconButtonProps) {
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
