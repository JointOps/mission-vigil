import { CO2_DANGER_PCT, O2_SAFE_MIN_PCT, TEMP_SAFE_MIN_C } from "./constants.ts";
import { type Failure, MAX_PARTS, type SimState, UPGRADE_COST } from "./simulate.ts";
import { FACT_IDS, type Question, QUIZ } from "./story.ts";

export type ReportCard = {
  /** 0 = failed, 1–3 = how safe the base was kept. Thresholds are game rules. */
  readonly stars: 0 | 1 | 2 | 3;
  /** Share of the clock spent with the air and the temperature all in the safe band, 0–100. */
  readonly safeAirPct: number;
  /** 0 = Cadet, 1 = Astronaut, 2 = Commander, by parts earned. Game rule. */
  readonly rank: 0 | 1 | 2;
};

export function reportCard(s: SimState): ReportCard {
  const safeAirPct = s.sol > 0 ? Math.round((s.safeSols / s.sol) * 100) : 0;
  const stars = !s.won ? 0 : safeAirPct >= 85 ? 3 : safeAirPct >= 45 ? 2 : 1;
  // The must-do jobs alone earn about half the parts; Commander needs the blue jobs and most of the daily chores too.
  const rank = s.earned >= MAX_PARTS * 0.85 ? 2 : s.earned >= MAX_PARTS * 0.5 ? 1 : 0;
  return { stars, safeAirPct, rank };
}

export type BadgeId = "air" | "warm" | "flare" | "jobs" | "cards" | "maker";

/** Extra goals for a finished chapter, each a reason to play again. Game rules. */
export function badges(s: SimState): readonly BadgeId[] {
  if (!s.won) return [];
  const earned: Record<BadgeId, boolean> = {
    air: s.peakCo2Pct < CO2_DANGER_PCT.value && s.minO2Pct >= O2_SAFE_MIN_PCT.value,
    warm: s.minTempC >= TEMP_SAFE_MIN_C.value,
    flare: s.dose === 0,
    jobs: s.earned >= MAX_PARTS,
    cards: s.facts.length === FACT_IDS.length,
    maker: s.upgrades.length === Object.keys(UPGRADE_COST).length,
  };
  return (Object.keys(earned) as BadgeId[]).filter((id) => earned[id]);
}

const QUIZ_LENGTH = 5;

/** `items` in random order. Random keys, then a sort: every order is equally likely. */
const shuffle = <T>(items: readonly T[], random: () => number): T[] =>
  items
    .map((item) => [random(), item] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([, item]) => item);

/** Up to `count` questions at random, leaving out the `recent` ones while there are others to ask. */
function pick(pool: readonly Question[], count: number, random: () => number, recent: readonly string[]): Question[] {
  const mixed = shuffle(pool, random);
  return [...mixed.filter((q) => !recent.includes(q.prompt)), ...mixed.filter((q) => recent.includes(q.prompt))].slice(0, count);
}

/** The same question with its choices in a new order, so the right answer is not always in the same place. */
function mixChoices(q: Question, random: () => number): Question {
  const order = shuffle(q.choices.map((_, i) => i), random);
  return { ...q, choices: order.map((i) => q.choices[i]), answer: order.indexOf(q.answer) };
}

/** The scariest moment of a mission, as the failure it came closest to. Game rule: the same lines the gauges turn red at. */
function worstMoment(s: SimState): Failure | null {
  if (s.peakCo2Pct >= CO2_DANGER_PCT.value) return "co2";
  if (s.minTempC < TEMP_SAFE_MIN_C.value) return "cold";
  if (s.dose > 0) return "radiation";
  if (s.minO2Pct < O2_SAFE_MIN_PCT.value) return "o2";
  return null;
}

/**
 * The final check: five questions drawn at random. The first is about the
 * player's own worst moment, if there was one; two are about fact cards they
 * found; the rest are main lessons. Questions from the last check (`recent`)
 * wait their turn, and every question's choices are shuffled.
 * `random` is passed in so the engine stays pure: the game passes Math.random.
 */
export function finalCheck(s: SimState, random: () => number, recent: readonly string[]): readonly Question[] {
  const lessons = QUIZ.filter((q) => !q.card);
  const worst = worstMoment(s);
  const first = worst ? pick(lessons.filter((q) => q.about === worst), 1, random, recent) : [];
  const cards = pick(QUIZ.filter((q) => q.card && s.facts.includes(q.card)), 2, random, recent);
  const rest = pick(lessons.filter((q) => !first.includes(q)), QUIZ_LENGTH - first.length - cards.length, random, recent);
  return [...first, ...rest, ...cards].map((q) => mixChoices(q, random));
}

/** One question about how this mission stopped, for the failure screen. */
export const failureCheck = (failure: Failure, random: () => number): Question | undefined => pick(QUIZ.filter((q) => q.about === failure), 1, random, []).map((q) => mixChoices(q, random))[0];
