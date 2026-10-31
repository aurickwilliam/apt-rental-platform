import localFont from "next/font/local";

// Byte-for-byte copies of the app's font files; scoped to the preview only.
export const demoInter = localFont({
  src: "./fonts/Inter_24pt-Regular.ttf",
  weight: "400",
  variable: "--demo-inter",
  display: "swap",
});

export const demoNunito = localFont({
  src: [
    { path: "./fonts/Nunito-Regular.ttf", weight: "400" },
    { path: "./fonts/Nunito-SemiBold.ttf", weight: "600" },
    { path: "./fonts/Nunito-Bold.ttf", weight: "700" },
  ],
  variable: "--demo-nunito",
  display: "swap",
});
