import { View } from "react-native";
import { IconFileText } from "@tabler/icons-react-native";

import { Button } from "heroui-native";

import { useColors } from "hooks/useTheme";
import SectionHeader from "@/components/display/SectionHeader";
import SectionCard from "../SectionCard";
import { useLeaseAgreement } from "@/hooks/apartments";

type LeaseAgreementSectionProps = {
  leaseAgreementUrl?: string | null;
};

export default function LeaseAgreementSection({
  leaseAgreementUrl,
}: LeaseAgreementSectionProps) {
  const { colors } = useColors();
  const { openLeaseAgreement, isLoading } = useLeaseAgreement();

  return (
    <SectionCard className="gap-3">
      <SectionHeader
        icon={<IconFileText size={26} color={colors.textPrimary} />}
        title="Lease Agreement & Rules"
        subtitle="Please review the rental owner's property rules before applying."
        className="p-0 mt-0"
      />
      <Button
        variant="tertiary"
        className="w-full"
        onPress={() => openLeaseAgreement(leaseAgreementUrl)}
        isDisabled={!leaseAgreementUrl || isLoading}
      >
        <View className="max-w-full self-center flex-row items-center justify-center gap-2">
          <View
            className="size-5 shrink-0 items-center justify-center"
            accessible={false}
          >
            <IconFileText
              size={20}
              color={colors.textPrimary}
              accessible={false}
            />
          </View>
          <Button.Label className="shrink-0 grow-0 text-center">
            View Full Lease Agreement
          </Button.Label>
        </View>
      </Button>
    </SectionCard>
  );
}
