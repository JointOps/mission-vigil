import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Big_Shoulders, Big_Shoulders_Stencil } from "next/font/google";
import { DESCRIPTION, NAME, REPO, SITE } from "@/engine/story";
import "./globals.css";

// Atkinson Hyperlegible is built for easy reading, which suits a student audience.
// Big Shoulders echoes the stencilled lettering on flight hardware.
// next/font has no fallback metrics for these faces, so that adjustment is off.
const body = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--ff-body", adjustFontFallback: false });
const display = Big_Shoulders({ subsets: ["latin"], variable: "--ff-display", adjustFontFallback: false });
const stencil = Big_Shoulders_Stencil({ subsets: ["latin"], variable: "--ff-stencil", adjustFontFallback: false });

// The share image is app/opengraph-image.jpg, the icons are app/icon.svg and app/apple-icon.tsx;
// metadataBase makes their URLs absolute. Each page sets its own canonical URL.
export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: NAME, template: `%s · ${NAME}` },
  description: DESCRIPTION,
  applicationName: NAME,
  authors: [{ name: "Team JointOps", url: REPO }],
  creator: "Team JointOps",
  category: "education",
  openGraph: { type: "website", siteName: NAME, title: NAME, description: DESCRIPTION, locale: "en_US" },
  twitter: { card: "summary_large_image", title: NAME, description: DESCRIPTION },
};

export const viewport: Viewport = { themeColor: "#1c0f0b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${stencil.variable}`}>
      <body>{children}</body>
    </html>
  );
}
