import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { COLORS } from "@repo/constants";

import { MOBILE_COLORS } from "./theme";

const css = readFileSync(resolve(__dirname, "../app/global.css"), "utf8");
const tokens = JSON.parse(readFileSync(resolve(__dirname, "../../../design-tokens.json"), "utf8"));

it("styles actual HeroUI label text consistently without changing input typography", () => {
  const label = css.match(/\.label__text\s*\{([^}]+)\}/)![1];
  expect(label).toContain("font-family: var(--font-nunitoSemiBold)");
  expect(label).toContain("font-size: var(--text-base)");
  expect(label).toContain("line-height: var(--text-base--line-height)");
  expect(label).toContain("color: var(--foreground)");
  const invalid = css.match(/\.label__text--is-invalid\s*\{([^}]+)\}/)![1];
  expect(invalid).toContain("color: var(--danger)");
  expect(css.indexOf(".label__text--is-invalid {")).toBeGreaterThan(
    css.indexOf(".label__text {"),
  );
});

function declarations(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2].trim()]),
  );
}

function themeVariables(theme: "light" | "dark") {
  const base = declarations(css.match(/@theme\s*\{([^}]+)\}/)![1]);
  const variant = declarations(css.match(new RegExp(`@variant ${theme}\\s*\\{([^}]+)\\}`))![1]);
  const variables: Record<string, string> = { "--white": "#FFFFFF", ...base, ...variant };
  const value = (name: string): string => {
    const raw = variables[name];
    const reference = raw?.match(/^var\((--[\w-]+)\)$/);
    return reference ? value(reference[1]) : raw;
  };
  return value;
}

function luminance(hex: string) {
  const channels = hex.slice(1).match(/../g)!.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground: string, background: string) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe.each(["light", "dark"] as const)("%s mobile palette", (theme) => {
  const colors = MOBILE_COLORS[theme];
  const value = themeVariables(theme);
  const roles = {
    background: "background",
    groupedBackground: "color-grouped-background",
    surface: "surface",
    surfaceSecondary: "surface-secondary",
    surfaceTertiary: "surface-tertiary",
    overlay: "overlay",
    border: "border",
    textPrimary: "foreground",
    textSecondary: "muted",
    gray500: "color-gray-500",
  } as const;

  it("keeps inline colors, CSS and documented mobile tokens aligned", () => {
    for (const [role, variable] of Object.entries(roles)) {
      expect(value(`--${variable}`)).toBe(colors[role as keyof typeof roles]);
    }
    for (const role of ["background", "groupedBackground", "surface", "surfaceSecondary", "surfaceTertiary", "overlay", "border"] as const) {
      expect(tokens.colors.mobileTheme[theme][role]).toBe(colors[role]);
    }
    expect(tokens.colors.mobileTheme[theme].muted).toBe(colors.textSecondary);
    expect(tokens.colors.mobileTheme[theme].accent).toBe(value("--accent"));
  });

  it("keeps normal text readable on every neutral surface", () => {
    for (const background of [colors.background, colors.surface, colors.surfaceSecondary, colors.surfaceTertiary, colors.overlay]) {
      expect(contrast(colors.textPrimary, background)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(colors.textSecondary, background)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(value("--accent"), colors.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(value("--accent"), colors.background)).toBeGreaterThanOrEqual(4.5);
  });

  it("separates screens, cards and muted fills without changing shared brand colors", () => {
    expect(colors.background).not.toBe(colors.surface);
    expect(colors.surface).not.toBe(colors.surfaceTertiary);
    expect(colors.groupedBackground).not.toBe(colors.overlay);
    expect(colors.primary).toBe(COLORS[theme].primary);
    expect(colors.success).toBe(COLORS[theme].success);
  });
});

it("uses the requested cool-gray background, white cards and subtle borders in light mode", () => {
  expect(MOBILE_COLORS.light).toMatchObject({
    background: "#F5F7FB",
    groupedBackground: "#F5F7FB",
    surface: "#FFFFFF",
    border: "#E5EAF2",
  });
});
