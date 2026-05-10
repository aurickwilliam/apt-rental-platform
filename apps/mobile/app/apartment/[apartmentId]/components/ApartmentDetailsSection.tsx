import { View, Text } from 'react-native'

import { 
  IconUsers,
  IconBuildingSkyscraper,
  IconHome2,
  IconCalendar
} from '@tabler/icons-react-native';

import { COLORS } from '@repo/constants';

import type { ApartmentDetails } from '@/hooks/useApartmentDetails';

type ApartmentDetailsSectionProps = {
  apartment: ApartmentDetails | null;
}

type DetailBlockProps = {
  Icon: React.ElementType;
  value: string;
}

// Component for each detail block
function DetailBlock({
  Icon,
  value,
}: DetailBlockProps){
  return (
    <View className='flex-row items-center gap-2 bg-darkerWhite p-3 rounded-2xl mb-2'>
      <Icon size={24} color={COLORS.text} />
      <Text className='text-text font-interMedium text-base'>
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
      icon: IconUsers, 
      value: apartment?.max_occupants 
        ? `Max ${apartment.max_occupants} ${apartment.max_occupants === 1 ? 'Occupant' : 'Occupants'}` 
        : 'N/A' 
    },
    {
      icon: IconBuildingSkyscraper,
      value: apartment?.floor_level ? `${apartment.floor_level}` : 'N/A'
    },
    {
      icon: IconHome2,
      value: apartment?.type || 'N/A'
    },
    {
      icon: IconCalendar,
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