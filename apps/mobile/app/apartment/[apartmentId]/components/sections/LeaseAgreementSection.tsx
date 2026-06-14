import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';

import { FileText } from 'lucide-react-native';

import { Button } from "heroui-native"

import { supabase } from '@repo/supabase';

import { useColors } from 'hooks/useTheme';

type LeaseAgreementSectionProps = {
  apartmentId: string;
  leaseAgreementUrl?: string | null;
};

export default function LeaseAgreementSection({
  apartmentId,
  leaseAgreementUrl,
}: LeaseAgreementSectionProps) {
  const router = useRouter();
  const { colors } = useColors();

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
        <FileText size={26} color={colors.textPrimary} />
        <Text className='font-interSemiBold text-lg text-foreground'>
          Lease Agreement & Rules
        </Text>
      </View>

      <Text className='text-muted text-sm font-inter'>
        Please review the rental owner’s property rules before applying.
      </Text>

      <Button
        size="sm"
        variant="tertiary"
        onPress={handleLeaseAgreementNavigation}
        isDisabled={!leaseAgreementUrl}
      >
        <Button.Label>
          View Full Lease Agreement
        </Button.Label>
      </Button>
    </View>
  );
}
