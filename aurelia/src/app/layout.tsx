import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Inter, Cairo } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AURELIA — Authorized Boutique · Haute Horlogerie in 3D",
  description:
    "Four legendary references, procedurally built and rendered in real-time 3D. Configure yours live.",
  applicationName: "AURELIA",
  keywords: ["AURELIA", "haute horlogerie", "3D watch configurator", "boutique"],
  openGraph: {
    type: "website",
    siteName: "AURELIA",
    title: "AURELIA — Haute Horlogerie in 3D",
    description: "Four legendary references, procedurally built and rendered in real-time 3D.",
  },
  twitter: {
    card: "summary",
    title: "AURELIA — Haute Horlogerie in 3D",
    description: "Four legendary references, procedurally built and rendered in real-time 3D.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#f4f0e6" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={`${cormorant.variable} ${inter.variable} ${cairo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
