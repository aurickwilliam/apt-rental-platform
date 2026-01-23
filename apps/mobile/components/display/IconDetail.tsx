import { Text, View } from 'react-native'

import { COLORS } from 'constants/colors'

import { IconProps} from '@tabler/icons-react-native';

interface IconDetailProps {
  icon: React.ComponentType<IconProps>;
  iconColor?: string;
  iconSize?: number;
  detailText: string;
}

export default function IconDetail({
  icon: Icon,
  iconColor = COLORS.mediumGrey,
  iconSize = 26,
  detailText
}: IconDetailProps) {

  return (
    <View className='flex-row items-center gap-3'>
      <Icon 
        size={iconSize}
        color={iconColor}
      />
      <Text className='text-text text-base font-inter mt-1'>
        {detailText}
      </Text>
    </View>
  )
}