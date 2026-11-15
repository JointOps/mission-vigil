"use client";

import { useEffect, useRef, useState } from "react";
import { AU_KM, AU_LIGHT_MINUTES, earthToMarsAu } from "@/engine/orbits";
import { CERTIFICATE, NAME, POSTCARD } from "@/engine/story";
import { Icon } from "./Icon";

// The postcard is drawn once on a canvas, so the picture on screen is exactly
// the PNG that is saved. Everything is drawn in code: no images to load or licence.

const W = 1200;
const H = 800;
const PAPER = "#f6ead6";
const INK = "#2b1d33";
const RUST = "#b5613a";
const BLUE = "#8ec5f0";
const GOLD = "#f2c230";

/** A next/font family, read from the variable the layout puts on <html>. */
const family = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name);

let fonts: Promise<unknown> | undefined;
/** A canvas only draws a font the page has already loaded, so load the three game fonts first. */
function loadFonts() {
  fonts ??= Promise.all(["--ff-display", "--ff-body", "--ff-stencil"].map((v) => document.fonts.load(`700 40px ${family(v)}`)))
    .then(() => document.fonts.ready)
    .catch(() => {}); // a font that fails to load falls back to the system font
  return fonts;
}

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const d = i % 2 ? r * 0.45 : r;
    c.lineTo(x + d * Math.cos(a), y + d * Math.sin(a));
  }
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function disc(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string) {
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
}

type Card = { name: string; rank: string; stars: number; wings: number; millionKm: number; minutes: number; date: string };

function draw(c: CanvasRenderingContext2D, p: Card) {
  const display = family("--ff-display");
  const body = family("--ff-body");
  const stencil = family("--ff-stencil");
  const text = (s: string, x: number, y: number, font: string, fill: string, max?: number) => {
    c.font = font;
    c.fillStyle = fill;
    c.fillText(s, x, y, max);
  };
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  c.fillStyle = PAPER;
  c.fillRect(0, 0, W, H);

  // The picture: the base at sunset, with Earth as a blue star.
  c.save();
  c.beginPath();
  c.roundRect(40, 40, 560, 440, 24);
  c.clip();
  const sky = c.createLinearGradient(0, 40, 0, 480);
  sky.addColorStop(0, "#1a1430");
  sky.addColorStop(0.55, "#4a3048");
  sky.addColorStop(0.85, "#b8764e");
  c.fillStyle = sky;
  c.fillRect(40, 40, 560, 440);
  // On Mars the sky around the setting sun turns blue.
  const glow = c.createRadialGradient(470, 372, 0, 470, 372, 190);
  glow.addColorStop(0, "rgba(142,197,240,0.95)");
  glow.addColorStop(1, "rgba(142,197,240,0)");
  c.fillStyle = glow;
  c.fillRect(40, 40, 560, 440);
  disc(c, 470, 372, 16, "#eef7ff");
  let seed = 3;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 60; i++) disc(c, 40 + rand() * 560, 40 + rand() * 230, 0.6 + rand() * 1.6, `rgba(255,244,230,${0.3 + rand() * 0.6})`);
  disc(c, 540, 96, 12, "rgba(142,197,240,0.25)");
  disc(c, 540, 96, 5, BLUE);
  disc(c, 549, 92, 2, "#ddd");
  // Hills, then the ground.
  c.fillStyle = "#7a3b22";
  c.beginPath();
  c.moveTo(40, 380);
  c.quadraticCurveTo(160, 330, 280, 372);
  c.quadraticCurveTo(420, 345, 600, 368);
  c.lineTo(600, 480);
  c.lineTo(40, 480);
  c.fill();
  c.fillStyle = RUST;
  c.fillRect(40, 400, 560, 80);
  // Solar panels.
  for (let i = 0; i < 3; i++) {
    const x = 64 + i * 46;
    c.fillStyle = "#2d4a6b";
    c.beginPath();
    c.moveTo(x, 430);
    c.lineTo(x + 36, 430);
    c.lineTo(x + 44, 410);
    c.lineTo(x + 8, 410);
    c.fill();
    c.fillStyle = "#555";
    c.fillRect(x + 20, 430, 3, 14);
  }
  // The habitat: a dome with lit windows, and the airlock tube.
  c.fillStyle = "#e9dcc6";
  c.fillRect(300, 392, 66, 26);
  c.beginPath();
  c.ellipse(270, 418, 84, 70, 0, Math.PI, 0);
  c.fill();
  c.fillStyle = "#cbb89c";
  c.fillRect(186, 414, 168, 8);
  for (const x of [222, 258, 294]) {
    disc(c, x, 386, 13, "rgba(242,194,48,0.35)");
    disc(c, x, 386, 7, GOLD);
  }
  // The radio dish, pointed at Earth.
  c.strokeStyle = "#cbb89c";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(560, 440);
  c.lineTo(560, 400);
  c.stroke();
  c.fillStyle = "#e9dcc6";
  c.beginPath();
  c.ellipse(560, 396, 26, 12, -0.5, 0, Math.PI);
  c.fill();
  // The astronaut, waving.
  c.fillStyle = "#f4f1ea";
  c.fillRect(402, 424, 18, 24);
  c.fillRect(403, 446, 6, 12);
  c.fillRect(413, 446, 6, 12);
  c.strokeStyle = "#f4f1ea";
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(418, 430);
  c.lineTo(432, 410);
  c.stroke();
  disc(c, 411, 414, 12, "#f4f1ea");
  c.fillStyle = BLUE;
  c.beginPath();
  c.ellipse(413, 415, 7, 5, 0, 0, Math.PI * 2);
  c.fill();
  // ARIA, flying beside them.
  disc(c, 452, 392, 10, "#f4f1ea");
  disc(c, 452, 393, 4, BLUE);
  // The big title, like an old holiday postcard.
  text(POSTCARD.greetings, 66, 104, `700 40px ${display}`, PAPER);
  c.font = `700 190px ${stencil}`;
  c.lineWidth = 10;
  c.strokeStyle = "#1c0f0b";
  c.strokeText(POSTCARD.mars, 60, 280, 470);
  const fill = c.createLinearGradient(0, 130, 0, 280);
  fill.addColorStop(0, GOLD);
  fill.addColorStop(1, "#e2733f");
  c.fillStyle = fill;
  c.fillText(POSTCARD.mars, 60, 280, 470);
  c.restore();

  // The message, written under the picture.
  text(POSTCARD.hello, 48, 552, `700 52px ${display}`, INK);
  text(POSTCARD.kept, 48, 600, `400 30px ${body}`, INK, 560);
  text(p.rank, 48, 672, `700 44px ${display}`, RUST);
  c.font = `700 44px ${display}`;
  let x = 48 + c.measureText(p.rank).width + 30;
  for (let i = 0; i < 3; i++) star(c, x + i * 44, 657, 19, i < p.stars ? GOLD : "#d9c8ad");
  x += 3 * 44 + 10;
  text(CERTIFICATE.wings(p.wings), x, 670, `400 28px ${body}`, INK);

  // The line down the middle of every postcard.
  c.fillStyle = "#c9b79c";
  c.fillRect(638, 60, 3, 680);

  // The stamp, with a jagged edge.
  const sx = 990;
  const sy = 48;
  c.fillStyle = "#fffaf0";
  c.fillRect(sx, sy, 150, 184);
  for (let i = 0; i <= 10; i++) {
    disc(c, sx + i * 15, sy, 6, PAPER);
    disc(c, sx + i * 15, sy + 184, 6, PAPER);
  }
  for (let i = 0; i <= 12; i++) {
    disc(c, sx, sy + i * 15.33, 6, PAPER);
    disc(c, sx + 150, sy + i * 15.33, 6, PAPER);
  }
  const art = c.createLinearGradient(0, sy + 14, 0, sy + 170);
  art.addColorStop(0, "#1a1430");
  art.addColorStop(1, "#3f6f9b");
  c.fillStyle = art;
  c.fillRect(sx + 14, sy + 14, 122, 156);
  disc(c, sx + 75, sy + 82, 40, RUST);
  disc(c, sx + 62, sy + 70, 8, "#9a4f2e");
  disc(c, sx + 90, sy + 96, 6, "#9a4f2e");
  disc(c, sx + 84, sy + 64, 4, "#9a4f2e");
  c.textAlign = "center";
  text(POSTCARD.mars, sx + 75, sy + 150, `700 30px ${stencil}`, PAPER);
  text(POSTCARD.stamp, sx + 75, sy + 40, `700 18px ${display}`, GOLD);

  // The postmark, stamped over the corner of the stamp.
  c.save();
  c.translate(918, 168);
  c.rotate(-0.2);
  c.strokeStyle = "rgba(43,29,51,0.72)";
  c.fillStyle = "rgba(43,29,51,0.72)";
  c.lineWidth = 4;
  c.beginPath();
  c.arc(0, 0, 72, 0, Math.PI * 2);
  c.stroke();
  c.lineWidth = 2;
  c.beginPath();
  c.arc(0, 0, 58, 0, Math.PI * 2);
  c.stroke();
  c.font = `700 20px ${display}`;
  c.fillText(POSTCARD.postmark[0], 0, -26);
  c.font = `700 36px ${display}`;
  c.fillText(POSTCARD.postmark[1], 0, 12);
  c.font = `400 15px ${body}`;
  c.fillText(p.date.toUpperCase(), 0, 38, 100);
  c.lineWidth = 3;
  for (let k = 0; k < 4; k++) {
    c.beginPath();
    for (let t = 0; t <= 150; t += 5) c.lineTo(80 + t, -36 + k * 22 + Math.sin(t / 12) * 6);
    c.stroke();
  }
  c.restore();
  c.textAlign = "left";

  // The address.
  const lines: readonly [string, string][] = [
    [POSTCARD.to, `700 46px ${display}`],
    [POSTCARD.from(p.name), `700 46px ${display}`],
    [POSTCARD.where, `400 32px ${body}`],
  ];
  lines.forEach(([s, font], i) => {
    const y = 360 + i * 84;
    text(s, 680, y, font, INK, 470);
    c.fillStyle = "#c9b79c";
    c.fillRect(680, y + 16, 470, 2);
  });

  // Real numbers for the day it was made.
  c.fillStyle = "rgba(142,197,240,0.25)";
  c.beginPath();
  c.roundRect(668, 610, 492, 120, 16);
  c.fill();
  text(POSTCARD.away(p.millionKm), 690, 660, `700 38px ${display}`, "#1f5c8f", 450);
  text(POSTCARD.radio(p.minutes), 690, 702, `400 24px ${body}`, INK, 450);

  c.textAlign = "center";
  text(NAME, W / 2, 776, `700 22px ${stencil}`, "#8a7458");
}

/** The postcard card of the win screen: a name box, the picture, and a dot flying the real distance home. */
export function Postcard({ name, setName, rank, stars, wings, children }: { name: string; setName: (name: string) => void; rank: string; stars: number; wings: number; children: React.ReactNode }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [today] = useState(() => Date.now());
  const [saves, setSaves] = useState(0);
  const au = earthToMarsAu(today);
  const millionKm = Math.round((au * AU_KM) / 1e6);
  const minutes = Math.round(au * AU_LIGHT_MINUTES);
  const date = new Date(today).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" });
  const arrive = new Date(today + au * AU_LIGHT_MINUTES * 60_000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const shown = name.trim();

  useEffect(() => {
    let live = true;
    void loadFonts().then(() => {
      const c = canvas.current?.getContext("2d");
      if (live && c) draw(c, { name: shown, rank, stars, wings, millionKm, minutes, date });
    });
    return () => {
      live = false;
    };
  }, [shown, rank, stars, wings, millionKm, minutes, date]);

  const save = () => {
    canvas.current?.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "postcard-from-mars.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setSaves((n) => n + 1);
    }, "image/png");
  };

  return (
    <>
      <h2 id="debrief-title" className="font-display text-4xl font-bold leading-none">
        {POSTCARD.title}
      </h2>
      <div>
        <label htmlFor="postcard-name" className="font-display text-lg">
          {POSTCARD.name}
        </label>
        {/* No form and no autocomplete, so the browser keeps no copy of the name either. */}
        <input
          id="postcard-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          className="mt-1 block w-full rounded-lg border-2 border-sand/30 bg-dusk px-3 py-1.5 text-lg focus:border-sunset"
        />
        <p className="mt-1 text-sm leading-snug text-sand/70">
          <Icon name="lock" className="mr-1 size-[1.1em]" />
          {POSTCARD.privacy}
        </p>
      </div>
      <canvas ref={canvas} width={W} height={H} role="img" aria-label={POSTCARD.picture(shown, rank)} className="pop-in w-full rounded-lg shadow-[0_8px_30px_rgb(0_0_0/0.5)]" />
      {/* The postcard's trip home, at the real distance for today. It flies again each time it is saved. */}
      <div className="mt-2 flex items-center gap-2 text-sm" aria-hidden>
        <span className="size-3 rounded-full bg-regolith" />
        {POSTCARD.trip.from}
        <div className="relative mx-1 h-px flex-1 border-t border-dashed border-sand/40">
          <span className="absolute inset-x-0 -top-5 text-center text-sand/70">{POSTCARD.trip.km(millionKm)}</span>
          <div key={saves} className="fly absolute inset-0">
            <span className="absolute -top-1.5 left-0 h-3 w-4 rounded-[2px] bg-sand shadow-[0_0_10px_var(--color-sunset)]" />
          </div>
        </div>
        {POSTCARD.trip.to}
        <span className="size-3.5 rounded-full bg-sunset" />
      </div>
      <p className="-mt-2 text-sm leading-snug" role="status">
        {saves > 0 ? <strong className="text-safe">{POSTCARD.saved} </strong> : null}
        {POSTCARD.arrive(arrive)}
      </p>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={save} className="rounded-xl border-2 border-sunset px-4 py-2 font-display text-lg font-bold text-sunset hover:bg-sunset hover:text-dusk">
          <Icon name="download" className="mr-1.5" />
          {POSTCARD.save}
        </button>
        {children}
      </div>
    </>
  );
}
