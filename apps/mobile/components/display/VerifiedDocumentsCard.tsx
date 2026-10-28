import { View, Text } from "react-native";

import { IconShieldCheckFilled, IconShieldX } from "@tabler/icons-react-native";

import type { LandlordOwnershipDocument } from "@repo/constants";

import { statusChipSurface, useStatusChipStyles } from "@/hooks/useStatusChipStyles";

interface VerifiedDocumentsCardProps {
  documents: LandlordOwnershipDocument[];
}

/** A landlord's ownership documents as chips: green when verified, neutral when not yet. */
export default function VerifiedDocumentsCard({ documents }: VerifiedDocumentsCardProps) {
  const { success, neutral } = useStatusChipStyles();

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
        <View className="flex-row flex-wrap gap-2">
          {documents.map(({ docType, isVerified }) => {
            const style = isVerified ? success : neutral;
            return (
              <View
                key={docType}
                accessible
                accessibilityLabel={`${docType}, ${isVerified ? "verified" : "not verified"}`}
                className="flex-row items-center gap-1 rounded-full px-3 py-1"
                style={statusChipSurface(style)}
              >
                {isVerified ? (
                  <IconShieldCheckFilled size={14} color={style.textColor} />
                ) : (
                  <IconShieldX size={14} color={style.textColor} />
                )}
                <Text className="font-nunitoSemiBold text-xs" style={{ color: style.textColor }}>
                  {docType}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
