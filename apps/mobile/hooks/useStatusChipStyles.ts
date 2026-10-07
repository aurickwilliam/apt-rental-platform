import { useColors } from "@/hooks/useTheme";
import { STATUS_COLORS } from "@repo/constants";

export function useStatusChipStyles() {
  const { isDark } = useColors();
  return isDark ? STATUS_COLORS.dark : STATUS_COLORS.light;
}

export type StatusChipStyle = ReturnType<typeof useStatusChipStyles>["success"];

export function statusChipSurface(style: StatusChipStyle) {
  return {
    backgroundColor: style.backgroundColor,
    borderColor: style.borderColor,
    borderWidth: 1,
  };
}
