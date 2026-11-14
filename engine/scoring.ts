import { CO2_DANGER_PCT, O2_SAFE_MIN_PCT, TEMP_SAFE_MIN_C } from "./constants.ts";
import { MAX_PARTS, type SimState, UPGRADE_COST } from "./simulate.ts";
import { FACT_IDS } from "./story.ts";

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
  // The must-do jobs alone earn about two thirds of the parts; Commander needs the optional ones too.
  const rank = s.earned >= MAX_PARTS * 0.85 ? 2 : s.earned >= MAX_PARTS * 0.6 ? 1 : 0;
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
