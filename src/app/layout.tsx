import type { Metadata } from "next";
import { Inter, Sora, Manrope } from "next/font/google";
import "./globals.css";
import { orgInfo } from "@/lib/org-info";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: orgInfo.homepageTitle,
  description: orgInfo.homepageDescription,
  keywords: ["charity", "non-profit", "lovecry", "Toronto", "youth support", "child welfare", "registered Canadian charity"],
  metadataBase: new URL(orgInfo.websiteHref),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    title: orgInfo.homepageTitle,
    description: orgInfo.homepageDescription,
    type: "website",
    url: orgInfo.websiteHref,
    images: [
      {
        url: "/LoveCryLogo.png",
        width: 512,
        height: 512,
        alt: "LoveCry The Street Kids Organization",
      },
    ],
  },
};

import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FluidCursor from "@/components/FluidCursor";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import FixedPortalActions from "@/components/FixedPortalActions";
import { IntroProvider } from "@/context/IntroContext";
import { MarketplaceCartProvider } from "@/context/MarketplaceCartContext";
import IntroRouteSync from "@/components/IntroRouteSync";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${manrope.variable} antialiased`} suppressHydrationWarning>
      <body className={`min-h-screen bg-[#050505] font-sans selection:bg-brand-pink/30 selection:text-white ${sora.variable} ${manrope.variable}`}>
        <IntroProvider>
          <MarketplaceCartProvider>
            <IntroRouteSync />
            <OrganizationJsonLd />
            <FluidCursor />
            <Navbar />
            <FixedPortalActions />
            <SmoothScroll>
              <main>{children}</main>
            </SmoothScroll>
            <Footer />
          </MarketplaceCartProvider>
        </IntroProvider>
      </body>
    </html>
  );
}
