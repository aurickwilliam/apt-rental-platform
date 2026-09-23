// apps/web/app/(main)/tenant/maintenance/data/maintenance-data.ts
import { MAINTENANCE_CATEGORIES } from "@repo/constants";

export type Category = { id: string; label: string };

export const FORM_LIMITS = {
  maxFiles: 5,
  maxFileSizeMB: 10,
} as const;

export const CATEGORIES: Category[] = MAINTENANCE_CATEGORIES.map((cat) => ({
  id: cat.value,
  label: cat.label,
}));
 

 