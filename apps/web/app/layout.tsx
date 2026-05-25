import "./globals.css";
import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "APT - Apartment Rental Platform",
  description: "Apartment rental platform connecting renters and landlords for seamless housing solutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${nunito.variable}`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
