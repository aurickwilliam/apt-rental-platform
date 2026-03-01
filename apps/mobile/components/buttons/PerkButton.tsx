import { Text, TouchableOpacity, View } from 'react-native'

import { COLORS } from '@repo/constants'
import { PERKS } from 'constants/perks';

import {
  IconProps,
  IconQuestionMark,
  IconX,
} from '@tabler/icons-react-native';

type BasePerkButtonProps = {
  iconColor?: string;
  iconSize?: number;
  textSize?: number;
};

type PerkButtonProps = BasePerkButtonProps & (
  | { perkId: string; customIcon?: never; customText?: never; isSelected?: boolean; onPress?: () => void; onRemovePress?: () => void; }
  | { perkId?: never; customIcon: React.ComponentType<IconProps>; customText: string; isSelected?: never; onPress?: () => void; onRemovePress?: () => void; }
);

export default function PerkButton({
  iconColor = COLORS.primary,
  iconSize = 26,
  textSize = 16,
  ...props
}: PerkButtonProps) {
  const perk = 'perkId' in props && props.perkId ? PERKS[props.perkId] : undefined;

  // Icon and text with fallbacks
  const Icon = ('customIcon' in props ? props.customIcon : undefined) || perk?.icon || IconQuestionMark;
  const text = ('customText' in props ? props.customText : undefined) || perk?.name || 'Unknown perk';

  return (
    <TouchableOpacity 
      className='flex-row items-center justify-center gap-2 bg-white border border-grey-300 py-2 px-4 rounded-full'
      onPress={props.isSelected ? props.onRemovePress : props.onPress}
      activeOpacity={0.7}
    >
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

      {
         props.isSelected && (
          <TouchableOpacity onPress={props.onRemovePress}>
            <IconX
              size={20}
              color={COLORS.grey}
            />
          </TouchableOpacity>
        )
      }
    </TouchableOpacity>
  )
}