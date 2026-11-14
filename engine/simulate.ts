import {
  BASE_POWER,
  CABIN_PRESSURE_KPA,
  CABIN_TEMP_C,
  CABIN_TEMP_K,
  CABIN_VOLUME_M3,
  CHAPTER_1_SOLS,
  CO2_DANGER_PCT,
  CO2_FAIL_PCT,
  CO2_KG_PER_DAY,
  CO2_SAFE_MAX_PCT,
  COOLING_C_PER_SOL,
  FLARE_SECONDS,
  FULL_SOLS,
  GROW_SOLS,
  HEATER_C_PER_CELL_SOL,
  LEAK_FRACTION_PER_SOL,
  O2_DANGER_PCT,
  O2_FAIL_PCT,
  O2_NORMAL_PCT,
  O2_SAFE_MAX_PCT,
  O2_SAFE_MIN_PCT,
  OXYGEN_KG_PER_CELL_SOL,
  OXYGEN_KG_PER_DAY,
  SCRUBBER_KG_PER_CELL_SOL,
  SECONDS_PER_SOL,
  SOL_DAYS,
  SUIT_SECONDS,
  TEMP_DANGER_C,
  TEMP_FAIL_C,
  TEMP_SAFE_MIN_C,
  WARMING_C_PER_SOL,
} from "./constants.ts";

// Chapter 1 rules. The player wakes in a dead base and keeps it alive for five
// sols: a guided start (the tutorial stages), then the clock runs and each sol
// brings one new demand: air, power and heat, food and water, radiation, and
// the call home. Every job is done by standing at a station and working for a
// few seconds.

export const PANELS = ["panel0", "panel1", "panel2"] as const;
export const ROCKS = ["rock0", "rock1", "rock2"] as const;

export type System = "scrubber" | "oxygen" | "heater";
export type Allocation = Readonly<Record<System, number>>;
/** Hands-on jobs, each named after the station it is done at. */
export type Task = "power" | "scrubber" | "leak" | "plant" | "salad" | "recycler" | "bike" | "antenna" | "weather" | "rover" | "console" | (typeof PANELS)[number] | (typeof ROCKS)[number];
export type StationId = Task | "storage" | "printer" | "shelter";
export type Area = "inside" | "airlock" | "outside";
export type Item = "filter" | "patch";
export type Upgrade = "boots" | "tools" | "tank" | "walls" | "battery";
export type Failure = "co2" | "o2" | "suit" | "cold" | "radiation";
export type Zone = "safe" | "caution" | "danger";
export type EventId = "night" | "forecast" | "storm" | "filter" | "clear" | "hungry" | "leak" | "flare" | "allclear" | "lastsol" | "restart";
export type MessageId = EventId | "intro" | "switch" | "cleaner" | "oxygen" | "ready" | "suit" | "earth";
export type FactId =
  | "sol"
  | "co2"
  | "moxie"
  | "insight"
  | "veggie"
  | "delay"
  | "samples"
  | "suit"
  | "marsair"
  | "apollo13"
  | "thinair"
  | "printer"
  | "rtg"
  | "cold"
  | "wind"
  | "water"
  | "bones"
  | "food"
  | "rover"
  | "flare"
  | "aurora";

/** What the astronaut is doing during a step. */
export type Input = {
  readonly area: Area;
  /** The station within reach, if any. */
  readonly near: StationId | null;
  /** Standing still at `near` and working on its job. */
  readonly working: boolean;
};

export type SimState = {
  /** Tutorial step, 0 to TUTORIAL_DONE. The clock and the air only run once it is done. */
  readonly stage: number;
  readonly sol: number;
  readonly o2Kg: number;
  readonly co2Kg: number;
  /** Cabin temperature in °C. */
  readonly tempC: number;
  readonly alloc: Allocation;
  /** Seconds of work left on each job. Zero means nothing to do there. */
  readonly work: Readonly<Record<Task, number>>;
  readonly carrying: Item | null;
  /** Suit air left, 0 to 1. */
  readonly suit: number;
  /** How full the astronaut's stomach is, 0 to 1. At 0 they walk and work slowly. */
  readonly food: number;
  /** How far the salad has grown, 0 to 1. */
  readonly grow: number;
  /** Radiation taken in the solar flare, as a share of what ends the chapter. */
  readonly dose: number;
  /** Parts in hand, to spend at the 3D printer. */
  readonly parts: number;
  /** Parts earned in total. This is the score. */
  readonly earned: number;
  readonly upgrades: readonly Upgrade[];
  /** Fact cards found so far, oldest first. */
  readonly facts: readonly FactId[];
  /** What ARIA said last, and how many times she has spoken. */
  readonly message: MessageId;
  readonly said: number;
  /** Index into EVENTS of the next event to fire. */
  readonly nextEvent: number;
  /** Sols spent with the air and the cabin temperature all in the safe band. */
  readonly safeSols: number;
  readonly peakCo2Pct: number;
  readonly minO2Pct: number;
  readonly minTempC: number;
  readonly failure: Failure | null;
  readonly won: boolean;
};

/** One thing to do, and where. Drives the job list, the floor trail, the markers and the prompt. */
export type Job = {
  readonly at: StationId;
  readonly label: string;
  /** work: stand and work. take: pick up a part. route: use the power box. go: just walk there. */
  readonly action: "work" | "take" | "route" | "go";
  /** Parts paid when done. */
  readonly parts: number;
  /** Optional job: good for parts, not needed to survive. */
  readonly side: boolean;
};

export const TUTORIAL_DONE = 4;
/** The clock starts before dawn, at 05:30, so the first trip outside is at sunrise. As a share of a sol. */
export const START_OF_DAY = 5.5 / 24;
/** The dust storm. It ends in the morning, so the panels are cleaned in sunlight. Game rule. */
export const STORM = { from: 1.35, to: 2.1 } as const;
/** The solar flare: ARIA's warning comes a few seconds before it hits. Game rule. */
export const FLARE = { from: 3.4, to: 3.7 } as const;
/** The chapter script. Times are game rules. */
export const EVENTS: readonly { id: EventId; atSol: number }[] = [
  { id: "night", atSol: 0.522 }, // sunset on sol 1
  { id: "forecast", atSol: 1.03 },
  { id: "storm", atSol: STORM.from },
  { id: "filter", atSol: 1.65 },
  { id: "clear", atSol: STORM.to },
  { id: "hungry", atSol: 2.3 },
  { id: "leak", atSol: 3.08 },
  { id: "flare", atSol: 3.28 },
  { id: "allclear", atSol: FLARE.to },
  { id: "lastsol", atSol: 4.03 },
  { id: "restart", atSol: CHAPTER_1_SOLS.value },
];
const EVENT_INDEX = Object.fromEntries(EVENTS.map((e, i) => [e.id, i])) as Record<EventId, number>;
/** True once ARIA has announced `id`. */
export const seen = (s: SimState, id: EventId) => s.nextEvent > EVENT_INDEX[id];

export const MAX_CELLS: Allocation = { scrubber: 4, oxygen: 4, heater: 2 };
export const NO_POWER: Allocation = { scrubber: 0, oxygen: 0, heater: 0 };
/** What each upgrade costs in parts. Game rule. */
export const UPGRADE_COST: Readonly<Record<Upgrade, number>> = { boots: 120, tools: 150, tank: 180, walls: 200, battery: 300 };
/** Parts paid for each guided step that has no hands-on job. Game rule. */
const STEP_PARTS = 20;
/** Seconds indoors to refill an empty suit. Game rule. */
const SUIT_REFILL_SECONDS = 8;

type TaskRule = { readonly seconds: number; readonly parts: number; readonly label: string; readonly fact?: FactId; readonly needs?: Item; readonly side?: boolean };
const panel = (side: string): TaskRule => ({ seconds: 2, parts: 40, label: `Clean the ${side} solar panel`, fact: "insight" });
const rock: TaskRule = { seconds: 1.5, parts: 40, label: "Pick up a blue rock", fact: "samples", side: true };
/** How long each job takes, what it pays, and what it teaches. Game rules. */
export const TASKS: Readonly<Record<Task, TaskRule>> = {
  power: { seconds: 1.2, parts: 20, label: "Turn on the power", fact: "sol" },
  scrubber: { seconds: 3.5, parts: 80, label: "Put the new filter in the air cleaner", fact: "apollo13", needs: "filter" },
  leak: { seconds: 3.5, parts: 100, label: "Patch the hole by the outside door", fact: "thinair", needs: "patch" },
  console: { seconds: 1.5, parts: 100, label: "Press the big green button" },
  plant: { seconds: 2, parts: 30, label: "Water the salad plants", fact: "veggie", side: true },
  salad: { seconds: 2, parts: 60, label: "Pick the salad and eat it", fact: "food" },
  recycler: { seconds: 3, parts: 80, label: "Fix the water cleaner", fact: "water", side: true },
  bike: { seconds: 3, parts: 30, label: "Ride the exercise bike", fact: "bones", side: true },
  antenna: { seconds: 3, parts: 60, label: "Point the radio dish at Earth", fact: "delay", side: true },
  weather: { seconds: 2, parts: 60, label: "Read the weather station", fact: "wind", side: true },
  rover: { seconds: 2.5, parts: 60, label: "Wake up the rover", fact: "rover", side: true },
  panel0: panel("left"),
  panel1: panel("middle"),
  panel2: panel("right"),
  rock0: rock,
  rock1: rock,
  rock2: rock,
};
const TASK_IDS = Object.keys(TASKS) as Task[];
export const isTask = (id: StationId | null): id is Task => id !== null && id in TASKS;
/** Most parts a perfect run can earn: every job once, the panels twice, and three guided steps. */
export const MAX_PARTS = TASK_IDS.reduce((sum, t) => sum + TASKS[t].parts, 0) + PANELS.reduce((sum, p) => sum + TASKS[p].parts, 0) + 3 * STEP_PARTS;

// Ideal gas law: n = PV / RT. Total pressure is held constant (game rule), so
// each gas's share of the air is its moles over this fixed total.
const CABIN_MOL = (CABIN_PRESSURE_KPA.value * 1000 * CABIN_VOLUME_M3.value) / (8.314 * CABIN_TEMP_K.value);
const O2_KG_PER_PCT = (CABIN_MOL * 0.032) / 100;
const CO2_KG_PER_PCT = (CABIN_MOL * 0.04401) / 100;

export const o2Pct = (s: SimState) => s.o2Kg / O2_KG_PER_PCT;
export const co2Pct = (s: SimState) => s.co2Kg / CO2_KG_PER_PCT;

export function o2Zone(pct: number): Zone {
  if (pct < O2_DANGER_PCT.value) return "danger";
  return pct < O2_SAFE_MIN_PCT.value || pct > O2_SAFE_MAX_PCT.value ? "caution" : "safe";
}

export function co2Zone(pct: number): Zone {
  if (pct >= CO2_DANGER_PCT.value) return "danger";
  return pct >= CO2_SAFE_MAX_PCT.value ? "caution" : "safe";
}

export function tempZone(c: number): Zone {
  if (c < TEMP_DANGER_C.value) return "danger";
  return c < TEMP_SAFE_MIN_C.value ? "caution" : "safe";
}

export function initialState(): SimState {
  const armed = (t: Task) => (t === "scrubber" || t === "leak" || t === "console" ? 0 : TASKS[t].seconds);
  return {
    stage: 0,
    sol: 0,
    o2Kg: O2_NORMAL_PCT.value * O2_KG_PER_PCT,
    co2Kg: 1.2 * CO2_KG_PER_PCT, // stale air after the long sleep (game rule)
    tempC: CABIN_TEMP_C.value,
    alloc: NO_POWER,
    work: Object.fromEntries(TASK_IDS.map((t) => [t, armed(t)])) as Record<Task, number>,
    carrying: null,
    suit: 1,
    food: 1,
    grow: 0,
    dose: 0,
    parts: 0,
    earned: 0,
    upgrades: [],
    facts: [],
    message: "intro",
    said: 0,
    nextEvent: 0,
    safeSols: 0,
    peakCo2Pct: 1.2,
    minO2Pct: O2_NORMAL_PCT.value,
    minTempC: CABIN_TEMP_C.value,
    failure: null,
    won: false,
  };
}

export const isStorm = (sol: number) => sol >= STORM.from && sol < STORM.to;
export const isFlare = (sol: number) => sol >= FLARE.from && sol < FLARE.to;
/** The sun is up from 06:00 to 18:00. */
export function sunUp(sol: number): boolean {
  const hour = ((sol + START_OF_DAY) % 1) * 24;
  return hour >= 6 && hour < 18;
}
/** With no sun on the walls, at night or under the dust, the cabin loses heat. */
export const isCold = (sol: number) => !sunUp(sol) || isStorm(sol);
export const isOver = (s: SimState) => s.won || s.failure !== null;
/** Nothing until the main switch is on; then the fuel cell, one per clean solar panel while the sun is up, and the spare battery. */
export function powerAt(s: SimState): number {
  if (s.work.power > 0) return 0;
  const solar = sunUp(s.sol) ? PANELS.filter((p) => s.work[p] === 0).length : 0;
  return BASE_POWER.value + solar + (s.upgrades.includes("battery") ? 1 : 0);
}
const used = (s: SimState) => s.alloc.scrubber + s.alloc.oxygen + s.alloc.heater;
export const suitSeconds = (s: SimState) => SUIT_SECONDS.value * (s.upgrades.includes("tank") ? 1.5 : 1);
/** An empty stomach halves how fast the astronaut walks and works. */
export const isStarving = (s: SimState) => s.food === 0;

const job = (at: StationId, label: string, action: Job["action"], parts = 0, side = false): Job => ({ at, label, action, parts, side });
const WORK = Object.fromEntries(TASK_IDS.map((t) => [t, job(t, TASKS[t].label, "work", TASKS[t].parts, TASKS[t].side)])) as Record<Task, Job>;
/** The same job, but now it has to be done. */
const must = (t: Task) => ({ ...WORK[t], side: false });
const WATER_NOW = must("plant");
const CALL_NOW = must("antenna");
const GO_POWER = job("power", "Walk to the power box", "go");
const ROUTE_CLEANER = job("power", "Give 2 power to the air cleaner", "route", STEP_PARTS);
const ROUTE_OXYGEN = job("power", "Give 1 power to the oxygen maker", "route", STEP_PARTS);
const ROUTE_HEATER = job("power", "Give 1 power to the heater", "route", STEP_PARTS);
const HEAT_AGAIN = job("power", "It is getting cold. Give power to the heater", "route");
const ROUTE_SPARE = job("power", "Use your spare power at the power box", "route");
const ROUTE_LESS = job("power", "Too many machines are on. Choose at the power box", "route");
const TAKE_FILTER = job("storage", "Take a new filter from the shelf", "take");
const TAKE_PATCH = job("storage", "Take a patch from the shelf", "take");
const SHELTER = job("shelter", "Solar flare! Stay inside the base", "go");
const TUTORIAL = [[GO_POWER], [WORK.power], [ROUTE_CLEANER], [ROUTE_OXYGEN]];
const INDOOR_SIDE: readonly Task[] = ["recycler", "bike"];
const OUTDOOR_SIDE: readonly Task[] = ["antenna", "weather", "rover", ...ROCKS];

/**
 * What there is to do right now, most urgent first, optional jobs last.
 * Returns the same Job objects every call, so lists compare cheaply.
 */
export function jobs(s: SimState): Job[] {
  if (isOver(s)) return [];
  if (s.stage < TUTORIAL_DONE) return TUTORIAL[s.stage];
  const list: Job[] = [];
  // Dust keeps falling in a storm and the flare is deadly, so outdoor jobs wait until they have passed.
  const outdoors = !isStorm(s.sol) && !isFlare(s.sol);
  // The salad is picked when the astronaut gets hungry, not before. Watering it early means it is ready in time.
  const hungry = seen(s, "hungry") && s.work.salad > 0;
  const calling = seen(s, "lastsol") && s.work.antenna > 0;

  if (s.work.console > 0) list.push(WORK.console);
  if (seen(s, "flare") && s.sol < FLARE.to) list.push(SHELTER);
  if (s.work.scrubber > 0) list.push(s.carrying === "filter" ? WORK.scrubber : TAKE_FILTER);
  // The leak is the one outdoor job left open in the flare: patch it now, or wait and lose air?
  if (s.work.leak > 0) {
    if (s.carrying === "patch") list.push(WORK.leak);
    else if (s.work.scrubber === 0) list.push(TAKE_PATCH);
  }
  // The first cold night is a lesson with a reward; after that it is a reminder.
  if (seen(s, "night") && isCold(s.sol) && s.alloc.heater === 0) list.push(s.facts.includes("cold") ? HEAT_AGAIN : ROUTE_HEATER);
  if (used(s) > powerAt(s)) list.push(ROUTE_LESS);
  // All the panels come before anything indoors, so one trip outside cleans them all.
  if (outdoors) for (const p of PANELS) if (s.work[p] > 0) list.push(WORK[p]);
  if (outdoors && calling) list.push(CALL_NOW);
  if (hungry && s.grow >= 1) list.push(WORK.salad);
  if (hungry && s.work.plant > 0) list.push(WATER_NOW);
  if (used(s) < powerAt(s)) list.push(ROUTE_SPARE);

  if (!hungry && s.work.plant > 0) list.push(WORK.plant);
  for (const t of INDOOR_SIDE) if (s.work[t] > 0) list.push(WORK[t]);
  if (outdoors) for (const t of OUTDOOR_SIDE) if (s.work[t] > 0 && !(t === "antenna" && calling)) list.push(WORK[t]);
  return list;
}

/** Move power between the machines. Taking power back always works; giving more needs spare power. */
export function setCells(s: SimState, system: System, cells: number): SimState {
  const room = Math.max(s.alloc[system], powerAt(s) - (used(s) - s.alloc[system]));
  return { ...s, alloc: { ...s.alloc, [system]: Math.max(0, Math.min(cells, MAX_CELLS[system], room)) } };
}

/** Pick up from the shelf whichever spare part is needed, the air cleaner's first. */
export function take(s: SimState): SimState {
  const item = s.work.scrubber > 0 ? "filter" : s.work.leak > 0 ? "patch" : null;
  return item ? { ...s, carrying: item } : s;
}

/** Print an upgrade, if there are parts for it. */
export function buy(s: SimState, upgrade: Upgrade): SimState {
  if (s.upgrades.includes(upgrade) || s.parts < UPGRADE_COST[upgrade]) return s;
  return { ...s, parts: s.parts - UPGRADE_COST[upgrade], upgrades: [...s.upgrades, upgrade], facts: s.facts.includes("printer") ? s.facts : [...s.facts, "printer"] };
}

/** Net change of each gas in percentage points per sol, for the HUD trend readouts. */
export function trends(s: SimState, area: Area): { o2: number; co2: number } {
  const r = rates(s, area);
  return { o2: r.o2 / O2_KG_PER_PCT, co2: r.co2 / CO2_KG_PER_PCT };
}

/** Net change per sol: kg of each gas, and °C of cabin temperature. */
function rates(s: SimState, area: Area) {
  // If the machines ask for more than the base has, they all slow down together.
  const scale = Math.min(1, powerAt(s) / Math.max(used(s), 1));
  const leak = s.work.leak > 0 ? LEAK_FRACTION_PER_SOL.value : 0;
  // A full filter stops the air cleaner until it is swapped.
  const scrubbing = s.work.scrubber > 0 || s.co2Kg <= 0 ? 0 : SCRUBBER_KG_PER_CELL_SOL.value * s.alloc.scrubber * scale;
  // Outside, the astronaut breathes from the suit, not the cabin.
  const breathing = area === "outside" ? 0 : SOL_DAYS;
  const weather = isCold(s.sol) ? -COOLING_C_PER_SOL.value * (s.upgrades.includes("walls") ? 0.5 : 1) : WARMING_C_PER_SOL.value;
  return {
    o2: OXYGEN_KG_PER_CELL_SOL.value * s.alloc.oxygen * scale - OXYGEN_KG_PER_DAY.value * breathing - leak * s.o2Kg,
    co2: CO2_KG_PER_DAY.value * breathing - scrubbing - leak * s.co2Kg,
    temp: weather + HEATER_C_PER_CELL_SOL.value * s.alloc.heater * scale,
  };
}

type Draft = { -readonly [K in keyof SimState]: SimState[K] };

/** Advance the game by `seconds` of play. Pure: returns a new state. */
export function step(s: SimState, input: Input, seconds: number): SimState {
  if (isOver(s)) return s;
  const d: Draft = { ...s };
  const say = (message: MessageId) => {
    d.message = message;
    d.said++;
  };
  const learn = (fact?: FactId) => {
    if (fact && !d.facts.includes(fact)) d.facts = [...d.facts, fact];
  };
  const reward = (parts: number) => {
    d.parts += parts;
    d.earned += parts;
  };

  // Hands-on work at the station the astronaut is standing at.
  const doing = input.working ? jobs(s).find((j) => j.at === input.near && j.action === "work") : undefined;
  if (doing && isTask(doing.at)) {
    const task = doing.at;
    const pace = (s.upgrades.includes("tools") ? 2 : 1) * (isStarving(s) ? 0.5 : 1);
    const left = Math.max(0, s.work[task] - seconds * pace);
    d.work = { ...s.work, [task]: left };
    if (left === 0) {
      reward(TASKS[task].parts);
      learn(TASKS[task].fact);
      if (TASKS[task].needs) d.carrying = null;
      if (task === "power") {
        d.stage = 2;
        say("cleaner");
      }
      if (task === "salad") d.food = 1;
      if (task === "antenna") say("earth");
      if (task === "console") d.won = true;
    }
  }

  // The guided start, and the heater lesson on the first night.
  if (s.stage === 0 && input.near === "power") {
    d.stage = 1;
    say("switch");
  } else if (s.stage === 2 && s.alloc.scrubber >= 2) {
    d.stage = 3;
    reward(STEP_PARTS);
    learn("co2");
    say("oxygen");
  } else if (s.stage === 3 && s.alloc.oxygen >= 1) {
    d.stage = TUTORIAL_DONE;
    reward(STEP_PARTS);
    learn("moxie");
    say("ready");
  } else if (seen(s, "night") && !s.facts.includes("cold") && s.alloc.heater >= 1) {
    reward(STEP_PARTS);
    learn("cold");
  }

  // The suit drains outside and refills indoors. ARIA explains it at the first step into the airlock.
  const outside = input.area === "outside";
  if (input.area !== "inside" && !s.facts.includes("suit")) {
    learn("suit");
    say("suit");
  }
  if (outside) learn("marsair");
  d.suit = Math.max(0, Math.min(1, s.suit + (outside ? -seconds / suitSeconds(s) : seconds / SUIT_REFILL_SECONDS)));
  if (outside && d.suit === 0) d.failure = "suit";

  // The clock and the air stand still until the tutorial is done.
  if (s.stage < TUTORIAL_DONE || d.failure) return d;
  const event = EVENTS[s.nextEvent];
  const dtSol = seconds / SECONDS_PER_SOL.value;
  const fires = event !== undefined && s.sol + dtSol >= event.atSol;
  const dt = fires ? event.atSol - s.sol : dtSol;
  const r = rates(s, input.area);
  d.sol = s.sol + dt;
  d.o2Kg = s.o2Kg + r.o2 * dt;
  d.co2Kg = Math.max(0, s.co2Kg + r.co2 * dt);
  d.tempC = Math.min(CABIN_TEMP_C.value, s.tempC + r.temp * dt);
  // Hunger grows until the garden feeds you; after that there is salad to pick whenever you like.
  if (d.work.salad > 0) d.food = Math.max(0, s.food - dt / FULL_SOLS.value);
  // Watered salad grows under the lamps, and twice as fast once the water cleaner keeps it wet.
  if (s.work.plant === 0 && s.work.power === 0) d.grow = Math.min(1, s.grow + (dt / GROW_SOLS.value) * (s.work.recycler === 0 ? 2 : 1));
  // Only the walls of the base stop the flare.
  if (outside && isFlare(s.sol)) d.dose = Math.min(1, s.dose + seconds / FLARE_SECONDS.value);

  if (fires) {
    d.nextEvent++;
    say(event.id);
    if (event.id === "night") learn("rtg");
    if (event.id === "storm") {
      // Dust buries the panels and the power box trips.
      d.work = { ...d.work, panel0: TASKS.panel0.seconds, panel1: TASKS.panel1.seconds, panel2: TASKS.panel2.seconds };
      d.alloc = NO_POWER;
    }
    if (event.id === "filter") d.work = { ...d.work, scrubber: TASKS.scrubber.seconds };
    if (event.id === "leak") d.work = { ...d.work, leak: TASKS.leak.seconds };
    if (event.id === "flare") learn("flare");
    if (event.id === "allclear") learn("aurora");
    if (event.id === "restart") d.work = { ...d.work, console: TASKS.console.seconds };
  }

  const o2 = o2Pct(d);
  const co2 = co2Pct(d);
  const safe = o2Zone(o2) === "safe" && co2Zone(co2) === "safe" && tempZone(d.tempC) === "safe";
  d.safeSols = s.safeSols + (safe ? dt : 0);
  d.peakCo2Pct = Math.max(s.peakCo2Pct, co2);
  d.minO2Pct = Math.min(s.minO2Pct, o2);
  d.minTempC = Math.min(s.minTempC, d.tempC);
  if (!d.won) d.failure = co2 >= CO2_FAIL_PCT.value ? "co2" : o2 <= O2_FAIL_PCT.value ? "o2" : d.tempC <= TEMP_FAIL_C.value ? "cold" : d.dose >= 1 ? "radiation" : null;
  return d;
}
