import { View } from 'react-native';
import { IconUser } from '@tabler/icons-react-native';

import LandlordCard from 'components/cards/LandlordCard';

import { useColors } from 'hooks/useTheme';
import SectionHeader from '@/components/display/SectionHeader';
import type { ApartmentDetails } from 'hooks/apartments';

type LandlordSectionProps = {
  landlord: ApartmentDetails['landlord'];
  totalRentals?: number | null;
  onPress: () => void;
  onMessagePress: () => void;
};

export default function LandlordSection({
  landlord,
  totalRentals,
  onPress,
  onMessagePress,
}: LandlordSectionProps) {
  const { colors } = useColors();

  return (
    <>
      <SectionHeader
        icon={<IconUser size={26} color={colors.textPrimary} />}
        title="Meet Your Rental Owner"
      />

      <View className='px-5 mt-3'>
        <LandlordCard
          fullName={`${landlord?.first_name} ${landlord?.last_name}`}
          email={landlord?.email ?? 'N/A'}
          phoneNumber={landlord?.mobile_number ?? 'N/A'}
          totalRentals={totalRentals ?? undefined}
          onPress={onPress}
          onMessagePress={onMessagePress}
        />
      </View>
    </>
  );
}
