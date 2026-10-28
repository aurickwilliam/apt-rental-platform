import { View, Text } from "react-native";

import { IconShieldCheckFilled } from "@tabler/icons-react-native";

import { statusChipSurface, useStatusChipStyles } from "@/hooks/useStatusChipStyles";

interface VerifiedDocumentsCardProps {
  documentTypes: string[];
}

/** "Verified on APT Passport" chips for a landlord's approved ownership documents. */
export default function VerifiedDocumentsCard({ documentTypes }: VerifiedDocumentsCardProps) {
  const { success } = useStatusChipStyles();

  return (
    <View className="mx-5 mt-5 bg-surface rounded-3xl border border-border shadow-none p-4 gap-3">
      <Text className="text-base text-foreground font-nunitoBold">
        Verified on APT Passport
      </Text>
      {documentTypes.length === 0 ? (
        <Text className="text-sm text-muted font-inter">
          This landlord hasn&apos;t had an ownership document verified yet.
        </Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {documentTypes.map((docType) => (
            <View
              key={docType}
              className="flex-row items-center gap-1 rounded-full px-3 py-1"
              style={statusChipSurface(success)}
            >
              <IconShieldCheckFilled size={14} color={success.textColor} />
              <Text className="font-nunitoSemiBold text-xs" style={{ color: success.textColor }}>
                {docType}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
