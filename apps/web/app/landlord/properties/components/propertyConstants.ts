import type { StatusTone } from "@/lib/status-tone";

export const CITIES = ["Caloocan", "Malabon", "Navotas", "Valenzuela"];

export const STATUS_COLOR: Record<string, StatusTone> = {
  verified: "success",
  unverified: "warning",
  occupied: "neutral",
};
