import { View } from 'react-native';

import LandlordCard from 'components/cards/LandlordCard';

import type { ApartmentDetails } from 'hooks/apartments';

type LandlordSectionProps = {
  landlord: ApartmentDetails['landlord'];
  /** Omitted for a listing preview, which leaves the card inert. */
  onPress?: () => void;
  onMessagePress?: () => void;
};

export default function LandlordSection({
  landlord,
  onPress,
  onMessagePress,
}: LandlordSectionProps) {
  const fullName = [landlord?.first_name, landlord?.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <View className='px-5'>
      <LandlordCard
        fullName={fullName || 'Landlord'}
        profilePictureUrl={landlord?.avatar_url}
        onPress={onPress}
        onMessagePress={onMessagePress}
      />
    </View>
  );
}
