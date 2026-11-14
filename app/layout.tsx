import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Big_Shoulders, Big_Shoulders_Stencil } from "next/font/google";
import "./globals.css";

// Atkinson Hyperlegible is built for easy reading, which suits a student audience.
// Big Shoulders echoes the stencilled lettering on flight hardware.
// next/font has no fallback metrics for these faces, so that adjustment is off.
const body = Atkinson_Hyperlegible_Next({ subsets: ["latin"], variable: "--ff-body", adjustFontFallback: false });
const display = Big_Shoulders({ subsets: ["latin"], variable: "--ff-display", adjustFontFallback: false });
const stencil = Big_Shoulders_Stencil({ subsets: ["latin"], variable: "--ff-stencil", adjustFontFallback: false });

export const metadata: Metadata = {
  title: "MISSION VIGIL: Junior Astronaut Mission Trainer",
  description: "Wake up alone in a Mars outpost and keep it alive. A mission trainer built on NASA research.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${stencil.variable}`}>
      <body>{children}</body>
    </html>
  );
}
