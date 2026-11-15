/** A value from the white paper, distinguished from a tunable game rule. */
export type Constant = { readonly value: number; readonly unit: string; readonly kind: "real" | "game" };

/** Oxygen consumption per person per day. https://ntrs.nasa.gov/api/citations/20100036823/downloads/20100036823.pdf */
export const OXYGEN_KG_PER_DAY = { value: 0.84, unit: "kg/day", kind: "real" } as const satisfies Constant;
/** Carbon dioxide production per person per day. https://ntrs.nasa.gov/api/citations/20100036823/downloads/20100036823.pdf */
export const CO2_KG_PER_DAY = { value: 1, unit: "kg/day", kind: "real" } as const satisfies Constant;
/** Food solids per person per day. https://ntrs.nasa.gov/api/citations/20190027610/downloads/20190027610.pdf */
export const FOOD_KG_PER_DAY = { value: 0.62, unit: "kg/day", kind: "real" } as const satisfies Constant;
/** Total water use per person per day. https://www.frontiersin.org/journals/space-technologies/articles/10.3389/frspt.2024.1461389/epub */
export const WATER_KG_PER_DAY = { value: 4.35, unit: "kg/day", kind: "real" } as const satisfies Constant;
/** Approximate Mars surface radiation rate. https://www.sciencedaily.com/releases/2013/12/131209181133.htm */
export const SURFACE_RADIATION_MSV_PER_SOL = { value: 0.64, unit: "mSv/sol", kind: "real" } as const satisfies Constant;
/** Approximate cruise radiation rate. https://www.scientificamerican.com/article/radiation-on-mars-managea/ */
export const CRUISE_RADIATION_MSV_PER_DAY = { value: 1.84, unit: "mSv/day", kind: "real" } as const satisfies Constant;
/** Approximate length of a Mars sol in minutes. https://www.sciencedaily.com/releases/2013/12/131209181133.htm */
export const SOL_MINUTES = { value: 1479, unit: "minutes", kind: "real" } as const satisfies Constant;
/** Approximate interval between launch windows. https://www.nsta.org/science-scope/science-scope-julyaugust-2020/back-mars */
export const LAUNCH_WINDOW_MONTHS = { value: 26, unit: "months", kind: "real" } as const satisfies Constant;
/** Recommended career dose limit. https://www.nationalacademies.org/news/nasa-should-update-astronaut-radiation-exposure-limits-improve-communication-of-cancer-risks */
export const CAREER_LIMIT_MSV = { value: 600, unit: "mSv", kind: "real" } as const satisfies Constant;
/** Cruise dose derived from 180 days at 1.84 mSv/day, rounded in the white paper. https://www.scientificamerican.com/article/radiation-on-mars-managea/ */
export const CRUISE_DOSE_MSV = { value: 331, unit: "mSv", kind: "real" } as const satisfies Constant;
/** Baseline dose derived from 350 sols at 0.64 mSv/sol. https://www.sciencedaily.com/releases/2013/12/131209181133.htm */
export const BASELINE_SURFACE_DOSE_MSV = { value: 224, unit: "mSv", kind: "real" } as const satisfies Constant;
/** Tunable surface dose budget, a game rule informed by radiation research. https://www.nationalacademies.org/news/nasa-should-update-astronaut-radiation-exposure-limits-improve-communication-of-cancer-risks */
export const SURFACE_BUDGET_MSV = { value: 300, unit: "mSv", kind: "game" } as const satisfies Constant;
/** Event allowance derived from the game budget minus baseline dose. https://www.sciencedaily.com/releases/2013/12/131209181133.htm */
export const EVENT_ALLOWANCE_MSV = { value: 76, unit: "mSv", kind: "game" } as const satisfies Constant;

// ── Chapter 1 ──────────────────────────────────────────────────────────────

/** Length of a sol in Earth days, derived from SOL_MINUTES / 1440. */
export const SOL_DAYS = SOL_MINUTES.value / 1440;
/** Normal oxygen share of air at sea level. https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146 */
export const O2_NORMAL_PCT = { value: 20.9, unit: "%", kind: "real" } as const satisfies Constant;
/** Below this, air counts as oxygen-deficient. https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146 */
export const O2_SAFE_MIN_PCT = { value: 19.5, unit: "%", kind: "real" } as const satisfies Constant;
/** Above this, air counts as oxygen-enriched and fire risk climbs. https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146 */
export const O2_SAFE_MAX_PCT = { value: 23.5, unit: "%", kind: "real" } as const satisfies Constant;
/** Oxygen level shown as danger. Game rule. */
export const O2_DANGER_PCT = { value: 17.5, unit: "%", kind: "game" } as const satisfies Constant;
/** Oxygen level that ends the chapter. Game rule; real impairment begins around here. */
export const O2_FAIL_PCT = { value: 16, unit: "%", kind: "game" } as const satisfies Constant;
/** NASA limit for 7 to 180 days of exposure, 5.3 mmHg. https://ntrs.nasa.gov/citations/20150021777 */
export const CO2_SAFE_MAX_PCT = { value: 0.7, unit: "%", kind: "real" } as const satisfies Constant;
/** NASA limit for 24 hours of exposure, 10 mmHg. https://ntrs.nasa.gov/citations/20150021777 */
export const CO2_DANGER_PCT = { value: 1.3, unit: "%", kind: "real" } as const satisfies Constant;
/** CO2 level that ends the chapter. Game rule set at the NIOSH "immediately dangerous" level, 40,000 ppm. https://www.cdc.gov/niosh/idlh/124389.html */
export const CO2_FAIL_PCT = { value: 4, unit: "%", kind: "game" } as const satisfies Constant;
/** Sealed core module volume, about one small bedroom. Game rule. */
export const CABIN_VOLUME_M3 = { value: 25, unit: "m³", kind: "game" } as const satisfies Constant;
/** Cabin pressure, Earth sea level. Game rule; total pressure is held constant. */
export const CABIN_PRESSURE_KPA = { value: 101.3, unit: "kPa", kind: "game" } as const satisfies Constant;
/** Cabin temperature. Game rule. */
export const CABIN_TEMP_K = { value: 293.15, unit: "K", kind: "game" } as const satisfies Constant;
/** Power from the fuel cell alone. Each clean solar panel adds 1, and the spare battery upgrade adds 1. Game rule. */
export const BASE_POWER = { value: 3, unit: "power", kind: "game" } as const satisfies Constant;
/** Seconds of play a suit's air lasts outside. Game rule: a real NASA suit holds about 7 hours. https://ntrs.nasa.gov/citations/20140000238 */
export const SUIT_SECONDS = { value: 40, unit: "s", kind: "game" } as const satisfies Constant;
/** Real seconds one sol takes on screen. Game pacing. */
export const SECONDS_PER_SOL = { value: 60, unit: "s", kind: "game" } as const satisfies Constant;
/** CO2 removed by the scrubber per power cell. Game rule. */
export const SCRUBBER_KG_PER_CELL_SOL = { value: 0.45, unit: "kg/sol", kind: "game" } as const satisfies Constant;
/** Oxygen made by the oxygen maker per power cell. Game rule. */
export const OXYGEN_KG_PER_CELL_SOL = { value: 0.6, unit: "kg/sol", kind: "game" } as const satisfies Constant;
/** Share of cabin air lost per sol through a leaking seal. Game rule. */
export const LEAK_FRACTION_PER_SOL = { value: 0.12, unit: "/sol", kind: "game" } as const satisfies Constant;
/** Sols on the clock before main life support is ready to restart: sunset on the fifth sol. Game rule. */
export const CHAPTER_1_SOLS = { value: 4.5, unit: "sols", kind: "game" } as const satisfies Constant;
/** Warmest the cabin gets: CABIN_TEMP_K in °C. The sun and the thermostat hold it there by day. Game rule. */
export const CABIN_TEMP_C = { value: 20, unit: "°C", kind: "game" } as const satisfies Constant;
/** How fast the cabin cools at night or in a dust storm with the heater off. Game rule. */
export const COOLING_C_PER_SOL = { value: 36, unit: "°C/sol", kind: "game" } as const satisfies Constant;
/** How fast the cabin warms again by day. Game rule. */
export const WARMING_C_PER_SOL = { value: 24, unit: "°C/sol", kind: "game" } as const satisfies Constant;
/** Warmth from the heater per power cell. Game rule. */
export const HEATER_C_PER_CELL_SOL = { value: 28, unit: "°C/sol", kind: "game" } as const satisfies Constant;
/** Below this the cabin counts as cold. Game rule. */
export const TEMP_SAFE_MIN_C = { value: 12, unit: "°C", kind: "game" } as const satisfies Constant;
/** Cabin temperature shown as danger. Game rule. */
export const TEMP_DANGER_C = { value: 5, unit: "°C", kind: "game" } as const satisfies Constant;
/** Cabin temperature that ends the chapter: water freezes at 0 °C. Game rule. */
export const TEMP_FAIL_C = { value: 0, unit: "°C", kind: "game" } as const satisfies Constant;
/** Sols a full stomach lasts before hunger slows the astronaut down. Game rule. */
export const FULL_SOLS = { value: 3.6, unit: "sols", kind: "game" } as const satisfies Constant;
/** Sols watered salad takes to grow under the lamps. Game rule: real plants take weeks. */
export const GROW_SOLS = { value: 1, unit: "sols", kind: "game" } as const satisfies Constant;
/** Indoors, before the bag shelter is built, the flare does this share of its harm. Game rule. */
export const FLARE_INDOOR_SHARE = { value: 0.25, unit: "", kind: "game" } as const satisfies Constant;
/** Seconds of play outside in the solar flare that end the chapter. Game rule: far stronger than a real flare felt on the surface of Mars. */
export const FLARE_SECONDS = { value: 9, unit: "s", kind: "game" } as const satisfies Constant;
