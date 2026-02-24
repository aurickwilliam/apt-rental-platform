import { Text, TouchableOpacity } from 'react-native'

import {
  IconSquare,
  IconSquareCheckFilled,
} from '@tabler/icons-react-native';

import { COLORS } from '@repo/constants';

interface CheckBoxProps {
  label: string,
  selected: boolean,
  onPress: () => void,
}

export default function CheckBox({
  label,
  selected,
  onPress,
}: CheckBoxProps) {
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      className='flex-row gap-2 items-center'
      onPress={onPress}
    >
      {
        selected 
        ? <IconSquareCheckFilled size={22} color={COLORS.primary} /> 
        : <IconSquare size={22} color={COLORS.grey} />
      }
      <Text className='text-text text-base font-inter'>
        {label}
      </Text>
    </TouchableOpacity>
  )
}