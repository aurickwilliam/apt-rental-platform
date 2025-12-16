import { Ionicons } from '@expo/vector-icons';
import { Text, Pressable } from 'react-native';

import { COLORS } from '@/constants/colors';

interface PillButtonProps {
  label: string,
  type?: 'primary' | 'secondary' | 'outline' | 'danger',
  isDisabled?: boolean,
  leftIconName?: React.ComponentProps<typeof Ionicons>['name'],
  rightIconName?: React.ComponentProps<typeof Ionicons>['name'],
  onPress?: () => void,
}

const TYPE_STYLES = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  danger: 'bg-redHead-200',
  outline: 'bg-white border-2 border-grey-500',
}

export default function PillButton({
  label = 'Pill Button',
  type = 'primary',
  isDisabled = false,
  leftIconName,
  rightIconName,
  onPress,
  }: PillButtonProps) {

  return (
    <Pressable className={`${TYPE_STYLES[type]} h-14 w-full rounded-full flex-row 
      justify-center items-center gap-2`}
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