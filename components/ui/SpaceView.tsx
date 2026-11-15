"use client";

import { useState, useSyncExternalStore } from "react";
import { AU_KM, AU_LIGHT_MINUTES, earthToMarsAu, EARTH_ORBIT, MARS_ORBIT, nextLaunchDay, type Orbit, planetAt } from "@/engine/orbits";
import { SPACE } from "@/engine/story";

const DAY_MS = 86_400_000;
const MONTH_MS = 30.44 * DAY_MS;
const subscribeNever = () => () => {};
/** One lap of each orbit as an SVG path, drawn once. North is up, so y is flipped. */
const lap = (orbit: Orbit, days: number) =>
  `M${Array.from({ length: 72 }, (_, i) => planetAt(orbit, (i * days * DAY_MS) / 72))
    .map((p) => `${p.x.toFixed(3)},${(-p.y).toFixed(3)}`)
    .join("L")}Z`;
const EARTH_LAP = lap(EARTH_ORBIT, 365.25);
const MARS_LAP = lap(MARS_ORBIT, 687);

/** A map of the Sun, Earth and Mars on a real date. The full map adds a slider to run time forward; `brief` is the picture and one line. */
export function SpaceView({ brief }: { brief?: boolean }) {
  // Today's sky depends on the clock, so the map waits for the browser: a page built ahead of time would show an old date.
  const inBrowser = useSyncExternalStore(subscribeNever, () => true, () => false);
  return inBrowser ? <SpaceMap brief={brief} /> : null;
}

function SpaceMap({ brief }: { brief?: boolean }) {
  const [today] = useState(() => Date.now());
  const [months, setMonths] = useState(0);
  const when = today + months * MONTH_MS;
  const earth = planetAt(EARTH_ORBIT, when);
  const mars = planetAt(MARS_ORBIT, when);
  const au = earthToMarsAu(when);
  const launch = new Date(nextLaunchDay(today)).toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });
  // The radio dot flies from Mars to Earth; its start and end are handed to CSS.
  const flight = {
    "--fx": `${mars.x}px`,
    "--fy": `${-mars.y}px`,
    "--tx": `${earth.x}px`,
    "--ty": `${-earth.y}px`,
  } as React.CSSProperties;
  return (
    <section className="w-full max-w-sm rounded-2xl border border-sunset/60 bg-dusk p-4 text-left" aria-label={SPACE.title}>
      <h2 className="font-display text-xl font-semibold text-sunset">{SPACE.title}</h2>
      <svg viewBox="-1.8 -1.8 3.6 3.6" className="mx-auto block aspect-square w-full max-w-44 md:max-w-64" role="img" aria-label={SPACE.picture}>
        <path d={EARTH_LAP} fill="none" stroke="var(--color-sunset)" strokeOpacity="0.35" strokeWidth="0.012" />
        <path d={MARS_LAP} fill="none" stroke="var(--color-regolith)" strokeOpacity="0.5" strokeWidth="0.012" />
        <line x1={mars.x} y1={-mars.y} x2={earth.x} y2={-earth.y} stroke="var(--color-sand)" strokeOpacity="0.3" strokeWidth="0.012" strokeDasharray="0.04" />
        <circle r="0.13" fill="var(--color-sulfur)" />
        <circle cx={earth.x} cy={-earth.y} r="0.075" fill="var(--color-sunset)" />
        <circle cx={mars.x} cy={-mars.y} r="0.06" fill="var(--color-regolith)" stroke="var(--color-sand)" strokeWidth="0.015" />
        <circle r="0.03" fill="var(--color-sand)" className="signal" style={flight} />
      </svg>
      <p className="flex flex-wrap justify-center gap-x-4 text-sm">
        {(
          [
            ["bg-sulfur", SPACE.sun],
            ["bg-sunset", SPACE.earth],
            ["bg-regolith", SPACE.mars],
          ] as const
        ).map(([color, name]) => (
          <span key={name}>
            <span aria-hidden className={`mr-1 inline-block size-2.5 rounded-full ${color}`} />
            {name}
          </span>
        ))}
      </p>
      <p className="mt-2 leading-snug" role="status">
        {SPACE.distance(Math.round((au * AU_KM) / 1e6), Math.round(au * AU_LIGHT_MINUTES))}
      </p>
      {!brief && (
        <>
          <label className="mt-2 block text-sm text-sand/70">
            {months === 0 ? SPACE.today : SPACE.later(months)}
            <input type="range" min={0} max={26} value={months} onChange={(e) => setMonths(Number(e.target.value))} className="block w-full accent-sunset" />
          </label>
          <p className="mt-1 text-sm leading-snug text-sand/80">
            {SPACE.launch(launch)}{" "}
            <a href={SPACE.source.url} target="_blank" rel="noreferrer" className="underline hover:text-sunset">
              {SPACE.source.label}
            </a>
          </p>
        </>
      )}
    </section>
  );
}
