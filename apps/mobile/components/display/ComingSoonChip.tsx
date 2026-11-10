import { Chip } from "heroui-native";

import { useTranslation } from "@/hooks/i18n";

/** Neutral chip explaining why a row is unavailable without opening. */
export default function ComingSoonChip() {
  const { t } = useTranslation();
  return (
    <Chip size="sm" variant="soft" color="default" animation="disable-all" className="px-2">
      <Chip.Label className="text-[11px] font-nunitoSemiBold text-muted">{t("common.comingSoon")}</Chip.Label>
    </Chip>
  );
}
