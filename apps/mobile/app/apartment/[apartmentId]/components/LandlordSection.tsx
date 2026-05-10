import { View, Text } from 'react-native';
import { IconUser } from '@tabler/icons-react-native';

import LandlordCard from 'components/cards/LandlordCard';

import { COLORS } from '@repo/constants';

import type { ApartmentDetails } from '@/hooks/useApartmentDetails';

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
    <>
      <View className='flex-row items-center gap-2 mt-10 px-5'>
        <IconUser size={26} color={COLORS.text} />
        <Text className='font-poppinsSemiBold text-xl text-text'>
          Meet Your Rental Owner
        </Text>
      </View>

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
