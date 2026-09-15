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

/**
 * Absolute base for social-preview URLs. `/ateliere/[slug]` gives Open Graph a
 * workshop photograph as a ROOT-RELATIVE path, and without this Next resolves
 * it against `http://localhost:3000` and says so in the build log — every
 * shared link would carry a preview image nobody else can load.
 *
 * Read from the environment rather than hard-coded because the domain is still
 * open (TODO.md): Vercel injects the production hostname itself, so this is
 * already right on the deployment and stays right if the domain changes.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
