import { Text, View } from "react-native";
import { Button, Card, Chip, Spinner } from "heroui-native";
import { IconFileText, IconFileUpload } from "@tabler/icons-react-native";
import { formatDate } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import { statusChipSurface, useStatusChipStyles } from "@/hooks/useStatusChipStyles";
import { useSignedLease } from "@/hooks/tenancy/useSignedLease";
import { signedLeaseStatus } from "@/utils/signedLease";
import SignedLeaseDialog from "./SignedLeaseDialog";

interface LandlordSignedLeaseCardProps {
  tenancyId: string;
  path: string | null;
  uploadedAt: string | null;
  acknowledgedAt: string | null;
  onSaved: () => Promise<void>;
}

export default function LandlordSignedLeaseCard({ tenancyId, path, uploadedAt, acknowledgedAt, onSaved }: LandlordSignedLeaseCardProps) {
  const { colors } = useColors();
  const styles = useStatusChipStyles();
  const form = useSignedLease({ tenancyId, path, onSaved });
  const status = signedLeaseStatus(path, acknowledgedAt);
  const tone = status === "acknowledged" ? styles.success : status === "pending" ? styles.warning : styles.neutral;
  const label = status === "acknowledged" ? "Confirmed" : status === "pending" ? "Awaiting tenant" : "Not uploaded";
  const description = !path
    ? "Upload the contract both parties signed so the tenant can review and confirm it."
    : `${uploadedAt ? `Uploaded ${formatDate(uploadedAt, "medium")}` : "On file"} · ${acknowledgedAt
      ? `Confirmed by the tenant ${formatDate(acknowledgedAt, "medium")}` : "The tenant has not confirmed it yet."}`;

  return (
    <>
      <Card className="border border-border shadow-none rounded-3xl">
        <Card.Body className="gap-3">
          <View className="flex-row flex-wrap items-center gap-2">
            <IconFileText size={24} color={colors.primary} />
            <Text className="text-foreground font-nunitoSemiBold text-base flex-1">Signed Lease</Text>
            <Chip size="sm" variant="soft" style={statusChipSurface(tone)}>
              <Chip.Label style={{ color: tone.textColor }}>{label}</Chip.Label>
            </Chip>
          </View>
          <Text className="text-muted font-inter text-sm">{description}</Text>
          <View className="flex-row gap-2">
            <Button variant="outline" size="sm" className="flex-1" onPress={form.open} isDisabled={form.busy || form.viewing}>
              <IconFileUpload size={16} color={colors.primary} /><Button.Label>{path ? "Replace" : "Upload"}</Button.Label>
            </Button>
            <Button variant="secondary" size="sm" className="flex-1" onPress={() => void form.view()} isDisabled={!path || form.viewing || form.busy}>
              {form.viewing ? <Spinner size="sm" /> : <IconFileText size={16} color={colors.textPrimary} />}
              <Button.Label>View</Button.Label>
            </Button>
          </View>
        </Card.Body>
      </Card>
      <SignedLeaseDialog form={form} isReplacing={!!path} currentDescription={description} />
    </>
  );
}
