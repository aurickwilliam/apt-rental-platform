import { View } from 'react-native';

import LandlordCard from 'components/cards/LandlordCard';
import VerifiedLandlordChip from 'components/display/VerifiedLandlordChip';

import { useVerifiedLandlord } from 'hooks/profiles';

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
  const isVerifiedLandlord = useVerifiedLandlord(landlord?.id);
  const fullName = [landlord?.first_name, landlord?.last_name]
    .filter(Boolean)
    .join(' ');

  return (
    <View className='px-5'>
      <LandlordCard
        appearance="card"
        fullName={fullName || 'Landlord'}
        profilePictureUrl={landlord?.avatar_url}
        onPress={onPress}
        onMessagePress={onMessagePress}
      />
      {isVerifiedLandlord && (
        <View className='mt-2'>
          <VerifiedLandlordChip />
        </View>
      )}
    </View>
  );
}
