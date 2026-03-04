import { heroui } from "@heroui/react";

export default heroui({
  themes: {
    light: {
      colors: {
        primary: {
          DEFAULT: "#376BF5",  // --color-primary
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FFA500",  // --color-secondary
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#22C55E",  // --color-green-500
          "100": "#E6F4EA",    // --color-green-100
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#FACC15",  // --color-yellow-500
          "100": "#FFF8E1",    // --color-yellow-100
          foreground: "#333333",
        },
        danger: {
          DEFAULT: "#E50914",  // --color-red-600
          "400": "#FF4B4B",    // --color-red-400
          "200": "#FDA4AF",    // --color-red-200
          foreground: "#FFFFFF",
        },
        default: {
          DEFAULT: "#9CA3AF",  // --color-grey-500
          "700": "#6C757D",    // --color-grey-700
          "500": "#9CA3AF",    // --color-grey-500
          "400": "#BDBDBD",    // --color-grey-400
          "300": "#D1D5DB",    // --color-grey-300
          "200": "#E5E7EB",    // --color-grey-200
          foreground: "#333333",
        },
        background: "#FFFFFF",    // --color-white
        foreground: "#333333",    // --color-black
      },
    },
    dark: {
      colors: {
        primary: {
          DEFAULT: "#638DF7",  // lighter shade of --color-primary for dark bg
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#FFB733",  // lighter shade of --color-secondary for dark bg
          foreground: "#1A1A1A",
        },
        success: {
          DEFAULT: "#4ADE80",  // lighter green for dark bg
          "100": "#14532D",    // dark green tint for badges/chips
          foreground: "#1A1A1A",
        },
        warning: {
          DEFAULT: "#FDE047",  // lighter yellow for dark bg
          "100": "#422006",    // dark yellow tint for badges/chips
          foreground: "#1A1A1A",
        },
        danger: {
          DEFAULT: "#FF4B4B",  // --color-red-400 as default on dark bg
          "400": "#E50914",    // --color-red-600
          "200": "#7F1D1D",    // dark red tint
          foreground: "#FFFFFF",
        },
        default: {
          DEFAULT: "#6C757D",  // --color-grey-700
          "700": "#E5E7EB",    // --color-grey-200 (inverted for dark)
          "500": "#9CA3AF",    // --color-grey-500
          "400": "#6C757D",    // --color-grey-700
          "300": "#3D4248",    // dark surface border
          "200": "#2A2D31",    // dark surface subtle
          foreground: "#F8F9FA",
        },
        background: "#1A1A1A",    // deep dark background
        foreground: "#F8F9FA",    // --color-darker-white for text
        content1: "#242424",      // card / surface background
        content2: "#2A2D31",      // nested surface
        content3: "#3D4248",      // deeper nested surface
        content4: "#4A5057",      // deepest nested surface
      },
    },
  },
});
