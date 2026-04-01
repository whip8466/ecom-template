import { Playfair_Display, DM_Sans } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { buildRootMetadata } from "@/lib/brand-metadata";
import { getStorefrontThemeRootStyle } from "@/lib/contact-settings-public";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const generateMetadata = buildRootMetadata;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const storefrontThemeStyle = await getStorefrontThemeRootStyle();
  return (
    <html lang="en" style={storefrontThemeStyle}>
      <body
        className={`${playfair.variable} ${dmSans.variable} font-sans antialiased`}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
