import { Text, View } from "react-native";
import { Button, Card, Chip, Spinner } from "heroui-native";
import { IconFileText, IconShieldCheck } from "@tabler/icons-react-native";
import { formatDate } from "@repo/utils";
import { useColors } from "@/hooks/useTheme";
import { useTenantSignedLease } from "@/hooks/tenancy/useTenantSignedLease";
import { statusChipSurface, useStatusChipStyles } from "@/hooks/useStatusChipStyles";
import { signedLeaseStatus } from "@/utils/signedLease";

interface TenantSignedLeaseCardProps {
  tenancyId: string;
  path: string | null;
  uploadedAt: string | null;
  acknowledgedAt: string | null;
  onAcknowledged: () => Promise<boolean>;
}

export default function TenantSignedLeaseCard({ tenancyId, path, uploadedAt, acknowledgedAt, onAcknowledged }: TenantSignedLeaseCardProps) {
  const { colors } = useColors();
  const styles = useStatusChipStyles();
  const form = useTenantSignedLease({ tenancyId, path, acknowledgedAt, onAcknowledged });
  const status = signedLeaseStatus(path, acknowledgedAt);
  const confirmed = status === "acknowledged" || form.saved;
  const tone = confirmed ? styles.success : status === "pending" ? styles.warning : styles.neutral;
  const label = confirmed ? "Confirmed" : status === "pending" ? "Needs your confirmation" : "Not uploaded";
  const summary = !path ? "The signed contract will appear here once your landlord uploads it."
    : acknowledgedAt ? `You confirmed this lease on ${formatDate(acknowledgedAt, "medium")}.`
    : form.saved ? "Your confirmation was saved."
    : `${uploadedAt ? `Uploaded ${formatDate(uploadedAt, "medium")}` : "On file"}. Open it and confirm it matches your agreement.`;

  return (
    <Card className="border border-border shadow-none rounded-3xl">
      <Card.Body className="gap-3">
        <View className="flex-row items-center gap-2">
          <IconFileText size={24} color={colors.primary} />
          <Text className="text-foreground font-nunitoSemiBold text-base">Signed Lease</Text>
        </View>
        <View className="items-start">
          <Chip size="sm" variant="soft" style={statusChipSurface(tone)}>
            <Chip.Label style={{ color: tone.textColor }}>{label}</Chip.Label>
          </Chip>
        </View>
        <Text className="text-muted font-inter text-sm">{summary}</Text>
        <View className="flex-row items-stretch gap-2">
          <Button size="sm" className="flex-1 min-w-0 h-auto min-h-11 px-3 py-2" variant="outline" onPress={() => void form.view()} isDisabled={!path || form.viewing || form.confirming}>
            <View testID="signed-lease-view-content" className="flex-row items-center justify-center self-center gap-2 max-w-full shrink">
              {form.viewing ? <Spinner size="sm" /> : <IconFileText size={16} color={colors.primary} />}
              <Button.Label className="shrink text-center" style={{ flexGrow: 0 }}>View document</Button.Label>
            </View>
          </Button>
          {status === "pending" && !confirmed && <Button size="sm" className="flex-1 min-w-0 h-auto min-h-11 px-3 py-2" onPress={() => void form.confirm()} isDisabled={form.confirming || form.viewing}>
            {form.confirming ? <Spinner size="sm" color="white" /> : <IconShieldCheck size={16} color="white" />}
            <Button.Label className="shrink text-center">I&apos;ve reviewed this lease</Button.Label>
          </Button>}
        </View>
        {form.error && <Text selectable accessibilityRole="alert" className="text-danger font-inter text-sm">{form.error}</Text>}
        {form.saved && form.error && <Button variant="secondary" onPress={() => void form.refresh()} isDisabled={form.confirming}>
          {form.confirming && <Spinner size="sm" />}
          <Button.Label>Refresh lease details</Button.Label>
        </Button>}
      </Card.Body>
    </Card>
  );
}
