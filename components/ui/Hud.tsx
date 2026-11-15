"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useShallow } from "zustand/react/shallow";
import { CABIN_TEMP_C, CHAPTER_1_SOLS, CO2_DANGER_PCT, CO2_SAFE_MAX_PCT, O2_DANGER_PCT, O2_SAFE_MAX_PCT, O2_SAFE_MIN_PCT, SECONDS_PER_SOL } from "@/engine/constants";
import {
  co2Pct,
  co2Zone,
  FLARE,
  isCold,
  isOver,
  isTask,
  jobs,
  MAX_CELLS,
  o2Pct,
  o2Zone,
  PANELS,
  powerAt,
  reserveSols,
  seen,
  START_OF_DAY,
  STORM,
  sunUp,
  type System,
  TASKS,
  tempZone,
  trends,
  TUTORIAL_DONE,
  type Upgrade,
  UPGRADE_COST,
  type Zone,
} from "@/engine/simulate";
import { FACT_IDS, FACTS, GAUGE_ICONS, GAUGE_TIPS, HUD, type IconName, NEW_FACT, NEXT_JOB, OTHER_JOBS, ICONS, IDLE_HINT, MESSAGES, MORE_JOBS, SECRET_FOUND, SECRETS, SOLS, SPACE, UPGRADES, WEATHER } from "@/engine/story";
import { MARS_WEATHER } from "@/engine/weather";
import { areaOf } from "@/engine/world";
import { isPlaying, useGame } from "@/store/game";
import { Learn } from "./Learn";
import { Icon } from "./Icon";
import { SpaceView } from "./SpaceView";
import { Telescope } from "./Telescope";

// Every selector below rounds what it reads, so a component re-renders only
// when the number it shows changes, not on every simulation frame.

const PANEL = "rounded-2xl border border-sand/15 bg-dusk/85 backdrop-blur-md";
const BUTTON = "rounded-xl bg-sunset px-4 py-2 font-display text-lg font-bold text-dusk hover:bg-sand disabled:bg-sand/20 disabled:text-sand/50";
const QUIET = "rounded-xl border border-sand/30 px-2.5 py-1 sm:px-3 font-display text-lg hover:border-sunset hover:text-sunset";
const ZONE_COLOR: Record<Zone, string> = {
  safe: "var(--color-safe)",
  caution: "var(--color-sulfur)",
  danger: "var(--color-flare)",
};
/** A face says how a gauge is doing before the number is read. */
const ZONE_FACE: Record<Zone, IconName> = {
  safe: "smile",
  caution: "worried",
  danger: "scared",
};
const round = (n: number, step: number) => Math.round(n / step) * step;
const SYSTEMS: readonly System[] = ["scrubber", "oxygen", "heater"];

type Band = readonly [from: number, zone: Zone];

/** Hides the little triangle a browser draws on a <summary>. */
const SUMMARY = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";

/**
 * On a phone a meter is a small chip, so the base stays in view: tap it to open
 * the full meter with a tip from ARIA. On a wide screen the full meter always shows.
 * Only one chip opens at a time (`<details name>`).
 */
function Chip({ icon, label, short, zone, tip, children }: { icon: IconName; label: string; short: string; zone: Zone; tip: string; children: ReactNode }) {
  return (
    <>
      <details name="meter" className="md:hidden">
        <summary className={`${SUMMARY} flex items-center gap-1 rounded-full border-2 bg-dusk/85 px-2.5 py-1 font-display text-lg leading-none font-bold tabular-nums backdrop-blur-md ${zone === "danger" ? "alarm-border" : ""}`} style={{ borderColor: ZONE_COLOR[zone], color: ZONE_COLOR[zone] }}>
          <Icon name={icon} className="size-4" />
          <span className="sr-only">{label}:</span>
          {short}
        </summary>
        <div className="rise absolute inset-x-0 top-full z-10 mt-1.5 flex flex-col gap-1.5">
          <p className={`${PANEL} flex items-start gap-2 p-2.5 leading-snug`}>
            <span className="orb size-7! shrink-0" aria-hidden />
            <span>
              <strong className="font-display text-sunset">ARIA: </strong>
              {tip}
            </span>
          </p>
          {children}
        </div>
      </details>
      <div className="max-md:hidden">{children}</div>
    </>
  );
}

function Gauge(props: { icon: IconName; label: string; tip: string; value: number; digits: number; trend: number; zone: Zone; status: string; min: number; max: number; bands: readonly Band[]; note?: string }) {
  const { icon, label, tip, value, digits, trend, zone, status, min, max, bands, note } = props;
  const at = (v: number) => `${Math.max(0, Math.min(1, (v - min) / (max - min))) * 100}%`;
  const stops = bands.map(([from, z], i) => `${ZONE_COLOR[z]} ${at(from)} ${at(bands[i + 1]?.[0] ?? max)}`);
  return (
    <Chip icon={icon} label={label} short={`${value.toFixed(digits)}%`} zone={zone} tip={tip}>
      <div className={`${PANEL} p-2.5 md:p-3 ${zone === "danger" ? "alarm-border" : ""}`}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg leading-none font-semibold">
            <Icon name={icon} className="mr-1.5 size-[1.1em]" />
            {label}
          </h2>
          <p className="font-display text-3xl font-bold tabular-nums leading-none md:text-4xl" style={{ color: ZONE_COLOR[zone] }}>
            {value.toFixed(digits)}
            <span className="text-lg md:text-xl">%</span>
          </p>
        </div>
        <div className="relative my-2.5 h-2.5" role="meter" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={HUD.meterText(value.toFixed(digits), status)}>
          <div
            className="h-full rounded-full opacity-80"
            style={{
              background: `linear-gradient(to right, ${stops.join(", ")})`,
            }}
          />
          <div className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dusk bg-sand transition-[left] duration-200 ease-linear" style={{ left: at(value) }} />
        </div>
        <p className="text-sm">
          <span style={{ color: ZONE_COLOR[zone] }}>
            <Icon name={ZONE_FACE[zone]} className="mr-1 size-[1.1em]" />
          </span>
          <strong style={{ color: ZONE_COLOR[zone] }}>{status}</strong> {trend > 0.05 ? HUD.rising : trend < -0.05 ? HUD.falling : ""}
        </p>
        {note && <p className="hidden text-sm text-sand/60 md:block">{note}</p>}
      </div>
    </Chip>
  );
}

/** A small meter that is only on screen while it matters. */
function Mini({ icon, label, tip, value, pct, zone, note }: { icon: IconName; label: string; tip: string; value: string; pct: number; zone: Zone; note: string }) {
  return (
    <Chip icon={icon} label={label} short={value} zone={zone} tip={tip}>
      <div className={`${PANEL} px-2.5 py-1.5 md:px-3 ${zone === "danger" ? "alarm-border" : ""}`}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg leading-none font-semibold">
            <Icon name={icon} className="mr-1.5 size-[1.1em]" />
            {label}
          </h2>
          <p className="font-display text-xl font-bold tabular-nums leading-none" style={{ color: ZONE_COLOR[zone] }}>
            {value}
          </p>
        </div>
        <div className="my-1 h-2 rounded-full bg-sand/15" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-valuetext={`${value}. ${note}`}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${Math.max(0, Math.min(100, pct))}%`,
              background: ZONE_COLOR[zone],
            }}
          />
        </div>
        {/* The note is for when something is wrong. A meter that is fine stays one quiet line. */}
        {zone !== "safe" && <p className="text-sm leading-tight">{note}</p>}
      </div>
    </Chip>
  );
}

/** How warm the room is. Shown when the sun is gone, or while the room is still cold. */
function Room() {
  const show = useGame((s) => seen(s.sim, "night") && (isCold(s.sim.sol) || tempZone(s.sim.tempC) !== "safe"));
  const temp = useGame((s) => Math.round(s.sim.tempC));
  const heating = useGame((s) => s.sim.alloc.heater > 0);
  if (!show) return null;
  const zone = tempZone(temp);
  const note = zone === "safe" ? (heating ? HUD.room.heating : HUD.room.warm) : zone === "caution" ? HUD.room.cool : HUD.room.freezing;
  return <Mini icon={GAUGE_ICONS.room} label={HUD.room.label} tip={GAUGE_TIPS.room} value={`${temp} °C`} pct={(temp / CABIN_TEMP_C.value) * 100} zone={zone} note={note} />;
}

/** The suit's own air. Shown from the first step into the airlock until it has filled up again. */
function Suit() {
  const pct = useGame((s) => Math.round(s.sim.suit * 100));
  const show = useGame((s) => areaOf(s.player) !== "inside" || s.sim.suit < 1);
  const outside = useGame((s) => areaOf(s.player) === "outside");
  if (!show) return null;
  const zone: Zone = pct > 50 ? "safe" : pct > 25 ? "caution" : "danger";
  return <Mini icon={GAUGE_ICONS.suit} label={HUD.suit.label} tip={GAUGE_TIPS.suit} value={`${pct}%`} pct={pct} zone={zone} note={!outside ? HUD.suit.filling : zone === "safe" ? HUD.suit.fine : HUD.suit.low} />;
}

/** How hungry the astronaut is. Shown from the first rumble until the salad is eaten. */
function Food() {
  const show = useGame((s) => seen(s.sim, "hungry") && s.sim.work.salad > 0);
  const pct = useGame((s) => Math.round(s.sim.food * 20) * 5);
  const grown = useGame((s) => Math.floor(s.sim.grow * 10) * 10);
  const watered = useGame((s) => s.sim.work.plant === 0);
  if (!show) return null;
  const zone: Zone = pct > 25 ? "safe" : pct > 0 ? "caution" : "danger";
  const todo = grown >= 100 ? HUD.food.ready : watered ? HUD.food.growing(grown) : HUD.food.water;
  return <Mini icon={GAUGE_ICONS.food} label={HUD.food.label} tip={GAUGE_TIPS.food} value={pct > 0 ? HUD.food.hungry : HUD.food.starving} pct={pct} zone={zone} note={pct > 0 ? todo : HUD.food.slow(todo)} />;
}

/** Radiation taken in the solar flare. Shown from ARIA's warning until the all clear. */
function Radiation() {
  const show = useGame((s) => seen(s.sim, "flare") && !seen(s.sim, "allclear"));
  const pct = useGame((s) => Math.round(s.sim.dose * 100));
  const hit = useGame((s) => s.sim.sol >= FLARE.from);
  const outside = useGame((s) => areaOf(s.player) === "outside");
  const stacked = useGame((s) => s.sim.work.bags === 0);
  if (!show) return null;
  const zone: Zone = outside && hit ? "danger" : pct > 0 || !stacked ? "caution" : "safe";
  return <Mini icon={GAUGE_ICONS.radiation} label={HUD.radiation.label} tip={GAUGE_TIPS.radiation} value={`${pct}%`} pct={pct} zone={zone} note={outside ? HUD.radiation.out : !stacked ? HUD.radiation.bags : hit ? HUD.radiation.safe : HUD.radiation.wait} />;
}

/** How long the air will last while it leaks. Shown once the air screen has been read, until the hole is patched. */
function TimeLeft() {
  const show = useGame((s) => s.sim.work.leak > 0 && s.sim.work.gauge === 0 && seen(s.sim, "leak"));
  // In tenths of a sol, capped at the two sols the bar can show.
  const sols = useGame((s) => Math.round(Math.min(2, reserveSols(s.sim, areaOf(s.player))) * 10) / 10);
  if (!show) return null;
  const zone: Zone = sols > 1 ? "safe" : sols > 0.4 ? "caution" : "danger";
  return <Mini icon={GAUGE_ICONS.time} label={HUD.time.label} tip={GAUGE_TIPS.time} value={sols >= 2 ? HUD.time.plenty : HUD.time.sols(sols.toFixed(1))} pct={sols * 50} zone={zone} note={HUD.time.note} />;
}

function Gauges() {
  const o2 = useGame((s) => round(o2Pct(s.sim), 0.1));
  const co2 = useGame((s) => round(co2Pct(s.sim), 0.01));
  // The air only starts to change when the guided start is over.
  const o2Trend = useGame((s) => (s.sim.stage < TUTORIAL_DONE ? 0 : round(trends(s.sim, areaOf(s.player)).o2, 0.1)));
  const co2Trend = useGame((s) => (s.sim.stage < TUTORIAL_DONE ? 0 : round(trends(s.sim, areaOf(s.player)).co2, 0.1)));
  // The small print under each gauge is for the guided start. After that the colours and the face say it.
  const learning = useGame((s) => s.sim.stage < TUTORIAL_DONE);
  const o2z = o2Zone(o2);
  const co2z = co2Zone(co2);
  return (
    // On a phone the chips sit in one row; an open chip drops its full meter below it.
    <div className="relative flex w-full flex-wrap gap-1.5 md:grid md:w-64 md:grid-cols-1 md:gap-2">
      <Gauge
        icon={GAUGE_ICONS.oxygen}
        label={HUD.oxygen.label}
        tip={GAUGE_TIPS.oxygen}
        value={o2}
        digits={1}
        trend={o2Trend}
        zone={o2z}
        status={o2z === "safe" ? HUD.oxygen.good : o2 > 21 ? HUD.oxygen.high : o2z === "danger" ? HUD.oxygen.danger : HUD.oxygen.low}
        min={15}
        max={26}
        bands={[[15, "danger"], [O2_DANGER_PCT.value, "caution"], [O2_SAFE_MIN_PCT.value, "safe"], [O2_SAFE_MAX_PCT.value, "caution"]]}
        note={learning ? HUD.oxygen.note : undefined}
      />
      <Gauge
        icon={GAUGE_ICONS.co2}
        label={HUD.co2.label}
        tip={GAUGE_TIPS.co2}
        value={co2}
        digits={2}
        trend={co2Trend}
        zone={co2z}
        status={co2z === "safe" ? HUD.co2.good : co2z === "danger" ? HUD.co2.danger : HUD.co2.high}
        min={0}
        max={4}
        bands={[[0, "safe"], [CO2_SAFE_MAX_PCT.value, "caution"], [CO2_DANGER_PCT.value, "danger"]]}
        note={learning ? HUD.co2.note : undefined}
      />
      <Room />
      <Suit />
      <Food />
      <TimeLeft />
      <Radiation />
    </div>
  );
}

/** The first sunset of the chapter, in sols on the clock: 18:00. Night lasts half a sol. */
const DUSK = 0.75 - START_OF_DAY;
const NIGHTS = SOLS.map((_, i) => i + DUSK).filter((from) => from < CHAPTER_1_SOLS.value);

function TopBar() {
  // Mars clock in 10-minute steps.
  const tenMinutes = useGame((s) => Math.floor((s.sim.sol + START_OF_DAY) * 144));
  const progress = useGame((s) => Math.min(100, Math.round((s.sim.sol / CHAPTER_1_SOLS.value) * 200) / 2));
  const stormKnown = useGame((s) => seen(s.sim, "forecast"));
  const flareKnown = useGame((s) => seen(s.sim, "flare"));
  const day = useGame((s) => sunUp(s.sim.sol));
  const parts = useGame((s) => s.sim.parts);
  const paused = useGame((s) => s.paused);
  const muted = useGame((s) => s.muted);
  const togglePause = useGame((s) => s.togglePause);
  const toggleMute = useGame((s) => s.toggleMute);
  const minutes = (tenMinutes % 144) * 10;
  const clock = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
  const pct = (sol: number) => `${(sol / CHAPTER_1_SOLS.value) * 100}%`;
  return (
    <header className={`${PANEL} flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 sm:gap-x-4 sm:gap-y-2`}>
      {/* On a phone the name gives way so the bar fits on one row; the page title still carries it. */}
      <p className="font-display text-lg leading-tight max-sm:hidden">
        <Link href="/" className="font-stencil text-xl uppercase hover:text-sunset">
          {HUD.bar.name}
        </Link>
        <span className="ml-3 hidden text-sand/70 sm:inline">{SOLS[Math.min(Math.floor(tenMinutes / 144), SOLS.length - 1)].title}</span>
      </p>
      <div className="order-last w-full md:order-none md:w-auto md:flex-1">
        <div className="relative h-1 rounded-full bg-sand/15 sm:h-2" role="progressbar" aria-label={HUD.bar.progress} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          {NIGHTS.map((from) => (
            <div
              key={from}
              className="absolute inset-y-0 bg-dusk/80"
              style={{
                left: pct(from),
                width: pct(Math.min(0.5, CHAPTER_1_SOLS.value - from)),
              }}
              title={HUD.bar.night}
            />
          ))}
          {stormKnown && (
            <div
              className="absolute inset-y-0 bg-regolith"
              style={{
                left: pct(STORM.from),
                width: pct(STORM.to - STORM.from),
              }}
              title={HUD.bar.storm}
            />
          )}
          {flareKnown && (
            <div
              className="absolute inset-y-0 bg-flare"
              style={{
                left: pct(FLARE.from),
                width: pct(FLARE.to - FLARE.from),
              }}
              title={HUD.bar.flare}
            />
          )}
          <div className="absolute inset-y-0 left-0 rounded-full bg-sand/80" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="font-display text-xl font-bold tabular-nums sm:ml-auto md:ml-0 md:text-2xl">
        <span aria-hidden className="mr-1.5 text-sulfur">
          <Icon name={day ? "sun" : "moon"} className="size-[0.9em]" />
        </span>
        {HUD.bar.clock(Math.floor(tenMinutes / 144) + 1, clock)}
      </p>
      <p key={parts} className="pop font-display text-xl font-bold text-sulfur tabular-nums md:text-2xl" title={HUD.bar.partsTip}>
        <span aria-hidden>⬢</span> {parts} <span className="text-base font-normal text-sand/70 max-sm:sr-only">{HUD.bar.parts}</span>
      </p>
      <div className="ml-auto flex gap-1.5 sm:ml-0 sm:gap-2">
        <Learn className={QUIET} />
        <button type="button" onClick={toggleMute} aria-pressed={!muted} className={QUIET}>
          <Icon name={muted ? "mute" : "sound"} className="size-[1.1em] sm:mr-1.5" />
          {/* On a phone the picture alone keeps the bar on one row; screen readers still hear the words. */}
          <span className="max-sm:sr-only">{muted ? HUD.bar.soundOff : HUD.bar.soundOn}</span>
        </button>
        <button type="button" onClick={togglePause} className={QUIET}>
          <Icon name={paused ? "play" : "pause"} className="size-[1.1em] sm:mr-1.5" />
          <span className="max-sm:sr-only">{paused ? HUD.bar.play : HUD.bar.pause}</span>
        </button>
      </div>
    </header>
  );
}

/** What to do next. Yellow jobs keep you alive; blue jobs are extra, for parts. */
function Jobs({ compact }: { compact?: boolean }) {
  const todo = useGame(useShallow((s) => jobs(s.sim)));
  const tutorial = useGame((s) => s.sim.stage < TUTORIAL_DONE);
  // While ARIA talks, she is the one thing to read.
  const talking = useGame((s) => s.line !== null);
  if (todo.length === 0 || talking) return null;
  // The three blue rocks share one line.
  const count = (job: (typeof todo)[number]) => todo.filter((j) => j.label === job.label).length;
  const all = todo.filter((job, i) => todo.findIndex((j) => j.label === job.label) === i);
  // Every yellow job is listed, but only two blue ones: a long list is hard to choose from.
  const blue = all.filter((job) => job.side);
  const unique = [...all.filter((job) => !job.side), ...blue.slice(0, 2)];
  const row = (job: (typeof todo)[number]) => (
    <>
      <span aria-hidden className={`grid size-7 shrink-0 place-items-center self-center rounded-md ring-1 ${job.side ? "bg-sunset/15 text-sunset ring-sunset/60" : "bg-sulfur/20 text-sulfur ring-sulfur"}`}>
        <Icon name={ICONS[job.at]} className="size-4" />
      </span>
      <span className="flex-1">
        {job.label}
        {count(job) > 1 && <span className="text-sand/60"> {HUD.jobs.toFind(count(job))}</span>}
      </span>
      {job.parts > 0 && <span className="font-display text-sulfur tabular-nums">+{job.parts}</span>}
    </>
  );
  const more = blue.length > 2 && <p className="mt-1 pl-9 text-sm text-sand/60">{MORE_JOBS(blue.length - 2)}</p>;
  const hint = tutorial && <p className="mt-2 border-t border-sand/10 pt-2 text-sm text-sand/70">{compact ? HUD.jobs.hintTap : HUD.jobs.hintKeys}</p>;

  // On a phone only the next job shows, as one pill under the scene. Tap it for the rest.
  if (compact)
    return (
      <details className={`${PANEL} group`}>
        <summary className={`${SUMMARY} flex items-center gap-2 p-2.5 leading-snug`}>
          <span className="sr-only">{NEXT_JOB}</span>
          {row(unique[0])}
          {unique.length > 1 && (
            <span className="ml-1 flex items-center gap-1 rounded-full bg-sand/10 px-2 py-0.5 text-sm text-sand/80">
              {OTHER_JOBS(unique.length - 1)}
              <span aria-hidden className="transition-transform group-open:rotate-180">
                ▾
              </span>
            </span>
          )}
        </summary>
        <ul className="flex flex-col gap-1.5 border-t border-sand/10 px-2.5 py-2">
          {unique.slice(1).map((job) => (
            <li key={job.label} className="flex items-baseline gap-2 leading-snug">
              {row(job)}
            </li>
          ))}
        </ul>
        {more}
        {hint && <div className="px-2.5 pb-2">{hint}</div>}
      </details>
    );

  return (
    <section className={`${PANEL} p-3`} aria-label={HUD.jobs.title}>
      <h2 className="font-display text-xl font-semibold">{HUD.jobs.title}</h2>
      {!tutorial && todo.every((job) => job.side) && <p className="text-sm text-sunset">{IDLE_HINT}</p>}
      <ul className="mt-1 flex flex-col gap-1">
        {unique.map((job) => (
          <li key={job.label} className="flex items-baseline gap-2 leading-snug">
            {row(job)}
          </li>
        ))}
      </ul>
      {more}
      {hint}
    </section>
  );
}

function Cells({ system, name }: { system: System; name: string }) {
  const cells = useGame((s) => s.sim.alloc[system]);
  const setCells = useGame((s) => s.setCells);
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: MAX_CELLS[system] }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={HUD.power.give(name, i + 1)}
          aria-pressed={i < cells}
          // Tapping the last lit bar takes it away again.
          onClick={() => setCells(system, i + 1 === cells ? i : i + 1)}
          className={`h-10 w-9 rounded-sm border-2 transition-colors hover:border-sunset ${i < cells ? "border-sunset bg-sunset shadow-[0_0_12px_var(--color-sunset)]" : "border-sand/30"}`}
        />
      ))}
    </div>
  );
}

/** Opens while the astronaut stands at the power box, once the power is on. */
function PowerBox() {
  const open = useGame((s) => s.near === "power" && s.sim.stage >= 2 && isPlaying(s));
  const used = useGame((s) => s.sim.alloc.scrubber + s.sim.alloc.oxygen + s.sim.alloc.heater);
  const power = useGame((s) => powerAt(s.sim));
  const dusty = useGame((s) => PANELS.some((p) => s.sim.work[p] > 0));
  const night = useGame((s) => !sunUp(s.sim.sol));
  const heater = useGame((s) => seen(s.sim, "night"));
  const scrubberDown = useGame((s) => s.sim.work.scrubber > 0);
  if (!open) return null;
  const note = used > power ? HUD.power.over : night && used === power ? HUD.power.nightFull : dusty ? HUD.power.dusty : night ? HUD.power.night : used === power ? HUD.power.full : HUD.power.tap;
  return (
    <section className={`${PANEL} border-sunset px-4 pt-3 pb-1`} aria-label={HUD.power.title}>
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h2 className="font-display text-xl font-semibold">
          <Icon name={ICONS.power} className="mr-1.5 size-[1.1em]" />
          {HUD.power.title}
        </h2>
        <p className={used > power ? "text-flare" : used < power ? "text-sulfur" : "text-sand/70"}>{HUD.power.using(used, power)}</p>
      </div>
      {/* The heater joins the box on the first night. */}
      {SYSTEMS.filter((id) => id !== "heater" || heater).map((id) => {
        const machine = HUD.power.machines[id];
        const stopped = id === "scrubber" && scrubberDown;
        return (
          <div key={id} className="flex items-center justify-between gap-3 border-t border-sand/10 py-2">
            <div>
              <h3 className="font-semibold">
                <Icon name={GAUGE_ICONS[id]} className="mr-1.5 size-[1.1em]" />
                {machine.name}
              </h3>
              <p className={`text-sm ${stopped ? "text-flare" : "text-sand/70"}`}>{stopped ? HUD.power.machines.scrubber.stopped : machine.does}</p>
            </div>
            <Cells system={id} name={machine.name.toLowerCase()} />
          </div>
        );
      })}
      <p className={`border-t border-sand/10 py-2 text-sm ${used > power ? "text-flare" : "text-sand/70"}`}>{note}</p>
    </section>
  );
}

/** Opens while the astronaut stands at the 3D printer. */
function Printer() {
  const open = useGame((s) => s.near === "printer" && s.sim.stage >= TUTORIAL_DONE && isPlaying(s));
  const parts = useGame((s) => s.sim.parts);
  const owned = useGame((s) => s.sim.upgrades);
  const buy = useGame((s) => s.buy);
  if (!open) return null;
  return (
    <section className={`${PANEL} border-sunset px-4 pt-3 pb-1`} aria-label={HUD.printer.title}>
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h2 className="font-display text-xl font-semibold">
          <Icon name={ICONS.printer} className="mr-1.5 size-[1.1em]" />
          {HUD.printer.title}
        </h2>
        <p className="text-sand/70">{HUD.printer.intro}</p>
      </div>
      {(Object.keys(UPGRADES) as Upgrade[]).map((id) => (
        <div key={id} className="flex items-center justify-between gap-3 border-t border-sand/10 py-1.5">
          <div>
            <h3 className="leading-tight font-semibold">
              <Icon name={UPGRADES[id].icon} className="mr-1.5 size-[1.1em]" />
              {UPGRADES[id].name}
            </h3>
            <p className="text-sm leading-tight text-sand/70">{UPGRADES[id].text}</p>
          </div>
          {owned.includes(id) ? (
            <p className="font-display text-lg text-safe">{HUD.printer.made}</p>
          ) : (
            <button type="button" onClick={() => buy(id)} disabled={parts < UPGRADE_COST[id]} className={`${BUTTON} py-1 whitespace-nowrap`}>
              {parts < UPGRADE_COST[id] ? HUD.printer.needs(UPGRADE_COST[id]) : HUD.printer.print(UPGRADE_COST[id])}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}

/** Opens at the weather station once it has been read: one real sol of Mars weather for each sol of the mission. */
function Weather() {
  const open = useGame((s) => s.near === "weather" && s.sim.work.weather === 0 && isPlaying(s));
  const day = useGame((s) => Math.floor(s.sim.sol + START_OF_DAY));
  if (!open) return null;
  const real = MARS_WEATHER[day % MARS_WEATHER.length];
  const row = "flex justify-between gap-3 border-t border-sand/10 py-1.5";
  // A real minus sign, as on the fact cards.
  const celsius = (c: number) => String(c).replace("-", "−");
  return (
    <section className={`${PANEL} border-sunset px-4 pt-3 pb-2`} aria-label={WEATHER.title}>
      <h2 className="font-display text-xl font-semibold">{WEATHER.title}</h2>
      <p className="pb-2 text-sm text-sand/70">{WEATHER.from(real.sol, real.date)}</p>
      <dl>
        {[
          [WEATHER.day, `${celsius(real.maxC)} °C`],
          [WEATHER.night, `${celsius(real.minC)} °C`],
          [WEATHER.pressure, `${real.pressurePa} Pa`],
        ].map(([label, value]) => (
          <div key={label} className={row}>
            <dt>{label}</dt>
            <dd className="font-display text-xl font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="border-t border-sand/10 pt-2 text-sm text-sand/70">
        {WEATHER.thin}{" "}
        <a href={WEATHER.source.url} target="_blank" rel="noreferrer" className="underline hover:text-sunset">
          {WEATHER.source.label}
        </a>
      </p>
    </section>
  );
}

/** The map of Earth and Mars comes up while Earth answers the call. */
function CallHome() {
  const show = useGame((s) => s.line !== null && s.sim.message === "earth" && !isOver(s.sim));
  if (!show) return null;
  return (
    <div className="rise absolute inset-x-0 top-2 flex justify-center px-2 md:top-16">
      <SpaceView brief />
    </div>
  );
}

/** ARIA talks one line at a time, and the game waits. */
function Dialog() {
  const lines = useGame((s) => MESSAGES[s.sim.message]);
  const line = useGame((s) => s.line);
  const over = useGame((s) => s.sim.won || s.sim.failure !== null);
  const interact = useGame((s) => s.interact);
  if (line === null || over) return null;
  const last = line === lines.length - 1;
  return (
    <div className="absolute inset-x-0 bottom-3 flex justify-center px-2 md:bottom-8" aria-live="polite">
      <div className={`${PANEL} rise flex w-full max-w-2xl items-start gap-3 border-2 border-sunset/60 p-3 md:gap-4 md:p-5`}>
        <div className="orb mt-1 shrink-0" aria-hidden />
        <div className="flex-1">
          <p className="font-display text-lg text-sunset">ARIA</p>
          <p key={line} className="rise text-xl leading-snug md:text-2xl">
            {lines[line]}
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="flex gap-1.5" aria-label={HUD.dialog.line(line + 1, lines.length)}>
              {lines.map((_, i) => (
                <span key={i} className={`h-1.5 w-4 rounded-full ${i <= line ? "bg-sunset" : "bg-sand/20"}`} />
              ))}
            </p>
            <button type="button" onClick={interact} className={BUTTON} autoFocus>
              {last ? HUD.dialog.ok : HUD.dialog.next}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The action for the station the astronaut is standing at. */
function Prompt() {
  const job = useGame((s) => (isPlaying(s) ? jobs(s.sim).find((j) => j.at === s.near && (j.action === "work" || j.action === "take")) : undefined));
  const working = useGame((s) => s.working);
  const done = useGame((s) => (s.working && isTask(s.near) ? round(1 - s.sim.work[s.near] / TASKS[s.near].seconds, 0.05) : 0));
  const interact = useGame((s) => s.interact);
  if (!job) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center *:pointer-events-auto md:bottom-1/4">
      {working ? (
        <div className={`${PANEL} w-60 px-4 py-2`} role="status">
          <p className="font-display text-lg">
            <Icon name={ICONS[job.at]} className="mr-1.5 size-[1.1em]" />
            {job.label}
          </p>
          <div className="my-1 h-2.5 rounded-full bg-sand/15">
            <div className="h-full rounded-full bg-sulfur" style={{ width: `${done * 100}%` }} />
          </div>
        </div>
      ) : (
        <button type="button" onClick={interact} className="rise rounded-md bg-sulfur px-5 py-2.5 font-display text-xl font-bold text-dusk shadow-lg hover:bg-sand">
          <kbd className="mr-2 hidden rounded-sm border border-dusk/40 px-1.5 font-body text-base md:inline">E</kbd>
          <Icon name={ICONS[job.at]} className="mr-1.5 size-[1.1em]" />
          {job.label}
        </button>
      )}
    </div>
  );
}

/**
 * A "Did you know?" card slides in each time a new fact is found. On a phone it
 * sits under the gauges, however many are showing; on a wide screen, top centre.
 */
function FactCard() {
  const count = useGame((s) => s.sim.facts.length);
  const id = useGame((s) => s.sim.facts.at(-1));
  // One thing at a time: the card waits until ARIA has finished talking.
  const talking = useGame((s) => s.line !== null);
  // At the end the win cards show every fact, so a late card would only sit behind them.
  const over = useGame((s) => s.sim.won || s.sim.failure !== null);
  if (!id || over) return null;
  const waiting = talking ? "invisible [animation-play-state:paused]" : "";
  return (
    <>
      {/* On a phone: a small pill to tap and read. It holds still while it is open. */}
      <details key={`pill-${count}`} className={`toast w-fit md:hidden ${waiting} open:[animation-play-state:paused]`}>
        <summary className={`${SUMMARY} flex items-center gap-1.5 rounded-full border border-sulfur/60 bg-dusk/85 px-3 py-1.5 text-sm backdrop-blur-md`} role="status">
          <span aria-hidden className="text-sulfur">
            ✦
          </span>
          {NEW_FACT} <strong>{FACTS[id].title}</strong>
        </summary>
        <div className={`${PANEL} mt-1.5 max-w-sm p-3 text-sm leading-snug`}>
          <p>{FACTS[id].text}</p>
          <p className="mt-1 text-sand/60">{HUD.fact.card(count, FACT_IDS.length)}</p>
        </div>
      </details>
      <aside key={count} className={`${PANEL} toast pointer-events-none! ${waiting} border-sulfur/60 p-3 max-md:hidden md:absolute md:top-20 md:left-1/2 md:w-[28rem] md:-translate-x-1/2`} role="status">
        <p className="flex justify-between font-display text-sulfur">
          <span>{HUD.fact.title}</span>
          <span>{HUD.fact.card(count, FACT_IDS.length)}</span>
        </p>
        <h2 className="font-display text-xl font-semibold">{FACTS[id].title}</h2>
        <p className="text-sm leading-snug md:text-base">{FACTS[id].text}</p>
      </aside>
    </>
  );
}

/** Nothing points to a secret, so finding one gets a big gold fuss in the middle of the screen. */
function SecretToast() {
  const count = useGame((s) => s.sim.secrets.length);
  const id = useGame((s) => s.sim.secrets.at(-1));
  const talking = useGame((s) => s.line !== null);
  const over = useGame((s) => isOver(s.sim));
  if (!id || over) return null;
  return (
    <div key={count} className={`toast pointer-events-none absolute inset-x-0 top-[38%] flex justify-center px-2 md:top-1/3 ${talking ? "invisible [animation-play-state:paused]" : ""}`} role="status">
      <div className={`${PANEL} border-2 border-sulfur px-6 py-3 text-center shadow-[0_0_40px_rgb(242_194_48/0.4)]`}>
        <p className="font-display text-lg text-sulfur">✦ {SECRET_FOUND} ✦</p>
        <p className="pop-in font-stencil text-4xl uppercase md:text-5xl">{SECRETS[id].name}</p>
        <p className="mt-1">{SECRETS[id].how}</p>
      </div>
    </div>
  );
}

/** A title card opens each sol, over ARIA's first words of the morning. */
function SolCard() {
  const sol = useGame((s) => (s.line === null || isOver(s.sim) ? -1 : SOLS.findIndex((x) => x.opens === s.sim.message)));
  if (sol < 0) return null;
  return (
    <div className="rise pointer-events-none absolute inset-x-0 top-[42%] px-2 text-center md:top-1/4">
      <p className={`${PANEL} inline-block px-6 py-3`}>
        <span className="block font-display text-xl text-sunset">{HUD.sol(sol + 1, SOLS.length)}</span>
        <span className="block font-stencil text-5xl leading-none uppercase md:text-7xl">{SOLS[sol].title}</span>
        <span className="block font-display text-xl text-sand/70">{SOLS[sol].focus}</span>
      </p>
    </div>
  );
}

/** Counts down to the solar flare, then counts down until it is over. */
function FlareAlert() {
  // Whole seconds until the flare hits (above zero) or until it ends (below zero).
  const seconds = useGame((s) => {
    const { sol } = s.sim;
    if (!seen(s.sim, "flare") || sol >= FLARE.to || !isPlaying(s)) return null;
    return sol < FLARE.from ? Math.ceil((FLARE.from - sol) * SECONDS_PER_SOL.value) : -Math.ceil((FLARE.to - sol) * SECONDS_PER_SOL.value);
  });
  const outside = useGame((s) => areaOf(s.player) === "outside");
  if (seconds === null) return null;
  const coming = seconds > 0;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center px-2 md:bottom-[36%]">
      <p className={`${PANEL} border-2 border-flare px-4 py-2 text-center font-display text-2xl font-bold ${outside ? "alarm-border" : ""}`}>
        <span role="status">{coming ? HUD.flare.coming : HUD.flare.now} {outside ? HUD.flare.out : HUD.flare.inside}</span>
        <span aria-hidden className="ml-3 text-flare tabular-nums">
          {Math.abs(seconds)}
        </span>
      </p>
    </div>
  );
}

function Paused() {
  const paused = useGame((s) => s.paused && !s.sim.won && s.sim.failure === null);
  const togglePause = useGame((s) => s.togglePause);
  if (!paused) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-dusk/60 p-4">
      <div className={`${PANEL} max-w-sm p-5 text-center`}>
        <h2 className="font-display text-4xl font-bold">{HUD.paused.title}</h2>
        <p className="mt-2">{HUD.paused.keys}</p>
        <button type="button" onClick={togglePause} className={`${BUTTON} mt-4`}>
          {HUD.paused.play}
        </button>
        <details className="mt-4">
          <summary className="cursor-pointer font-display text-lg text-sunset">{SPACE.title}</summary>
          <SpaceView />
        </details>
      </div>
    </div>
  );
}

/** Darkens the edges of the screen as CO₂ climbs, the way it dulls thinking. */
function Vignette() {
  const zone = useGame((s) => co2Zone(co2Pct(s.sim)));
  const cold = useGame((s) => tempZone(s.sim.tempC));
  return (
    <>
      {/* Frost creeps in from the edges as the room gets cold. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          opacity: cold === "safe" ? 0 : cold === "caution" ? 0.25 : 0.6,
          background: "radial-gradient(ellipse at center, transparent 50%, #d6ecff 115%)",
        }}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${zone === "danger" ? "alarm" : ""}`}
        style={{
          opacity: zone === "safe" ? 0 : zone === "caution" ? 0.4 : 0.85,
          background: "radial-gradient(ellipse at center, transparent 45%, var(--color-dusk) 100%)",
        }}
      />
    </>
  );
}

/** Everything drawn over the 3D scene while a chapter is being played. */
export function Hud() {
  return (
    <>
      <Vignette />
      <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 p-2 *:pointer-events-auto md:gap-3 md:p-4">
        <TopBar />
        <div className="flex items-start justify-between gap-3">
          <Gauges />
          <div className="hidden w-80 md:block">
            <Jobs />
          </div>
        </div>
        <FactCard />
      </div>
      <SolCard />
      <SecretToast />
      <CallHome />
      <FlareAlert />
      <Prompt />
      <Dialog />
      <Paused />
    </>
  );
}

/** Panels that sit under the scene on a phone and over the bottom of it on a wide screen, clear of the gauges. */
export function Controls() {
  return (
    <div className="flex flex-col gap-2 p-2 empty:hidden md:pointer-events-none md:absolute md:inset-x-0 md:bottom-0 md:mx-auto md:w-[27rem] md:p-4 md:*:pointer-events-auto">
      <div className="md:hidden">
        <Jobs compact />
      </div>
      <PowerBox />
      <Printer />
      <Weather />
      <Telescope />
    </div>
  );
}
