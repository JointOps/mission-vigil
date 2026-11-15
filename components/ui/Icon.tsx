import type { ReactNode } from "react";
import type { IconName } from "@/engine/story";

// Small line pictures drawn for this game on a 24 × 24 grid, so they look the
// same on every phone and laptop. Each one takes the colour of the text around it.

const DRAW: Readonly<Record<IconName, ReactNode>> = {
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  fan: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10c-1-4 0-7 3-7s3 4-1 7M14 12.5c4-.5 7 1 6.5 4s-4.5 2.5-6.5-2.5M10.5 13.5c-2.5 3-5.5 4-7 2s.5-5 5.5-4.5" />
    </>
  ),
  dial: (
    <>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 14a4 4 0 0 1 8 0M12 14l2.5-3M8 21h8" />
    </>
  ),
  bandage: (
    <>
      <rect x="2" y="8.5" width="20" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="M11 11h.01M13 13h.01M13 11h.01M11 13h.01" />
    </>
  ),
  shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />,
  home: <path d="M3 11 12 3l9 8M5 9.5V21h14V9.5M10 21v-6h4v6" />,
  droplet: <path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z" />,
  leaf: <path d="M5 20c0-9 5-15 15-15 0 9-5 15-14 15M5 20l8-8" />,
  bowl: <path d="M3 12h18a9 8 0 0 1-18 0zM8 12c0-3 2-5 4-5M12 12c0-4 3-6 6-6" />,
  tap: <path d="M3 9h11a3 3 0 0 1 3 3v2M3 6v6M9 9V5M6 5h6M17 18v.01M17 21v.01" />,
  bike: (
    <>
      <circle cx="6" cy="16" r="4" />
      <circle cx="18" cy="16" r="4" />
      <path d="M6 16l4-8h5l3 8M10 8l2 8H6M14 5h3" />
    </>
  ),
  dish: <path d="M4 10a8 8 0 0 0 10 10zM9 15l5-5M14 4a6 6 0 0 1 6 6M14 7a3 3 0 0 1 3 3M5 21h6" />,
  windsock: <path d="M4 3v18M4 5l15 2.5v5L4 15M9 5.7v8.6M14 6.4v7.2" />,
  rover: (
    <>
      <rect x="3" y="8" width="16" height="6" rx="1" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M15 8V4h4" />
    </>
  ),
  button: <path d="M12 3v8M6.5 6.5a8 8 0 1 0 11 0" />,
  box: <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9" />,
  printer: (
    <>
      <path d="M6 9V3h12v6" />
      <rect x="3" y="9" width="18" height="8" rx="2" />
      <path d="M7 14h10v7H7z" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  rock: <path d="M3 19l3-8 5-5 6 2 4 11zM11 6l1 5 5-3M12 11l-6 0" />,
  telescope: <path d="M3 13l14-7 2.5 5L5.5 18zM11 15.5 8 21M12.5 15l3 6M17 6l1.5-1" />,
  bubbles: (
    <>
      <circle cx="8.5" cy="14.5" r="5" />
      <circle cx="17" cy="6.5" r="3" />
      <circle cx="18" cy="17" r="2" />
    </>
  ),
  wind: <path d="M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7" />,
  thermometer: <path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0zM12 10v7" />,
  helmet: <path d="M4 16a8 8 0 0 1 16 0v4H4zM8 14a4 3.5 0 0 1 8 0v2H8z" />,
  food: <path d="M6 3v7a2 2 0 0 0 4 0V3M8 3v18M18 21V3c-2 0-4 3-4 8h4" />,
  hourglass: <path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9" />,
  radiation: (
    <>
      <circle cx="12" cy="12" r="1.5" />
      <path d="M10.2 9 7 3.6a9.5 9.5 0 0 1 10 0L13.8 9M15.5 12H21.7a9.5 9.5 0 0 1-5 8.6L13.6 15M8.5 12H2.3a9.5 9.5 0 0 0 5 8.6L10.4 15" />
    </>
  ),
  flame: <path d="M12 21a6 6 0 0 0 6-6c0-4-3-6-4-11-2 2-3 4-3 6.5-1-.8-2-2-2-4-2 2-3 5-3 8.5a6 6 0 0 0 6 6z" />,
  boot: <path d="M7 3h6v9l6 3a2 2 0 0 1 1 2v3H4V3zM4 16h16M7 7h3" />,
  wrench: <path d="M15 3.5a5 5 0 0 0-5.5 6.5L3.6 16a2 2 0 0 0 2.8 2.8l6-5.9A5 5 0 0 0 19 8.4l-3 3-3-1-1-3z" />,
  tank: (
    <>
      <rect x="7" y="6" width="10" height="15" rx="4" />
      <path d="M10 6V3h4v3M10 11h4" />
    </>
  ),
  bricks: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 9.7h18M3 14.3h18M9 5v4.7M15 9.7v4.6M9 14.3V19" />
    </>
  ),
  battery: (
    <>
      <rect x="2.5" y="7" width="17" height="10" rx="2" />
      <path d="M22 11v2M6.5 10v4M10.5 10v4" />
    </>
  ),
  cards: (
    <>
      <rect x="8" y="3" width="12" height="16" rx="2" />
      <path d="M5 6.5 4 7v12.5L11 21" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2h6v2M9 13l2 2 4-4" />
    </>
  ),
  sound: <path d="M4 9h4l5-4v14l-5-4H4zM16.5 9a4 4 0 0 1 0 6M19.5 6a8 8 0 0 1 0 12" />,
  mute: <path d="M4 9h4l5-4v14l-5-4H4zM17 9.5l5 5M22 9.5l-5 5" />,
  pause: <path d="M8 5v14M16 5v14" />,
  play: <path d="M7 4v16l13-8z" />,
  medal: (
    <>
      <circle cx="12" cy="15" r="6" />
      <path d="M8.5 2.5 12 9l3.5-6.5M12 12.5v5" />
    </>
  ),
  download: <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  gamepad: (
    <>
      <rect x="2" y="7" width="20" height="11" rx="5" />
      <path d="M7 10.5v4M5 12.5h4M15 12h.01M18 13.5h.01" />
    </>
  ),
  sunset: <path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0M12 3v7M9 7l3 3 3-3M7 21h10" />,
  vent: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h10M7 12h10M7 15h10" />
    </>
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01M8.5 14a4 4 0 0 0 7 0" />
    </>
  ),
  worried: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h.01M15 10h.01M8.5 16c2-1.5 5-1.5 7 0" />
    </>
  ),
  scared: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 8l1.5 1M15.5 8 14 9M9 11h.01M15 11h.01" />
      <circle cx="12" cy="15.5" r="2" />
    </>
  ),
};

/** One picture, sized by `className`. It is decoration: the words beside it are what a screen reader reads. */
export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`inline-block shrink-0 align-[-0.15em] ${className}`}>
      {DRAW[name]}
    </svg>
  );
}
