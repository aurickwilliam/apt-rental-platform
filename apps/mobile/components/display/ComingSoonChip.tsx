import { Chip } from "heroui-native";

/** Neutral chip explaining why a row is unavailable without opening. */
export default function ComingSoonChip() {
  return (
    <Chip size="sm" variant="soft" color="default" animation="disable-all" className="px-2">
      <Chip.Label className="text-[11px] font-nunitoSemiBold text-muted">Coming soon</Chip.Label>
    </Chip>
  );
}
