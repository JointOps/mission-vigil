import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Big_Shoulders, Big_Shoulders_Stencil } from "next/font/google";
import { NAME } from "@/engine/story";
import "./globals.css";

// Atkinson Hyperlegible is built for easy reading, which suits a student audience.
// Big Shoulders echoes the stencilled lettering on flight hardware.
// next/font has no fallback metrics for these faces, so that adjustment is off.
const body = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--ff-body", adjustFontFallback: false });
const display = Big_Shoulders({ subsets: ["latin"], variable: "--ff-display", adjustFontFallback: false });
const stencil = Big_Shoulders_Stencil({ subsets: ["latin"], variable: "--ff-stencil", adjustFontFallback: false });

const description = "Wake up alone in a Mars outpost and keep it alive. A mission trainer built on NASA research.";

// The share image is app/opengraph-image.jpg; metadataBase makes its URL absolute.
export const metadata: Metadata = {
  metadataBase: new URL("https://mission-vigil.vercel.app"),
  title: NAME,
  description,
  openGraph: { title: NAME, description },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${stencil.variable}`}>
      <body>{children}</body>
    </html>
  );
}
