"use client";

import Link from "next/link";
import { useShallow } from "zustand/react/shallow";
import { CABIN_TEMP_C, CHAPTER_1_SOLS, SECONDS_PER_SOL } from "@/engine/constants";
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
import { FACT_IDS, FACTS, IDLE_HINT, MESSAGES, MORE_JOBS, SOLS, SPACE, UPGRADES, WEATHER } from "@/engine/story";
import { MARS_WEATHER } from "@/engine/weather";
import { areaOf } from "@/engine/world";
import { isPlaying, useGame } from "@/store/game";
import { SpaceView } from "./SpaceView";

// Every selector below rounds what it reads, so a component re-renders only
// when the number it shows changes, not on every simulation frame.

const PANEL = "rounded-2xl border border-sand/15 bg-dusk/85 backdrop-blur-md";
const BUTTON = "rounded-xl bg-sunset px-4 py-2 font-display text-lg font-bold text-dusk hover:bg-sand disabled:bg-sand/20 disabled:text-sand/50";
const QUIET = "rounded-xl border border-sand/30 px-3 py-1 font-display text-lg hover:border-sunset hover:text-sunset";
const ZONE_COLOR: Record<Zone, string> = {
  safe: "var(--color-safe)",
  caution: "var(--color-sulfur)",
  danger: "var(--color-flare)",
};
/** A face says how a gauge is doing before the number is read. */
const ZONE_FACE: Record<Zone, string> = {
  safe: "🙂",
  caution: "😟",
  danger: "😱",
};
const round = (n: number, step: number) => Math.round(n / step) * step;

type Band = readonly [from: number, zone: Zone];

function Gauge(props: { label: string; value: number; digits: number; trend: number; zone: Zone; status: string; min: number; max: number; bands: readonly Band[]; note?: string }) {
  const { label, value, digits, trend, zone, status, min, max, bands, note } = props;
  const at = (v: number) => `${Math.max(0, Math.min(1, (v - min) / (max - min))) * 100}%`;
  const stops = bands.map(([from, z], i) => `${ZONE_COLOR[z]} ${at(from)} ${at(bands[i + 1]?.[0] ?? max)}`);
  return (
    <div className={`${PANEL} p-2.5 md:p-3 ${zone === "danger" ? "alarm-border" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg leading-none font-semibold">{label}</h2>
        <p className="font-display text-3xl font-bold tabular-nums leading-none md:text-4xl" style={{ color: ZONE_COLOR[zone] }}>
          {value.toFixed(digits)}
          <span className="text-lg md:text-xl">%</span>
        </p>
      </div>
      <div className="relative my-2.5 h-2.5" role="meter" aria-label={label} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value.toFixed(digits)} percent, ${status}`}>
        <div
          className="h-full rounded-full opacity-80"
          style={{
            background: `linear-gradient(to right, ${stops.join(", ")})`,
          }}
        />
        <div className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dusk bg-sand transition-[left] duration-200 ease-linear" style={{ left: at(value) }} />
      </div>
      <p className="text-sm">
        <span aria-hidden>{ZONE_FACE[zone]} </span>
        <strong style={{ color: ZONE_COLOR[zone] }}>{status}</strong> {trend > 0.05 ? "and going up" : trend < -0.05 ? "and going down" : ""}
      </p>
      {note && <p className="hidden text-sm text-sand/60 md:block">{note}</p>}
    </div>
  );
}

/** A small meter that is only on screen while it matters. */
function Mini({ label, value, pct, zone, note }: { label: string; value: string; pct: number; zone: Zone; note: string }) {
  return (
    <div className={`${PANEL} px-2.5 py-1.5 md:px-3 ${zone === "danger" ? "alarm-border" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg leading-none font-semibold">{label}</h2>
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
  );
}

/** How warm the room is. Shown when the sun is gone, or while the room is still cold. */
function Room() {
  const show = useGame((s) => seen(s.sim, "night") && (isCold(s.sim.sol) || tempZone(s.sim.tempC) !== "safe"));
  const temp = useGame((s) => Math.round(s.sim.tempC));
  const heating = useGame((s) => s.sim.alloc.heater > 0);
  if (!show) return null;
  const zone = tempZone(temp);
  const note = zone === "safe" ? (heating ? "Warm. The heater is on." : "Warm.") : zone === "caution" ? "Getting cold. Use the heater." : "Freezing! Give the heater power.";
  return <Mini label="Room" value={`${temp} °C`} pct={(temp / CABIN_TEMP_C.value) * 100} zone={zone} note={note} />;
}

/** The suit's own air. Shown from the first step into the airlock until it has filled up again. */
function Suit() {
  const pct = useGame((s) => Math.round(s.sim.suit * 100));
  const show = useGame((s) => areaOf(s.player) !== "inside" || s.sim.suit < 1);
  const outside = useGame((s) => areaOf(s.player) === "outside");
  if (!show) return null;
  const zone: Zone = pct > 50 ? "safe" : pct > 25 ? "caution" : "danger";
  return <Mini label="Suit air" value={`${pct}%`} pct={pct} zone={zone} note={!outside ? "Filling up inside." : zone === "safe" ? "You are breathing suit air." : "Go back to the airlock!"} />;
}

/** How hungry the astronaut is. Shown from the first rumble until the salad is eaten. */
function Food() {
  const show = useGame((s) => seen(s.sim, "hungry") && s.sim.work.salad > 0);
  const pct = useGame((s) => Math.round(s.sim.food * 20) * 5);
  const grown = useGame((s) => Math.floor(s.sim.grow * 10) * 10);
  const watered = useGame((s) => s.sim.work.plant === 0);
  if (!show) return null;
  const zone: Zone = pct > 25 ? "safe" : pct > 0 ? "caution" : "danger";
  const todo = grown >= 100 ? "The salad is ready. Eat!" : watered ? `The salad is growing: ${grown}%` : "Water the salad plants.";
  return <Mini label="Food" value={pct > 0 ? "Hungry" : "Very hungry"} pct={pct} zone={zone} note={pct > 0 ? todo : `You are slow. ${todo}`} />;
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
  return <Mini label="Radiation" value={`${pct}%`} pct={pct} zone={zone} note={outside ? "Get inside!" : !stacked ? "The walls stop most of it. Stack the bags!" : hit ? "The bag shelter keeps you safe." : "Stay inside."} />;
}

/** How long the air will last while it leaks. Shown once the air screen has been read, until the hole is patched. */
function TimeLeft() {
  const show = useGame((s) => s.sim.work.leak > 0 && s.sim.work.gauge === 0 && seen(s.sim, "leak"));
  // In tenths of a sol, capped at the two sols the bar can show.
  const sols = useGame((s) => Math.round(Math.min(2, reserveSols(s.sim, areaOf(s.player))) * 10) / 10);
  if (!show) return null;
  const zone: Zone = sols > 1 ? "safe" : sols > 0.4 ? "caution" : "danger";
  return <Mini label="Time left" value={sols >= 2 ? "2 sols or more" : `${sols.toFixed(1)} sols`} pct={sols * 50} zone={zone} note="Until the oxygen is too low. Patch the hole!" />;
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
    <div className="grid w-full grid-cols-2 gap-2 md:w-64 md:grid-cols-1">
      <Gauge
        label="Oxygen"
        value={o2}
        digits={1}
        trend={o2Trend}
        zone={o2z}
        status={o2z === "safe" ? "Good" : o2 > 21 ? "Too much" : o2z === "danger" ? "Danger!" : "Getting low"}
        min={15}
        max={26}
        bands={[[15, "danger"], [17.5, "caution"], [19.5, "safe"], [23.5, "caution"]]}
        note={learning ? "The air you breathe in. Good from 19.5 to 23.5%." : undefined}
      />
      <Gauge
        label="CO₂"
        value={co2}
        digits={2}
        trend={co2Trend}
        zone={co2z}
        status={co2z === "safe" ? "Good" : co2z === "danger" ? "Danger!" : "Too much"}
        min={0}
        max={4}
        bands={[[0, "safe"], [0.7, "caution"], [1.3, "danger"]]}
        note={learning ? "The air you breathe out. Good below 0.7%." : undefined}
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
    <header className={`${PANEL} flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2`}>
      <p className="font-display text-lg leading-tight">
        <Link href="/" className="font-stencil text-xl uppercase hover:text-sunset">
          Mission Vigil
        </Link>
        <span className="ml-3 hidden text-sand/70 sm:inline">{SOLS[Math.min(Math.floor(tenMinutes / 144), SOLS.length - 1)].title}</span>
      </p>
      <div className="order-last w-full md:order-none md:w-auto md:flex-1">
        <div className="relative h-2 rounded-full bg-sand/15" role="progressbar" aria-label="Time until the big air system is ready" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          {NIGHTS.map((from) => (
            <div
              key={from}
              className="absolute inset-y-0 bg-dusk/80"
              style={{
                left: pct(from),
                width: pct(Math.min(0.5, CHAPTER_1_SOLS.value - from)),
              }}
              title="Night"
            />
          ))}
          {stormKnown && (
            <div
              className="absolute inset-y-0 bg-regolith"
              style={{
                left: pct(STORM.from),
                width: pct(STORM.to - STORM.from),
              }}
              title="Dust storm"
            />
          )}
          {flareKnown && (
            <div
              className="absolute inset-y-0 bg-flare"
              style={{
                left: pct(FLARE.from),
                width: pct(FLARE.to - FLARE.from),
              }}
              title="Solar flare"
            />
          )}
          <div className="absolute inset-y-0 left-0 rounded-full bg-sand/80" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <p className="ml-auto font-display text-xl font-bold tabular-nums md:ml-0 md:text-2xl">
        <span aria-hidden className="mr-1.5 text-sulfur">
          {day ? "☀" : "☾"}
        </span>
        Sol {Math.floor(tenMinutes / 144) + 1}, {clock}
      </p>
      <p key={parts} className="pop font-display text-xl font-bold text-sulfur tabular-nums md:text-2xl" title="Parts. Spend them at the 3D printer.">
        <span aria-hidden>⬢</span> {parts} <span className="text-base font-normal text-sand/70">parts</span>
      </p>
      <button type="button" onClick={toggleMute} aria-pressed={!muted} className={QUIET}>
        {muted ? "Sound off" : "Sound on"}
      </button>
      <button type="button" onClick={togglePause} className={QUIET}>
        {paused ? "Play" : "Pause"}
      </button>
    </header>
  );
}

/** What to do next. Yellow jobs keep you alive; blue jobs are extra, for parts. */
function Jobs() {
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
  return (
    <section className={`${PANEL} p-3`} aria-label="Jobs">
      <h2 className="font-display text-xl font-semibold">Jobs</h2>
      {!tutorial && todo.every((job) => job.side) && <p className="text-sm text-sunset">{IDLE_HINT}</p>}
      <ul className="mt-1 flex flex-col gap-1">
        {unique.map((job, i) => (
          <li key={job.label} className={`flex items-baseline gap-2 leading-snug ${i > 2 ? "hidden md:flex" : ""}`}>
            <span aria-hidden className={job.side ? "text-sunset" : "text-sulfur"}>
              ◆
            </span>
            <span className="flex-1">
              {job.label}
              {count(job) > 1 && <span className="text-sand/60"> ({count(job)} to find)</span>}
            </span>
            {job.parts > 0 && <span className="font-display text-sulfur tabular-nums">+{job.parts}</span>}
          </li>
        ))}
      </ul>
      {blue.length > 2 && <p className="mt-1 hidden pl-5 text-sm text-sand/60 md:block">{MORE_JOBS(blue.length - 2)}</p>}
      {tutorial && (
        <p className="mt-2 border-t border-sand/10 pt-2 text-sm text-sand/70">
          <span className="md:hidden">Tap where you want to go. Tap a machine to use it.</span>
          <span className="hidden md:inline">Walk with the arrow keys or W A S D, or click where you want to go.</span>
        </p>
      )}
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
          aria-label={`Give the ${name} ${i + 1} power`}
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
  const full = "To give a machine more power, take some back from another.";
  const note =
    used > power
      ? "Too many machines are on, so they all run slow. Tap a lit bar to take power back."
      : night && used === power
        ? `It is night, so the solar panels are asleep. ${full}`
        : dusty
          ? "Dusty solar panels give no power. Clean them to get more."
          : night
            ? "It is night. The solar panels sleep until the sun comes up."
            : used === power
              ? `All the power is in use. ${full}`
              : "Tap a bar to give power. Tap it again to take it back.";
  const row = "flex items-center justify-between gap-3 border-t border-sand/10 py-2";
  return (
    <section className={`${PANEL} border-sunset px-4 pt-3 pb-1`} aria-label="Power box">
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h2 className="font-display text-xl font-semibold">Power box</h2>
        <p className={used > power ? "text-flare" : used < power ? "text-sulfur" : "text-sand/70"}>
          Using {used} of {power} power
        </p>
      </div>
      <div className={row}>
        <div>
          <h3 className="font-semibold">Air cleaner</h3>
          <p className={`text-sm ${scrubberDown ? "text-flare" : "text-sand/70"}`}>{scrubberDown ? "Stopped. It needs a new filter." : "Takes CO₂ out of the air."}</p>
        </div>
        <Cells system="scrubber" name="air cleaner" />
      </div>
      <div className={row}>
        <div>
          <h3 className="font-semibold">Oxygen maker</h3>
          <p className="text-sm text-sand/70">Makes new oxygen.</p>
        </div>
        <Cells system="oxygen" name="oxygen maker" />
      </div>
      {heater && (
        <div className={row}>
          <div>
            <h3 className="font-semibold">Heater</h3>
            <p className="text-sm text-sand/70">Keeps the room warm when the sun is gone.</p>
          </div>
          <Cells system="heater" name="heater" />
        </div>
      )}
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
    <section className={`${PANEL} border-sunset px-4 pt-3 pb-1`} aria-label="3D printer">
      <div className="flex items-baseline justify-between gap-3 pb-2">
        <h2 className="font-display text-xl font-semibold">3D printer</h2>
        <p className="text-sand/70">Turn parts into upgrades</p>
      </div>
      {(Object.keys(UPGRADES) as Upgrade[]).map((id) => (
        <div key={id} className="flex items-center justify-between gap-3 border-t border-sand/10 py-1.5">
          <div>
            <h3 className="leading-tight font-semibold">{UPGRADES[id].name}</h3>
            <p className="text-sm leading-tight text-sand/70">{UPGRADES[id].text}</p>
          </div>
          {owned.includes(id) ? (
            <p className="font-display text-lg text-safe">Made!</p>
          ) : (
            <button type="button" onClick={() => buy(id)} disabled={parts < UPGRADE_COST[id]} className={`${BUTTON} py-1 whitespace-nowrap`}>
              {parts < UPGRADE_COST[id] ? `Needs ${UPGRADE_COST[id]}` : `Print for ${UPGRADE_COST[id]}`}
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
            <p className="flex gap-1.5" aria-label={`Line ${line + 1} of ${lines.length}`}>
              {lines.map((_, i) => (
                <span key={i} className={`h-1.5 w-4 rounded-full ${i <= line ? "bg-sunset" : "bg-sand/20"}`} />
              ))}
            </p>
            <button type="button" onClick={interact} className={BUTTON} autoFocus>
              {last ? "OK" : "Next"}
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
          <p className="font-display text-lg">{job.label}</p>
          <div className="my-1 h-2.5 rounded-full bg-sand/15">
            <div className="h-full rounded-full bg-sulfur" style={{ width: `${done * 100}%` }} />
          </div>
        </div>
      ) : (
        <button type="button" onClick={interact} className="rise rounded-md bg-sulfur px-5 py-2.5 font-display text-xl font-bold text-dusk shadow-lg hover:bg-sand">
          <kbd className="mr-2 hidden rounded-sm border border-dusk/40 px-1.5 font-body text-base md:inline">E</kbd>
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
  if (!id) return null;
  return (
    <aside key={count} className={`${PANEL} toast pointer-events-none! ${talking ? "invisible [animation-play-state:paused]" : ""} border-sulfur/60 p-3 md:absolute md:top-20 md:left-1/2 md:w-[28rem] md:-translate-x-1/2`} role="status">
      <p className="flex justify-between font-display text-sulfur">
        <span>Did you know?</span>
        <span>
          Card {count} of {FACT_IDS.length}
        </span>
      </p>
      <h2 className="font-display text-xl font-semibold">{FACTS[id].title}</h2>
      <p className="text-sm leading-snug md:text-base">{FACTS[id].text}</p>
    </aside>
  );
}

/** A title card opens each sol, over ARIA's first words of the morning. */
function SolCard() {
  const sol = useGame((s) => (s.line === null || isOver(s.sim) ? -1 : SOLS.findIndex((x) => x.opens === s.sim.message)));
  if (sol < 0) return null;
  return (
    <div className="rise pointer-events-none absolute inset-x-0 top-[42%] px-2 text-center md:top-1/4">
      <p className={`${PANEL} inline-block px-6 py-3`}>
        <span className="block font-display text-xl text-sunset">
          Sol {sol + 1} of {SOLS.length}
        </span>
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
        <span role="status">{coming ? "Solar flare coming!" : "Solar flare!"} {outside ? "Get inside!" : "Stay inside."}</span>
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
        <h2 className="font-display text-4xl font-bold">Paused</h2>
        <p className="mt-2">Walk with the arrow keys or W A S D. Press E to use things. Press P to pause.</p>
        <button type="button" onClick={togglePause} className={`${BUTTON} mt-4`}>
          Play
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
        <Jobs />
      </div>
      <PowerBox />
      <Printer />
      <Weather />
    </div>
  );
}
