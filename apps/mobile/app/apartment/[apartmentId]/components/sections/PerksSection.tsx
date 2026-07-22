import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

import { SquareCheckBig } from 'lucide-react-native';

import PerkItem from 'components/display/PerkItem';

import { useColors } from 'hooks/useTheme';

const PERKS_LIMIT = 10;

type PerksSectionProps = {
  apartmentId: string;
  amenities?: string[] | null;
};

export default function PerksSection({ apartmentId, amenities }: PerksSectionProps) {
  const { colors } = useColors();
  const router = useRouter();

  const hasPerks = (amenities?.length ?? 0) > 0;
  const displayAmenities = amenities?.slice(0, PERKS_LIMIT);

  return (
    <>
      <View className='mt-10 px-5 flex gap-2'>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center gap-2'>
            <SquareCheckBig size={26} color={colors.textPrimary} />
            <Text className='font-interSemiBold text-lg text-foreground'>
              Included Perks
            </Text>
          </View>

          {(amenities?.length ?? 0) > PERKS_LIMIT && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/apartment/${apartmentId}/included-perks`)}
            >
              <Text className='font-interMedium text-sm text-accent'>
                See All
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text className='text-muted font-inter text-sm'>
          These are already included in your rent.
        </Text>
      </View>

      <View className='flex-row flex-wrap px-5 mt-5'>
        {hasPerks ? (
          displayAmenities?.map((amenity, index) => (
            <View key={index} className='w-1/2 mb-4'>
              <PerkItem perkId={amenity} />
            </View>
          ))
        ) : (
          <View className='w-full items-center py-6'>
            <Text className='text-gray-500 font-interMedium text-base'>
              No perks included for this apartment.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
