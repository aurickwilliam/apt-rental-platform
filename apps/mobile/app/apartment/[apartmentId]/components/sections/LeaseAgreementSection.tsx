import { View } from 'react-native';

import { IconFileText } from '@tabler/icons-react-native';

import { Button } from "heroui-native"

import { useColors } from 'hooks/useTheme';
import SectionHeader from '@/components/display/SectionHeader';
import { useLeaseAgreement } from '@/hooks/apartments';

type LeaseAgreementSectionProps = {
  leaseAgreementUrl?: string | null;
};

export default function LeaseAgreementSection({
  leaseAgreementUrl,
}: LeaseAgreementSectionProps) {
  const { colors } = useColors();
  const { openLeaseAgreement, isLoading } = useLeaseAgreement();

  return (
    <View className="mt-10 px-5 flex gap-2">
      <SectionHeader
        icon={<IconFileText size={26} color={colors.textPrimary} />}
        title="Lease Agreement & Rules"
        subtitle="Please review the rental owner&apos;s property rules before applying."
        className="p-0 mt-0"
      />
      <Button
        size="sm"
        variant="tertiary"
        onPress={() => openLeaseAgreement(leaseAgreementUrl)}
        isDisabled={!leaseAgreementUrl || isLoading}
      >
        <Button.Label>View Full Lease Agreement</Button.Label>
      </Button>
    </View>
  );
}
