// Run with `npm test`. Bots play whole chapters so a balance change that
// breaks the intended lessons fails loudly.
import assert from "node:assert/strict";
import { test } from "node:test";
import { badges, finalCheck, reportCard } from "./scoring.ts";
import { type Area, buy, co2Pct, EVENTS, FLARE, initialState, isCold, isOver, isStorm, type Job, jobs, MAX_PARTS, o2Pct, powerAt, PLANNER_O2_PCT, reserveSols, seen, setCells, type SimState, spot, STORM, step, take, TUTORIAL_DONE, UPGRADE_COST, TASKS, morning } from "./simulate.ts";
import { FACT_IDS, QUIZ } from "./story.ts";
import { areaOf, type Point, route, START, STATIONS, stationNear, walk } from "./world.ts";

const TICK = 0.1;
const idle = { area: "inside", near: null, working: false } as const;

/** Play the guided start the way the game leads you through it. */
function tutorial(): SimState {
  let s = step(initialState(), { ...idle, near: "power" }, TICK);
  while (s.stage === 1) s = step(s, { area: "inside", near: "power", working: true }, TICK);
  s = step(setCells(s, "scrubber", 2), idle, TICK);
  return step(setCells(s, "oxygen", 1), idle, TICK);
}

type Bot = {
  /** Power wanted for each machine. The heater is served first, then the air cleaner, unless `oxygenFirst`. */
  readonly wants: (s: SimState) => readonly [scrubber: number, oxygen: number, heater: number];
  readonly oxygenFirst?: boolean;
  /** Which jobs the bot bothers with. */
  readonly does?: (job: Job) => boolean;
  /** Seconds the bot takes to reach an indoor job; outdoor jobs take twice that. */
  readonly travel?: number;
};

function play(bot: Bot): SimState {
  let s = tutorial();
  let target: Job | undefined;
  let wait = 0;
  let resting = false;
  for (let t = 0; !isOver(s) && t < 1200; t += TICK) {
    // Come back in when the suit runs low, and stay until it is full.
    resting = s.suit < 0.3 || (resting && s.suit < 1);
    // Re-route power. ponytail: the bot does this from anywhere; a player must stand at the power box.
    const [scrubber, oxygen, heater] = bot.wants(s);
    let spare = powerAt(s);
    const give = (cells: number) => {
      const given = Math.min(cells, spare);
      spare -= given;
      return given;
    };
    const warm = give(heater);
    const first = give(bot.oxygenFirst ? oxygen : scrubber);
    const second = give(bot.oxygenFirst ? scrubber : oxygen);
    s = { ...s, alloc: bot.oxygenFirst ? { oxygen: first, scrubber: second, heater: warm } : { scrubber: first, oxygen: second, heater: warm } };

    // From ARIA's warning until the all clear, the bot stays in.
    const hiding = seen(s, "flare") && s.sol < FLARE.to;
    const todo = resting ? [] : jobs(s).filter((j) => (j.action === "work" || j.action === "take") && bot.does?.(j) && !(hiding && areaOf(STATIONS[j.at]) === "outside"));
    if (!target || !todo.includes(target)) {
      // Going out through the airlock takes twice as long; the next outdoor job is a short walk.
      const wasOut = target !== undefined && areaOf(STATIONS[target.at]) === "outside";
      target = todo[0];
      wait = target ? (bot.travel ?? 3) * (areaOf(STATIONS[target.at]) !== "outside" ? 1 : wasOut ? 0.5 : 2) : 0;
    }
    const area: Area = target ? areaOf(STATIONS[target.at]) : "inside";
    wait -= TICK;
    if (target && wait <= 0 && target.action === "take") s = take(s);
    s = step(s, target && wait <= 0 ? { area, near: target.at, working: true } : { area, near: null, working: false }, TICK);
  }
  return s;
}

/** The heater is only needed when there is no sun on the walls. */
const heat = (s: SimState) => (isCold(s.sol) ? 1 : 0);
const steady = (s: SimState) => [3, 3, heat(s)] as const;
const everything = () => true;
const mustDo = (j: Job) => !j.side;

test("the guided start pays parts, teaches facts and holds the clock", () => {
  const s = tutorial();
  assert.equal(s.stage, TUTORIAL_DONE);
  assert.equal(s.sol, 0);
  assert.equal(s.message, "ready");
  assert.equal(powerAt(s), 3);
  assert.deepEqual(s.facts, ["sol", "co2", "moxie"]);
  assert.equal(s.earned, 60);
});

test("with no power the CO2 gets you while there is still lots of oxygen", () => {
  const s = play({ wants: () => [0, 0, 0] });
  assert.equal(s.failure, "co2");
  assert.ok(o2Pct(s) > 17.5, `oxygen was ${o2Pct(s)}`);
});

test("pouring power into oxygen fails on CO2", () => {
  assert.equal(play({ wants: (s) => [1, 4, heat(s)], oxygenFirst: true, does: mustDo }).failure, "co2");
});

test("never going out to clean the panels fails on oxygen", () => {
  assert.equal(play({ wants: (s) => [2, 1, heat(s)], does: (j) => j.action !== "work" || !j.at.startsWith("panel") }).failure, "o2");
});

test("never fixing anything fails", () => {
  assert.notEqual(play({ wants: steady, does: (j) => j.at.startsWith("panel") }).failure, null);
});

test("a slow player who does only the must-do jobs wins as an Astronaut", () => {
  const s = play({ wants: steady, does: mustDo, travel: 6 });
  const card = reportCard(s);
  assert.ok(s.won, `${s.failure} at sol ${s.sol.toFixed(2)}, O2 ${o2Pct(s).toFixed(1)}, CO2 ${co2Pct(s).toFixed(2)}`);
  assert.ok(card.stars >= 1 && card.stars <= 2, `stars ${card.stars}, safe ${card.safeAirPct}%`);
  assert.equal(card.rank, 1);
});

test("a quick player who clears CO2 first and does every job earns three stars and Commander", () => {
  const s = play({
    wants: (s) => {
      const scrubber = co2Pct(s) > 0.5 ? 4 : co2Pct(s) > 0.2 ? 3 : 2;
      return [scrubber, o2Pct(s) > 23 ? 2 : 4, heat(s)];
    },
    does: everything,
    travel: 2.5,
  });
  const card = reportCard(s);
  assert.ok(s.won, `${s.failure}`);
  assert.equal(card.stars, 3, `safe ${card.safeAirPct}%, min O2 ${s.minO2Pct.toFixed(1)}`);
  assert.equal(card.rank, 2);
  assert.equal(s.earned, MAX_PARTS);
  assert.deepEqual(badges(s), ["air", "warm", "flare", "jobs"]);
});

test("solar panels give no power at night", () => {
  const clean = { ...tutorial(), work: { ...tutorial().work, panel0: 0, panel1: 0, panel2: 0 } };
  assert.equal(powerAt({ ...clean, sol: 0.3 }), 6);
  assert.equal(powerAt({ ...clean, sol: 0.8 }), 3);
});

test("with the heater off, the first night is a scare and the dust storm freezes the base", () => {
  const s = play({ wants: () => [3, 3, 0], does: everything });
  assert.equal(s.failure, "cold");
  assert.ok(isStorm(s.sol), `froze at sol ${s.sol.toFixed(2)}`);
});

test("the solar flare is deadly outside and harmless inside", () => {
  const flare: SimState = { ...tutorial(), sol: FLARE.from, nextEvent: EVENTS.findIndex((e) => e.id === "allclear") };
  let out = flare;
  while (!isOver(out)) out = step(out, { area: "outside", near: null, working: false }, TICK);
  assert.equal(out.failure, "radiation");
  let dash = flare;
  for (let t = 0; t < 6; t += TICK) dash = step(dash, { area: "outside", near: null, working: false }, TICK);
  assert.ok(!isOver(dash) && dash.dose > 0.5, "a quick dash out to patch the leak can be survived");
  let safe = flare;
  while (safe.sol < FLARE.to) safe = step(safe, idle, TICK);
  assert.equal(safe.dose, 0, "behind the walls and the bag shelter");
  let bare: SimState = { ...flare, work: { ...flare.work, bags: 3 } };
  assert.deepEqual(jobs(bare).slice(0, 2).map((j) => j.at), ["bags", "shelter"]);
  while (bare.sol < FLARE.to) bare = step(bare, idle, TICK);
  assert.ok(!isOver(bare) && bare.dose > 0.2, "the walls alone let some through, but not enough to end the chapter");
});

test("a leak is worked the way real crews do: read how much time there is, then patch", () => {
  let s: SimState = { ...tutorial(), sol: 3.03, nextEvent: EVENTS.findIndex((e) => e.id === "leak") };
  while (s.work.leak === 0) s = step(s, idle, TICK);
  assert.equal(jobs(s)[0].at, "gauge");
  while (s.work.gauge > 0) s = step(s, { area: "inside", near: "gauge", working: true }, TICK);
  assert.equal(s.message, "gathered");
  assert.ok(s.facts.includes("gather"));
  assert.ok(reserveSols(s, "inside") < 10, "the leak puts a number on the time left");
  assert.equal(jobs(s)[0].at, "storage");
  assert.equal(jobs(take(s))[0].at, "leak");
});

test("dust covers the panels again on the last sol", () => {
  let s: SimState = { ...tutorial(), sol: 4, nextEvent: EVENTS.findIndex((e) => e.id === "lastsol"), work: { ...tutorial().work, panel0: 0, panel1: 0, panel2: 0 } };
  while (!seen(s, "lastsol")) s = step(s, idle, TICK);
  assert.deepEqual(jobs(s).slice(0, 3).map((j) => j.at), ["panel0", "panel1", "panel2"]);
});

test("salad has to be watered and grown before it is eaten, and an empty stomach slows work", () => {
  const working = (near: "plant" | "salad" | "bike") => ({ area: "inside", near, working: true }) as const;
  let s = { ...tutorial(), food: 0, nextEvent: EVENTS.findIndex((e) => e.id === "hungry") + 1 };
  assert.equal(jobs(s).find((j) => j.at === "plant")?.side, false, "once hungry, watering is a must-do job");
  assert.ok(!jobs(s).some((j) => j.at === "salad"));
  for (let t = 0; t < 3; t += TICK) s = step(s, working("bike"), TICK);
  assert.ok(s.work.bike > 0, "a hungry astronaut needs twice as long");
  while (s.work.plant > 0) s = step(s, working("plant"), TICK);
  while (s.grow < 1) s = step(s, idle, TICK);
  assert.ok(s.sol > 0.9, `grew in ${s.sol.toFixed(2)} sols`);
  while (s.work.salad > 0) s = step(s, working("salad"), TICK);
  assert.equal(s.food, 1);
  assert.ok(s.facts.includes("food"));
});

test("power can always be taken back, but only spare power can be given", () => {
  const night = { ...tutorial(), sol: 0.8, alloc: { scrubber: 3, oxygen: 3, heater: 0 } };
  assert.equal(jobs(night).find((j) => j.action === "route")?.label, "Too many machines are on. Choose at the power box");
  assert.equal(setCells(night, "heater", 1).alloc.heater, 0);
  const fewer = setCells(setCells(night, "oxygen", 0), "scrubber", 2);
  assert.deepEqual(setCells(fewer, "heater", 1).alloc, { scrubber: 2, oxygen: 0, heater: 1 });
});

test("staying outside until the suit is empty fails", () => {
  let s = tutorial();
  while (!isOver(s)) s = step(s, { area: "outside", near: null, working: false }, TICK);
  assert.equal(s.failure, "suit");
  assert.ok(s.facts.includes("suit") && s.facts.includes("marsair"));
});

test("asking for more power than the base has slows the machines, it does not make free power", () => {
  const s = tutorial();
  const over = step({ ...s, alloc: { scrubber: 4, oxygen: 2, heater: 0 } }, idle, 5);
  const fits = step({ ...s, alloc: { scrubber: 2, oxygen: 1, heater: 0 } }, idle, 5);
  assert.ok(Math.abs(over.co2Kg - fits.co2Kg) < 1e-9);
});

test("the job list sends the player to the shelf before a repair", () => {
  const broken = { ...tutorial(), work: { ...tutorial().work, scrubber: 3 } };
  assert.equal(jobs(broken)[0].at, "storage");
  assert.equal(jobs(take(broken))[0].at, "scrubber");
});

test("the printer sells an upgrade once, and only for enough parts", () => {
  const poor = tutorial();
  assert.equal(buy(poor, "battery"), poor);
  const rich = buy({ ...poor, parts: UPGRADE_COST.battery }, "battery");
  assert.equal(rich.parts, 0);
  assert.equal(powerAt(rich), powerAt(poor) + 1);
  assert.ok(rich.facts.includes("printer"));
  assert.equal(buy({ ...rich, parts: 999 }, "battery").parts, 999);
});

/** Walk the route in 10 cm steps, the way the game does. */
function go(from: Point, to: Point): Point {
  const path = route(from, to);
  let p = from;
  for (let i = 0; i < 4000 && path.length > 0; i++) {
    const d = Math.hypot(path[0].x - p.x, path[0].z - p.z);
    if (d < 0.15) path.shift();
    else p = walk(p, ((path[0].x - p.x) / d) * 0.1, ((path[0].z - p.z) / d) * 0.1);
  }
  assert.equal(path.length, 0, `stuck at ${p.x.toFixed(1)}, ${p.z.toFixed(1)} going from ${from.x}, ${from.z} to ${to.x}, ${to.z}`);
  return p;
}

test("the astronaut can walk between every pair of stations", () => {
  const stops = [START, ...Object.values(STATIONS)];
  for (const a of stops) for (const b of stops) if (a !== b) go(a, b);
  assert.equal(stationNear(STATIONS.power), "power");
  assert.equal(stationNear(STATIONS.shelter), null, "the shelter spot is not something to use");
  assert.equal(stationNear(START), null);
});

test("walking into a wall slides along it, and walking straight at it stops", () => {
  const byWall = { x: 1, z: -2.55 };
  assert.deepEqual(walk(byWall, 0.1, -0.1), { x: 1.1, z: -2.55 }, "a diagonal push slides along the north wall");
  // The store gives up on a tapped route only when walk() hands back the same point.
  assert.equal(walk(byWall, 0.01, -0.1), byWall, "nearly straight into the wall: stand still, do not run on the spot");
});

/** Seeded random numbers, so each test sees the same "random" check on every run. */
const seeded = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const won = (patch: Partial<SimState> = {}): SimState => ({ ...initialState(), won: true, ...patch });

test("the final check asks five different questions, about cards only if found, with the answers shuffled", () => {
  const s = won({ facts: ["sol", "delay", "water", "gather"] });
  let moved = false;
  for (let seed = 1; seed < 40; seed++) {
    const check = finalCheck(s, seeded(seed), []);
    assert.equal(check.length, 5);
    assert.equal(new Set(check.map((q) => q.prompt)).size, 5);
    for (const q of check) {
      assert.ok(!q.card || s.facts.includes(q.card), `asked about the ${q.card} card, which was not found`);
      const original = QUIZ.find((o) => o.prompt === q.prompt)!;
      assert.equal(q.choices[q.answer], original.choices[original.answer], "the right answer is still right");
      moved ||= q.answer !== original.answer;
    }
  }
  assert.ok(moved, "the right answer is not always in the same place");
  assert.ok(finalCheck(won(), seeded(1), []).every((q) => !q.card), "no card questions without the cards");
});

test("the final check starts with the player's own worst moment", () => {
  assert.equal(finalCheck(won({ minTempC: 4 }), seeded(3), [])[0].about, "cold");
  assert.equal(finalCheck(won({ peakCo2Pct: 2 }), seeded(3), [])[0].about, "co2");
  assert.equal(finalCheck(won({ dose: 0.2 }), seeded(3), [])[0].about, "radiation");
});

test("playing again brings new questions, and every fact card has one", () => {
  const s = won({ facts: FACT_IDS });
  for (let seed = 1; seed < 40; seed++) {
    const first = finalCheck(s, seeded(seed), []);
    const again = finalCheck(s, seeded(seed + 100), first.map((q) => q.prompt));
    assert.ok(again.every((q) => !first.some((f) => f.prompt === q.prompt)), "a question came back straight away");
  }
  for (const id of FACT_IDS) assert.ok(QUIZ.some((q) => q.card === id), `no question for the ${id} card`);
});

test("the hidden telescope finds the secret card once, and no job ever points to it", () => {
  const s = spot(initialState(), "earth");
  assert.ok(s.facts.includes("earthstar"));
  assert.deepEqual(s.secrets, ["stargazer"]);
  assert.equal(spot(s, "earth"), s, "a second look finds nothing new");
  assert.ok(jobs(s).every((j) => j.at !== "telescope"), "no trail or marker gives the secret away");
  assert.equal(stationNear(STATIONS.telescope), "telescope");
  const three = spot(spot(s, "phobos"), "deimos");
  assert.ok(!three.secrets.includes("skytour"), "three of four is not the whole sky");
  assert.deepEqual(spot(three, "jupiter").secrets, ["stargazer", "skytour"]);
});

test("making extra oxygen before the storm, as ARIA advises, earns the Planner secret", () => {
  const before: SimState = { ...tutorial(), sol: STORM.from - 0.01, nextEvent: EVENTS.findIndex((e) => e.id === "storm") };
  const storm = (s: SimState) => {
    while (!seen(s, "storm")) s = step(s, idle, TICK);
    return s;
  };
  const kgPerPct = before.o2Kg / o2Pct(before);
  assert.deepEqual(storm({ ...before, o2Kg: (PLANNER_O2_PCT + 0.3) * kgPerPct }).secrets, ["planner"]);
  assert.deepEqual(storm(before).secrets, [], "normal air is not extra");
});

test("stepping outside under the green sky after the flare earns Aurora watcher", () => {
  const night: SimState = { ...tutorial(), sol: FLARE.to + 0.05, nextEvent: EVENTS.findIndex((e) => e.id === "lastsol") };
  assert.deepEqual(step(night, { area: "outside", near: null, working: false }, TICK).secrets, ["aurora"]);
  assert.deepEqual(step(night, idle, TICK).secrets, [], "it is only seen from outside");
  assert.deepEqual(step({ ...night, sol: FLARE.from - 0.5 }, { area: "outside", near: null, working: false }, TICK).secrets, [], "no aurora before the flare");
});

test("winning without printing an upgrade earns Do it yourself", () => {
  const end: SimState = { ...tutorial(), sol: 4.6, nextEvent: EVENTS.length, work: { ...tutorial().work, console: TASKS.console.seconds } };
  const press = (s: SimState) => {
    while (!s.won) s = step(s, { area: "inside", near: "console", working: true }, TICK);
    return s;
  };
  assert.ok(press(end).secrets.includes("diy"));
  assert.ok(!press({ ...end, upgrades: ["boots"] }).secrets.includes("diy"), "a printed upgrade is no longer doing it yourself");
});

test("the daily chores come back every morning at 06:00 and pay again", () => {
  let s: SimState = { ...tutorial(), sol: 0.9, nextEvent: EVENTS.findIndex((e) => e.id === "forecast") };
  while (s.work.vents > 0) s = step(s, { area: "inside", near: "vents", working: true }, TICK);
  assert.ok(jobs(s).every((j) => j.at !== "vents"), "done for today");
  const paid = s.earned;
  while (morning(s.sol) < 1) s = step(s, idle, TICK);
  assert.ok(jobs(s).some((j) => j.at === "vents" && j.side), "back the next morning, as a blue job");
  while (s.work.vents > 0) s = step(s, { area: "inside", near: "vents", working: true }, TICK);
  assert.equal(s.earned, paid + TASKS.vents.parts);
});

test("the clock and the suit air stand still while you look through the telescope", () => {
  const s = { ...initialState(), stage: TUTORIAL_DONE };
  const outside = step(s, { area: "outside", near: null, working: false }, 5);
  assert.ok(outside.sol > s.sol && outside.suit < s.suit, "away from the telescope, time and air run on");
  assert.equal(step(outside, { area: "outside", near: "telescope", working: false }, 30), outside);
});
