"use client";

import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { TELESCOPE } from "@/engine/story";
import { isPlaying, useGame } from "@/store/game";
import { Icon } from "./Icon";
import { SpaceView } from "./SpaceView";

// The hidden telescope's eyepiece: a wide night sky to drag around, zoom into,
// and find things in. The picture is drawn once; looking around only moves it.

/** The whole sky, in sky units. West is on the left, where the sun has just set. */
const SKY = { w: 1000, h: 600 } as const;
/** Eyepiece size in pixels, and how many pixels one sky unit takes at 1× zoom. */
const EYE = 240;
const SCALE = 0.8;
const ZOOMS = [1, 2.5] as const;
/** The crosshair ring's radius in pixels: whatever sits inside it is "in your sights". */
const SIGHTS = 28;

type Thing = keyof typeof TELESCOPE.things;
/** Where each thing hangs in the sky. Earth is low in the west after sunset, as an evening star. */
const AT: Record<Thing, { x: number; y: number }> = {
  earth: { x: 180, y: 470 },
  phobos: { x: 560, y: 330 },
  deimos: { x: 360, y: 90 },
  jupiter: { x: 760, y: 140 },
};
const START = { x: 620, y: 220 };

/** The same stars every time: a tiny seeded random generator. */
function stars(count: number, seed: number, place: (r: () => number) => [number, number]) {
  let n = seed;
  const r = () => (n = (n * 16807) % 2147483647) / 2147483647;
  return Array.from({ length: count }, (_, i) => {
    const [x, y] = place(r);
    return <circle key={i} cx={x} cy={y} r={0.4 + r() ** 3 * 1.6} fill="#fff4e6" opacity={0.3 + r() * 0.7} />;
  });
}

const PICTURE = (
  <>
    <defs>
      <linearGradient id="scope-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#05060d" />
        <stop offset="1" stopColor="#141a33" />
      </linearGradient>
      {/* After sunset the sky near the sun stays blue on Mars. */}
      <radialGradient id="scope-dusk" cx="0.1" cy="1" r="0.55">
        <stop offset="0" stopColor="#5d8fd6" stopOpacity="0.55" />
        <stop offset="1" stopColor="#5d8fd6" stopOpacity="0" />
      </radialGradient>
      <filter id="scope-blur">
        <feGaussianBlur stdDeviation="18" />
      </filter>
    </defs>
    <rect width={SKY.w} height={SKY.h} fill="url(#scope-sky)" />
    <rect width={SKY.w} height={SKY.h} fill="url(#scope-dusk)" />
    {/* The Milky Way: a soft band, thick with faint stars. */}
    <ellipse cx="520" cy="240" rx="560" ry="60" transform="rotate(-18 520 240)" fill="#cfc8ff" opacity="0.12" filter="url(#scope-blur)" />
    {stars(220, 7, (r) => [r() * SKY.w, r() * 540])}
    {stars(160, 11, (r) => {
      const t = r() * SKY.w;
      return [t, 240 + (520 - t) * Math.tan((18 * Math.PI) / 180) + (r() - 0.5) * 90];
    })}

    {/* Jupiter and its four big moons in a row. */}
    <g transform={`translate(${AT.jupiter.x} ${AT.jupiter.y})`}>
      <circle r="5" fill="#f1dcb4" />
      <rect x="-4.6" y="-1.2" width="9.2" height="0.8" fill="#b98a5e" opacity="0.8" />
      <rect x="-4.6" y="1" width="9.2" height="0.7" fill="#b98a5e" opacity="0.7" />
      {[-15, -9, 10, 18].map((x) => (
        <circle key={x} cx={x} cy={x / 30} r="0.9" fill="#fff4e6" />
      ))}
    </g>
    {/* Phobos: big, lumpy, and grey, with its giant crater. */}
    <g transform={`translate(${AT.phobos.x} ${AT.phobos.y}) rotate(-25)`}>
      <ellipse rx="16" ry="11" fill="#8c7f73" />
      <circle cx="-6" cy="-2" r="4.5" fill="#6f6359" />
      <circle cx="5" cy="3" r="2" fill="#73675d" />
      <circle cx="8" cy="-4" r="1.2" fill="#73675d" />
    </g>
    <circle cx={AT.deimos.x} cy={AT.deimos.y} r="2" fill="#e8e0d8" />
    {/* Earth, the bright blue evening star, with the Moon beside it. */}
    <g transform={`translate(${AT.earth.x} ${AT.earth.y})`}>
      <circle r="11" fill="#8fd0ff" opacity="0.25" className="twinkle" />
      <circle r="3.2" fill="#8fd0ff" />
      <circle cx="4.5" cy="2.5" r="1.1" fill="#d6d6d6" />
    </g>

    {/* The hills on the horizon. */}
    <path d="M0 560 Q 90 520 180 548 T 380 540 T 600 552 T 820 530 T 1000 548 V 600 H 0 Z" fill="#2a1610" />
    <path d="M0 560 Q 90 520 180 548 T 380 540 T 600 552 T 820 530 T 1000 548" fill="none" stroke="#6b3a24" strokeWidth="1.5" />
  </>
);

const clamp = (v: number, max: number) => Math.min(max, Math.max(0, v));

function NightSky() {
  const spot = useGame((s) => s.spot);
  const [view, setView] = useState(START);
  const [zoom, setZoom] = useState(0);
  const [dragging, setDragging] = useState(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const k = SCALE * ZOOMS[zoom];
  const target = (Object.keys(AT) as Thing[]).find((t) => Math.hypot(AT[t].x - view.x, AT[t].y - view.y) <= SIGHTS / k);

  // Each thing in the sights counts once: Earth unlocks the secret card, all four the sky tour.
  useEffect(() => {
    if (target) spot(target);
  }, [target, spot]);

  const look = (dx: number, dy: number) => setView((v) => ({ x: clamp(v.x + dx, SKY.w), y: clamp(v.y + dy, SKY.h - 40) }));
  // Smaller than the sights, so the buttons can centre anything in the sky.
  const nudge = 40 / ZOOMS[zoom];
  const ARROWS: Record<string, [number, number]> = { ArrowUp: [0, -nudge], ArrowDown: [0, nudge], ArrowLeft: [-nudge, 0], ArrowRight: [nudge, 0] };

  const onKey = (e: KeyboardEvent) => {
    const move = ARROWS[e.key];
    if (!move) return;
    // The arrows aim the telescope here, so they must not also walk the astronaut away from it.
    e.preventDefault();
    e.stopPropagation();
    look(...move);
  };
  const onDown = (e: PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    last.current = { x: e.clientX, y: e.clientY };
    setDragging(true);
  };
  const onMove = (e: PointerEvent) => {
    if (!last.current) return;
    look((last.current.x - e.clientX) / k, (last.current.y - e.clientY) / k);
    last.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => {
    last.current = null;
    setDragging(false);
  };

  const pad = "flex size-10 items-center justify-center rounded-lg border border-sand/25 font-display text-xl hover:border-sunset hover:text-sunset";
  return (
    <div onKeyDown={onKey}>
      <p className="text-sm text-sand/70">{TELESCOPE.hint}</p>
      <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        <div
          className={`relative shrink-0 cursor-grab touch-none overflow-hidden rounded-full border-4 border-[#3d3530] bg-black outline-offset-4 ${dragging ? "cursor-grabbing" : ""}`}
          style={{ width: EYE, height: EYE }}
          tabIndex={0}
          role="application"
          aria-label={TELESCOPE.view}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <svg
            width={SKY.w}
            height={SKY.h}
            viewBox={`0 0 ${SKY.w} ${SKY.h}`}
            aria-hidden
            className="absolute top-0 left-0 max-w-none origin-top-left"
            style={{
              transform: `translate(${EYE / 2 - view.x * k}px, ${EYE / 2 - view.y * k}px) scale(${k})`,
              transition: dragging ? "none" : "transform 0.45s ease-out",
            }}
          >
            {PICTURE}
          </svg>
          {/* Crosshair: it lights up when something is in your sights. */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className={`absolute top-1/2 left-1/2 -translate-1/2 rounded-full border-2 transition-colors ${target ? "border-sunset" : "border-sand/35"}`} style={{ width: SIGHTS * 2, height: SIGHTS * 2 }} />
            <div className="absolute top-1/2 left-0 h-px w-full bg-sand/20" />
            <div className="absolute top-0 left-1/2 h-full w-px bg-sand/20" />
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_36px_14px_#000]" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <span />
          <button type="button" className={pad} onClick={() => look(...ARROWS.ArrowUp)} aria-label={TELESCOPE.look.up}>
            ▲
          </button>
          <span />
          <button type="button" className={pad} onClick={() => look(...ARROWS.ArrowLeft)} aria-label={TELESCOPE.look.left}>
            ◀
          </button>
          <button
            type="button"
            className={`${pad} text-base`}
            onClick={() => {
              // Zooming in centres whatever is in your sights, so it stays in them.
              if (!zoom && target) setView(AT[target]);
              setZoom(zoom ? 0 : 1);
            }}
            aria-label={zoom ? TELESCOPE.zoomOut : TELESCOPE.zoomIn}
          >
            {zoom ? "−" : "+"}
          </button>
          <button type="button" className={pad} onClick={() => look(...ARROWS.ArrowRight)} aria-label={TELESCOPE.look.right}>
            ▶
          </button>
          <span />
          <button type="button" className={pad} onClick={() => look(...ARROWS.ArrowDown)} aria-label={TELESCOPE.look.down}>
            ▼
          </button>
          <span />
        </div>
      </div>
      <p className="mt-3 min-h-20 leading-snug" role="status">
        {target ? (
          <>
            <strong className="font-display text-xl text-sunset">{TELESCOPE.things[target].name}</strong> {TELESCOPE.things[target].text}
          </>
        ) : (
          <span className="text-sand/70">{TELESCOPE.nothing}</span>
        )}
      </p>
    </div>
  );
}

/** Opens while the astronaut stands at the hidden telescope behind the rover. */
export function Telescope() {
  const open = useGame((s) => s.near === "telescope" && isPlaying(s));
  const [tab, setTab] = useState<"sky" | "system">("sky");
  if (!open) return null;
  const tabButton = (id: typeof tab, label: string) => (
    <button type="button" aria-pressed={tab === id} onClick={() => setTab(id)} className={`rounded-lg px-2.5 py-1 font-display text-base ${tab === id ? "bg-sunset text-dusk" : "text-sand/70 hover:text-sunset"}`}>
      {label}
    </button>
  );
  return (
    <section className="rise rounded-2xl border border-sunset bg-dusk/90 px-4 pt-3 pb-2 backdrop-blur-md" aria-label={TELESCOPE.title}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">
          <Icon name="telescope" className="mr-1.5" />
          {TELESCOPE.title}
        </h2>
        <div className="flex gap-1">
          {tabButton("sky", TELESCOPE.sky)}
          {tabButton("system", TELESCOPE.system)}
        </div>
      </div>
      {tab === "sky" ? <NightSky /> : <SpaceView />}
    </section>
  );
}
