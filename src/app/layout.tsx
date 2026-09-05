import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

// latin-ext is required for Romanian ș/ț — they are comma-below glyphs, not
// cedillas, and the latin subset alone renders them as tofu on some devices.
const display = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const body = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Întâlnirea Tineretului Greco-Catolic · Blaj 2026",
    template: "%s · Blaj 2026",
  },
  description:
    "Întâlnirea tinerilor greco-catolici din Transilvania. Blaj, 2026.",
  openGraph: {
    title: "Întâlnirea Tineretului Greco-Catolic · Blaj 2026",
    description:
      "Întâlnirea tinerilor greco-catolici din Transilvania. Blaj, 2026.",
    type: "website",
    locale: "ro_RO",
  },
};

export const viewport: Viewport = {
  // Matches --background. Browser chrome should disappear into the page.
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  // The hero runs edge to edge behind the notch on iOS.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ro"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
