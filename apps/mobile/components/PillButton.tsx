import { Ionicons } from '@expo/vector-icons';
import { Text, Pressable } from 'react-native';

import { COLORS } from '@/constants/colors';

interface PillButtonProps {
  label: string,
  type?: 'primary' | 'secondary' | 'outline' | 'danger',
  isDisabled?: boolean,
  isFullWidth?: boolean,
  leftIconName?: React.ComponentProps<typeof Ionicons>['name'],
  rightIconName?: React.ComponentProps<typeof Ionicons>['name'],
  onPress?: () => void,
  size?: 'md' | 'sm'
}

const TYPE_STYLES = {
  primary: 'bg-primary active:bg-[#2551C7]',
  secondary: 'bg-secondary active:bg-[#CC8400]',
  danger: 'bg-redHead-200 active:bg-[#B7070F]',
  outline: 'bg-white border-2 border-grey-500 active:bg-[#E5E5E5]',
}

export default function PillButton({
  label = 'Pill Button',
  type = 'primary',
  isDisabled = false,
  isFullWidth = false,
  leftIconName,
  rightIconName,
  onPress,
  size = 'md'
}: PillButtonProps) {

  // TODO: Extract the ternary operator to a variable
  const widthClass = isFullWidth ? 'w-full' : undefined;
  const iconColor = type !== 'outline' ? 'white' : COLORS.grey;
  const textColor = type !== 'outline' ? 'text-white' : 'text-grey-500';

  // Size of Button Styles
  const sizeStyles = {
    sm: {
      height: 'h-12',
      padding: 'px-3',
      iconSize: 18,
      textSize: 'text-base',
    },
    md: {
      height: 'h-14',
      padding: 'px-4',
      iconSize: 26,
      textSize: 'text-xl',
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <Pressable
      className={`${TYPE_STYLES[type]} 
        ${widthClass} 
        ${currentSize.height} ${currentSize.padding} rounded-full 
        flex-row justify-center items-center gap-2`}
      onPress={onPress}
      disabled={isDisabled}
    >
      {leftIconName && (
        <Ionicons 
          name={leftIconName}
          size={currentSize.iconSize}
          color={iconColor}
        />
      )}

      <Text 
        className={`${textColor} ${currentSize.textSize} font-interMedium`}
        numberOfLines={1}
      >
        {label}
      </Text>

      {rightIconName && (
        <Ionicons 
          name={rightIconName}
          size={currentSize.iconSize}
          color={iconColor}
        />
      )}
    </Pressable>
  );
}