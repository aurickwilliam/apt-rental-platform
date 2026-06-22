import { useRef, useState } from 'react';
import { View, Text, Alert, Linking } from 'react-native';

import { FileText } from 'lucide-react-native';

import { Button } from "heroui-native"

import { supabase } from '@repo/supabase';

import { useColors } from 'hooks/useTheme';

// Signed URLs are valid for 1 hour; refresh 5 min before expiry
const TTL_MS = 55 * 60 * 1000;

type LeaseAgreementSectionProps = {
  leaseAgreementUrl?: string | null;
};

export default function LeaseAgreementSection({
  leaseAgreementUrl,
}: LeaseAgreementSectionProps) {
  const { colors } = useColors();
  const cachedUrl = useRef<string | null>(null);
  const cacheExpiry = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpen = async () => {
    if (!leaseAgreementUrl) return;

    // Reuse cached signed URL if still valid
    if (cachedUrl.current && Date.now() < cacheExpiry.current) {
      Linking.openURL(cachedUrl.current);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('lease-agreements')
        .createSignedUrl(leaseAgreementUrl, 3600);
      if (error || !data?.signedUrl) throw error;

      cachedUrl.current = data.signedUrl;
      cacheExpiry.current = Date.now() + TTL_MS;

      Linking.openURL(data.signedUrl);
    } catch (err) {
      Alert.alert('Error', 'Could not open lease agreement.');
      console.error(err);
    } finally {
      setIsLoading(false);
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
        Please review the rental owner&apos;s property rules before applying.
      </Text>
      <Button
        size="sm"
        variant="tertiary"
        onPress={handleOpen}
        isDisabled={!leaseAgreementUrl || isLoading}
      >
        <Button.Label>
          View Full Lease Agreement
        </Button.Label>
      </Button>
    </View>
  );
}
