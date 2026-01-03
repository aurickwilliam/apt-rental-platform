import { Ionicons } from '@expo/vector-icons';
import { Text, Pressable } from 'react-native';

import { COLORS } from '@/constants/colors';

interface PillButtonProps {
  label: string,
  type?: 'primary' | 'secondary' | 'outline' | 'danger',
  width?: number,
  isDisabled?: boolean,
  isFullWidth?: boolean,
  leftIconName?: React.ComponentProps<typeof Ionicons>['name'],
  rightIconName?: React.ComponentProps<typeof Ionicons>['name'],
  onPress?: () => void,
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
  width,
  isDisabled = false,
  isFullWidth = false,
  leftIconName,
  rightIconName,
  onPress,
  }: PillButtonProps) {

  return (
    <Pressable className={`${TYPE_STYLES[type]} 
      ${isFullWidth ? 'w-full self-stretch' : 'self-start'} 
      h-14 min-w-[120px] rounded-full flex-row 
      justify-center items-center gap-2`}
      style={{ width: width ? width : undefined }}
      onPress={onPress}
      disabled={isDisabled}
    >

      {/* Left Icon */}
      {
        leftIconName &&
        <Ionicons 
          name={leftIconName}
          size={26}
          color={`${type !== "outline" ? 'white' : COLORS.grey}`}
        />
      }

      <Text className={`${type !== "outline" ? 'text-white' : 'text-grey-500'} 
        text-xl font-interMedium`}
      >
        {label}
      </Text>

      {/* Right Icon */}
      {
        rightIconName &&
        <Ionicons 
          name={rightIconName}
          size={26}
          color={`${type !== "outline" ? 'white' : COLORS.grey}`}
        />
      }
    </Pressable>
  )
}