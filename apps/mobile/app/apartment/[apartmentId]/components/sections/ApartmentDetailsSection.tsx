import { View, Text } from 'react-native'

import {
  Users,
  Building,
  House,
  Calendar,
  LucideIcon,
} from 'lucide-react-native';

import type { ApartmentDetails } from 'hooks/useApartmentDetails';
import { useColors } from 'hooks/useTheme';

type ApartmentDetailsSectionProps = {
  apartment: ApartmentDetails | null;
}

export default function ApartmentDetailsSection({
  apartment,
}: ApartmentDetailsSectionProps) {
  const { colors } = useColors();

  type DetailBlockProps = {
    Icon: LucideIcon;
    value: string;
  }

  // Component for each detail block
  function DetailBlock({
    Icon,
    value,
  }: DetailBlockProps){
    return (
      <View className='flex-row items-center gap-2 bg-surface p-3 rounded-2xl mb-2 border border-border'>
        <Icon size={24} color={colors.gray500} />
        <Text className='text-foreground font-interMedium text-sm'>
          {value}
        </Text>
      </View>
    )
  }

  const detailData = [
    { 
      icon: Users, 
      value: apartment?.max_occupants 
        ? `Max ${apartment.max_occupants} ${apartment.max_occupants === 1 ? 'Occupant' : 'Occupants'}` 
        : 'N/A' 
    },
    {
      icon: Building,
      value: apartment?.floor_level ? `${apartment.floor_level}` : 'N/A'
    },
    {
      icon: House,
      value: apartment?.type || 'N/A'
    },
    {
      icon: Calendar,
      value: apartment?.lease_duration || 'N/A'
    }
  ]

  return (
    <View className='mt-5 px-5 flex-row flex-wrap'>
      {
        detailData.map((detail, index) => (
          <View key={index} className='w-1/2 pr-2'>
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