import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import localFont from "next/font/local";
import { Providers } from "./providers";
import { themeInitScript } from "./theme-init-script";
import { LocaleProvider } from "./components/i18n/LocaleProvider";
import { getServerLocale } from "@/lib/i18n/locale";

// Self-hosted Nunito + Inter, subset to the latin range as woff2 from the
// same TTFs the mobile app bundles (`apps/mobile/assets/fonts`, the canonical
// set in `packages/constants` typography.ts). The Google font loader used to
// download fonts from Google at build time — a failed or partially cached
// fetch left a broken `@vercel/turbopack-next/internal/font/google/font`
// mapping behind and 500'd every page until .next was wiped (Nov 2026), so
// the root layout reads these local files instead. If a new weight is ever
// needed, add another subset file alongside the others.
const inter = localFont({
  src: [
    { path: "./fonts/inter-24pt-regular.woff2", weight: "400" },
    { path: "./fonts/inter-24pt-medium.woff2", weight: "500" },
    { path: "./fonts/inter-24pt-semibold.woff2", weight: "600" },
  ],
  variable: "--font-inter-face",
});

const nunito = localFont({
  src: [
    { path: "./fonts/nunito-regular.woff2", weight: "400" },
    { path: "./fonts/nunito-medium.woff2", weight: "500" },
    { path: "./fonts/nunito-semibold.woff2", weight: "600" },
    { path: "./fonts/nunito-bold.woff2", weight: "700" },
  ],
  variable: "--font-nunito-face",
});

export const metadata: Metadata = {
  title: "APT - Apartment Rental Platform",
  description: "Apartment rental platform connecting renters and landlords for seamless housing solutions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Cookie → Accept-Language → English. Reading it here makes every route
  // dynamic, which is the accepted cost of a correct `lang` on first byte and
  // no flash of English for a visitor who already chose Filipino.
  const language = await getServerLocale();

  return (
    <html
      lang={language}
      suppressHydrationWarning
      className={`${inter.variable} ${nunito.variable}`}
    >
      <head>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body suppressHydrationWarning>
        <LocaleProvider initialLanguage={language}>
          <Providers>{children}</Providers>
        </LocaleProvider>
      </body>
    </html>
  );
}
