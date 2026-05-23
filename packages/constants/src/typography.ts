export const FONT_FAMILIES = {
  inter: {
    regular: "Inter_24pt-Regular",
    medium: "Inter_24pt-Medium",
    semiBold: "Inter_24pt-SemiBold",
  },
  nunito: {
    regular: "Nunito-Regular",
    medium: "Nunito-Medium",
    semiBold: "Nunito-SemiBold",
    bold: "Nunito-Bold",
  },
} as const;

export const THEME_FONTS = {
  body: FONT_FAMILIES.inter.regular,
  bodyMedium: FONT_FAMILIES.inter.medium,
  bodySemiBold: FONT_FAMILIES.inter.semiBold,
  heading: FONT_FAMILIES.nunito.regular,
  headingMedium: FONT_FAMILIES.nunito.medium,
  headingSemiBold: FONT_FAMILIES.nunito.semiBold,
  headingBold: FONT_FAMILIES.nunito.bold,
} as const;

export const THEME_FONTS_WEB = {
  body: "font-inter",
  bodyMedium: "font-inter font-medium",
  bodySemiBold: "font-inter font-semibold",
  heading: "font-nunito",
  headingMedium: "font-nunito font-medium",
  headingSemiBold: "font-nunito font-semibold",
  headingBold: "font-nunito font-bold",
} as const;
