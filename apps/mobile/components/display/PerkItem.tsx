import { Text, View } from 'react-native'

import { COLORS } from 'constants/colors'
import { PERKS } from 'constants/perks';

import {
  IconProps,
  IconQuestionMark
} from '@tabler/icons-react-native';

type BasePerkItemProps = {
  iconColor?: string;
  iconSize?: number;
  textSize?: number;
};

type PerkItemProps = BasePerkItemProps & (
  | { perkId: string; customIcon?: never; customText?: never }
  | { perkId?: never; customIcon: React.ComponentType<IconProps>; customText: string }
);

export default function PerkItem({
  iconColor = COLORS.primary,
  iconSize = 26,
  textSize = 16,
  ...props
}: PerkItemProps) {
  const perk = 'perkId' in props && props.perkId ? PERKS[props.perkId] : undefined;

  // Icon and text with fallbacks
  const Icon = ('customIcon' in props ? props.customIcon : undefined) || perk?.icon || IconQuestionMark;
  const text = ('customText' in props ? props.customText : undefined) || perk?.name || 'Unknown perk';

  return (
    <View className='flex-row items-center gap-3'>
      {Icon && (
        <Icon
          size={iconSize}
          color={iconColor}
        />
      )}
      <Text 
        className='text-text text-base font-inter mt-1'
        style={{ fontSize: textSize }}
      >
        {text}
      </Text>
    </View>
  )
}