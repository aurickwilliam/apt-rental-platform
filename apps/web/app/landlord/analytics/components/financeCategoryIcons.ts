import type { ComponentType } from "react";
import {
  IconArmchair,
  IconBolt,
  IconCreditCard,
  IconDoorExit,
  IconDots,
  IconLifebuoy,
  IconPaint,
  IconReceiptTax,
  IconShield,
  IconTool,
} from "@tabler/icons-react";
import type { FinanceCategory } from "@repo/utils";

/** One recognizable icon per finance category, for headers and tiles. */
export const FINANCE_CATEGORY_ICONS: Record<
  FinanceCategory,
  ComponentType<{ size?: number; "aria-hidden"?: boolean }>
> = {
  maintenance: IconTool,
  furniture: IconArmchair,
  turnover: IconPaint,
  insurance: IconShield,
  taxes: IconReceiptTax,
  utilities: IconBolt,
  fees: IconCreditCard,
  emergency: IconLifebuoy,
  vacancy: IconDoorExit,
  other: IconDots,
};
