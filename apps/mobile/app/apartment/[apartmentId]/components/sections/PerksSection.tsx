import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';

import { IconSquareCheck } from '@tabler/icons-react-native';

import PerkItem from 'components/display/PerkItem';

import { useColors } from 'hooks/useTheme';
import SectionHeader, { SeeAllButton } from '@/components/display/SectionHeader';

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
      <SectionHeader
        icon={<IconSquareCheck size={26} color={colors.textPrimary} />}
        title="Included Perks"
        subtitle="These are already included in your rent."
        action={
          (amenities?.length ?? 0) > PERKS_LIMIT ? (
            <SeeAllButton
              onPress={() => router.push(`/apartment/${apartmentId}/included-perks`)}
            />
          ) : undefined
        }
      />

      <View className='flex-row flex-wrap px-5 mt-5'>
        {hasPerks ? (
          displayAmenities?.map((amenity, index) => (
            <View key={index} className='w-1/2 mb-4'>
              <PerkItem perkId={amenity} />
            </View>
          ))
        ) : (
          <View className='w-full items-center py-6'>
            <Text className='text-gray-500 font-nunitoSemiBold text-base'>
              No perks included for this apartment.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}
