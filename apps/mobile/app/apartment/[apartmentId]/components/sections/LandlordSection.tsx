import { View } from 'react-native';

import LandlordCard from 'components/cards/LandlordCard';

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
  return (
    <View className='px-5'>
      <LandlordCard
        fullName={`${landlord?.first_name} ${landlord?.last_name}`}
        totalRentals={totalRentals ?? undefined}
        onPress={onPress}
        onMessagePress={onMessagePress}
      />
    </View>
  );
}
