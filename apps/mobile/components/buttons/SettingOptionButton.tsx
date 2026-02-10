import { Text, TouchableOpacity } from 'react-native'

import {
  IconProps,
  IconPlus,
  IconChevronRight,
} from '@tabler/icons-react-native';

import { COLORS } from '../../constants/colors';

interface SettingOptionButtonProps {
  label: string;
  iconName?: React.ComponentType<IconProps>; 
  onPress?: () => void;
}

// TODO: Add option for a toggle switch or arrow icon

export default function SettingOptionButton({
  label,  
  iconName,
  onPress
}: SettingOptionButtonProps) {

  const Icon = iconName || IconPlus;

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      className='bg-white p-4 rounded-xl flex-row items-center justify-between gap-3'
      onPress={onPress}
    >
      <Icon 
        size={24}
        color={COLORS.text}
      />
      <Text className='text-text text-lg font-interMedium flex-1'>
        {label}
      </Text>
      <IconChevronRight 
        size={24}
        color={COLORS.mediumGrey}
      />
    </TouchableOpacity>
  )
}