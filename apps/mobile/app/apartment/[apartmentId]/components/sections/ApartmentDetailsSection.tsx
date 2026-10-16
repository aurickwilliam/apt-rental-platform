import { View, Text } from 'react-native'

import { IconUsers, IconBuilding, IconHome, IconCalendar } from '@tabler/icons-react-native';
import type { Icon } from '@tabler/icons-react-native';

import type { ApartmentDetails } from 'hooks/apartments';
import { useColors } from 'hooks/useTheme';

type ApartmentDetailsSectionProps = {
  apartment: ApartmentDetails | null;
}

type DetailBlockProps = {
  Icon: Icon;
  value: string;
}

function DetailBlock({ Icon, value }: DetailBlockProps) {
  const { colors } = useColors();

  return (
    <View className='flex-1 flex-row items-center gap-2 p-3 bg-surface rounded-2xl border border-border'>
      <Icon size={24} color={colors.gray500} />
      <Text className='flex-1 text-foreground font-nunitoSemiBold text-sm'>
        {value}
      </Text>
    </View>
  )
}

export default function ApartmentDetailsSection({
  apartment,
}: ApartmentDetailsSectionProps) {
  const detailData = [
    {
      key: 'occupants',
      icon: IconUsers,
      value: apartment?.max_occupants
        ? `Max ${apartment.max_occupants} ${apartment.max_occupants === 1 ? 'Occupant' : 'Occupants'}`
        : 'N/A'
    },
    {
      key: 'floor',
      icon: IconBuilding,
      value: apartment?.floor_level ? apartment.floor_level : 'N/A'
    },
    {
      key: 'type',
      icon: IconHome,
      value: apartment?.type || 'N/A'
    },
    {
      key: 'duration',
      icon: IconCalendar,
      value: apartment?.lease_duration || 'N/A'
    }
  ]

  return (
    <View className="px-5 flex-row flex-wrap">
      {
        detailData.map((detail, index) => (
          <View key={detail.key} className={`w-1/2 ${index % 2 === 0 ? 'pr-1.5' : 'pl-1.5'} ${index >= 2 ? 'pt-3' : ''}`}>
            <DetailBlock
              Icon={detail.icon}
              value={detail.value}
            />
          </View>
        ))
      }
    </View>
  )
}
