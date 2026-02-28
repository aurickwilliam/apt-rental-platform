import { IconProps } from '@tabler/icons-react-native';
import { Text, Pressable } from 'react-native';

import { COLORS } from '@repo/constants';

interface PillButtonProps {
  label: string,
  type?: 'primary' | 'secondary' | 'outline' | 'danger',
  isDisabled?: boolean,
  isFullWidth?: boolean,
  width?: string,
  leftIconName?: React.ComponentType<IconProps>,
  rightIconName?: React.ComponentType<IconProps>,
  onPress?: () => void,
  size?: 'md' | 'sm'
}

const TYPE_STYLES = {
  primary: 'bg-primary active:bg-[#2551C7]',
  secondary: 'bg-secondary active:bg-[#CC8400]',
  danger: 'bg-redHead-100 active:bg-[#B7070F]',
  outline: 'bg-white border-2 border-grey-500 active:bg-[#E5E5E5]',
  disabled: 'bg-grey-300',
}

export default function PillButton({
  label = 'Pill Button',
  type = 'primary',
  isDisabled = false,
  isFullWidth = false,
  width,
  leftIconName,
  rightIconName,
  onPress,
  size = 'md',
}: PillButtonProps) {
  const widthClass = width ?? (isFullWidth ? 'w-full' : 'w-auto');
  const iconColor = type !== 'outline' ? 'white' : COLORS.grey;
  const textColor = type !== 'outline' ? 'text-white' : 'text-grey-500';

  const sizeStyles = {
    sm: {
      height: 'h-12',
      padding: 'px-3',
      iconSize: 20,
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
  const LeftIcon = leftIconName;
  const RightIcon = rightIconName;

  return (
    <Pressable
      className={` ${isDisabled ? TYPE_STYLES.disabled : TYPE_STYLES[type]}
        ${widthClass}
        ${currentSize.height} ${currentSize.padding} rounded-full
        flex-row justify-center items-center gap-2`}
      onPress={onPress}
      disabled={isDisabled}
    >
      {LeftIcon && (
        <LeftIcon
          size={currentSize.iconSize}
          color={iconColor}
        />
      )}
      <Text
        className={`${textColor} ${currentSize.textSize} font-interMedium text-center`}
        numberOfLines={1}
      >
        {label}
      </Text>
      {RightIcon && (
        <RightIcon
          size={currentSize.iconSize}
          color={iconColor}
        />
      )}
    </Pressable>
  );
}
