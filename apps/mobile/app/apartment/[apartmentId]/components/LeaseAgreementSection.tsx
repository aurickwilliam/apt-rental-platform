import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { IconFileDescription } from '@tabler/icons-react-native';

import PillButton from 'components/buttons/PillButton';
import { COLORS } from '@repo/constants';
import { supabase } from '@repo/supabase';

type LeaseAgreementSectionProps = {
  apartmentId: string;
  leaseAgreementUrl?: string | null;
};

export default function LeaseAgreementSection({
  apartmentId,
  leaseAgreementUrl,
}: LeaseAgreementSectionProps) {
  const router = useRouter();

  const handleLeaseAgreementNavigation = async () => {
    if (!leaseAgreementUrl) {
      Alert.alert('Not Found', 'This apartment does not have a lease agreement uploaded.');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('lease-agreements')
        .createSignedUrl(leaseAgreementUrl, 3600);

      if (error || !data?.signedUrl) throw error;

      router.push({
        pathname: '/apartment/[apartmentId]/view-lease',
        params: { apartmentId, fileUrl: data.signedUrl },
      });
    } catch (err) {
      Alert.alert('Error', 'Could not open lease agreement.');
      console.error(err);
    }
  };

  return (
    <View className='mt-10 px-5 flex gap-2'>
      <View className='flex-row items-center gap-2'>
        <IconFileDescription size={26} color={COLORS.text} />
        <Text className='font-poppinsSemiBold text-xl text-text'>
          Lease Agreement & Rules
        </Text>
      </View>

      <Text className='text-text text-base font-inter'>
        Please review the rental owner’s property rules before applying.
      </Text>

      <PillButton
        label='View Full Lease Agreement'
        type='outline'
        size='sm'
        isDisabled={!leaseAgreementUrl}
        onPress={handleLeaseAgreementNavigation}
      />
    </View>
  );
}
