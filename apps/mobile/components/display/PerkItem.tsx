import { Text, View } from 'react-native'

import { COLORS } from 'constants/colors'
import { PERKS } from 'constants/perks';

import {
  IconProps
} from '@tabler/icons-react-native';

interface PerkItemProps {
  iconColor?: string;
  iconSize?: number;
  textSize?: number;
  perkId: string;
  customIcon?: React.ComponentType<IconProps>;
  customText?: string;
}

export default function PerkItem({
  iconColor = COLORS.primary,
  iconSize = 26,
  textSize = 16,
  perkId,
  customIcon,
  customText
}: PerkItemProps) {
  const perk = PERKS[perkId];

  // Icon
  const Icon = customIcon || perk.icon;

  return (
    <View className='flex-row items-center gap-3'>
      <Icon
        size={iconSize}
        color={iconColor}
      />
      <Text 
        className='text-text text-base font-inter mt-1'
        style={{ fontSize: textSize }}
      >
        {customText || perk.name}
      </Text>
    </View>
  )
}