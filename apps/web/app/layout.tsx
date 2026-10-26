import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter, Nunito } from "next/font/google";
import { Providers } from "./providers";
import { themeInitScript } from "./theme-init-script";
import { LocaleProvider } from "./components/i18n/LocaleProvider";
import { getServerLocale } from "@/lib/i18n/locale";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter-face",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
