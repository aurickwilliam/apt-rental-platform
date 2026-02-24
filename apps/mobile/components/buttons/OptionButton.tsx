import { Text, TouchableOpacity } from 'react-native'

import { COLORS } from '@repo/constants'

import { IconChevronRight } from '@tabler/icons-react-native';

interface OptionButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor?: string;
  textColor?: string;
}

export default function OptionButton({
  title,
  onPress,
  backgroundColor = COLORS.darkerWhite,
  textColor = COLORS.text,
}: OptionButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      className='w-full p-4 rounded-xl items-center justify-between gap-3 flex-row'
      style={{ backgroundColor }}
      onPress={onPress}
    >
      <Text 
        className='text-lg font-interMedium flex-1'
        style={{ color: textColor }}
      >
        {title}
      </Text>

      <IconChevronRight 
        size={24} 
        color={textColor} 
      />
    </TouchableOpacity>
  )
}