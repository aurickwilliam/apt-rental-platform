import { View, Text } from 'react-native';
import { IconSquareCheck } from '@tabler/icons-react-native';

import PerkItem from 'components/display/PerkItem';
import { COLORS } from '@repo/constants';

type PerksSectionProps = {
  amenities?: string[] | null;
};

export default function PerksSection({ amenities }: PerksSectionProps) {
  const hasPerks = (amenities?.length ?? 0) > 0;

  return (
    <>
      <View className='mt-10 px-5 flex gap-2'>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center gap-2'>
            <IconSquareCheck size={26} color={COLORS.text} />
            <Text className='font-poppinsSemiBold text-xl text-text'>
              Included Perks
            </Text>
          </View>
        </View>

        <Text>These are already included in your rent.</Text>
      </View>

      <View className='flex-row flex-wrap px-5 mt-5'>
        {hasPerks ? (
          amenities?.map((amenity, index) => (
            <View key={index} className='w-1/2 mb-4'>
              <PerkItem perkId={amenity} />
            </View>
          ))
        ) : (
          <View className='w-full items-center py-6'>
            <Text className='text-grey-500 font-interMedium text-base'>
              No perks included for this apartment.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
