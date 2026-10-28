import { View, Text } from "react-native";

import { IconShieldCheckFilled, IconShieldX } from "@tabler/icons-react-native";

import type { LandlordOwnershipDocument } from "@repo/constants";

import { useColors } from "@/hooks/useTheme";
import { useStatusChipStyles } from "@/hooks/useStatusChipStyles";

interface VerifiedDocumentsCardProps {
  documents: LandlordOwnershipDocument[];
}

/** A landlord's ownership documents, each with a verified / not verified icon before its name. */
export default function VerifiedDocumentsCard({ documents }: VerifiedDocumentsCardProps) {
  const { colors } = useColors();
  const { success } = useStatusChipStyles();

  return (
    <View className="mx-5 mt-5 bg-surface rounded-3xl border border-border shadow-none p-4 gap-3">
      <Text className="text-base text-foreground font-nunitoBold">
        Verified on APT Passport
      </Text>
      {documents.length === 0 ? (
        <Text className="text-sm text-muted font-inter">
          This landlord hasn&apos;t added an ownership document yet.
        </Text>
      ) : (
        documents.map(({ docType, isVerified }) => (
          <View
            key={docType}
            accessible
            accessibilityLabel={`${docType}, ${isVerified ? "verified" : "not verified"}`}
            className="flex-row items-center gap-3"
          >
            {isVerified ? (
              <IconShieldCheckFilled size={20} color={success.textColor} />
            ) : (
              <IconShieldX size={20} color={colors.textPrimary} style={{ opacity: 0.5 }} />
            )}
            <Text className="flex-1 text-sm text-foreground font-nunitoSemiBold">
              {docType}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}
