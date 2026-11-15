// Where Earth and Mars are on a given day, from the orbit numbers JPL publishes
// for 1800 to 2050 (Standish and Williams, "Approximate Positions of the
// Planets"): https://ssd.jpl.nasa.gov/planets/approx_pos.html
// The tilt of Mars's orbit (1.85°) is left out, so the map is flat.

/** Size (au), stretch, and the two angles (degrees) that place a planet on its orbit, each with its change per century. Real. */
export type Orbit = { readonly a: number; readonly e: readonly [number, number]; readonly L: readonly [number, number]; readonly peri: readonly [number, number] };
export const EARTH_ORBIT: Orbit = { a: 1.00000261, e: [0.01671123, -0.00004392], L: [100.46457166, 35999.37244981], peri: [102.93768193, 0.32327364] };
export const MARS_ORBIT: Orbit = { a: 1.52371034, e: [0.0933941, 0.00007882], L: [-4.55343205, 19140.30268499], peri: [-23.94362959, 0.44441088] };
/** One astronomical unit, the mean distance from Earth to the Sun, in km. Real. https://ssd.jpl.nasa.gov/astro_par.html */
export const AU_KM = 149_597_870.7;
/** Minutes light (and radio) takes to cross one astronomical unit: AU_KM over 299,792.458 km/s. Real. */
export const AU_LIGHT_MINUTES = AU_KM / 299_792.458 / 60;
/** How far Mars must be ahead of Earth, in degrees, for a ship on the cheapest path to meet it. Follows from the two orbit sizes. */
const LAUNCH_LEAD_DEG = 180 * (1 - ((1 + MARS_ORBIT.a) / (2 * MARS_ORBIT.a)) ** 1.5);

const DAY_MS = 86_400_000;
const J2000_MS = Date.UTC(2000, 0, 1, 12);
const RAD = Math.PI / 180;

/** A planet's place around the Sun at `ms` (a JavaScript time), in au. +x points at the March equinox. */
export function planetAt(orbit: Orbit, ms: number): { x: number; y: number } {
  const T = (ms - J2000_MS) / DAY_MS / 36525;
  const e = orbit.e[0] + orbit.e[1] * T;
  const peri = (orbit.peri[0] + orbit.peri[1] * T) * RAD;
  const M = (orbit.L[0] + orbit.L[1] * T) * RAD - peri;
  // Kepler's equation, E - e sin E = M. Both orbits are nearly round, so a few rounds settle it.
  let E = M;
  for (let i = 0; i < 6; i++) E = M + e * Math.sin(E);
  const px = orbit.a * (Math.cos(E) - e);
  const py = orbit.a * Math.sqrt(1 - e * e) * Math.sin(E);
  return { x: px * Math.cos(peri) - py * Math.sin(peri), y: px * Math.sin(peri) + py * Math.cos(peri) };
}

/** Distance from Earth to Mars at `ms`, in au. */
export function earthToMarsAu(ms: number): number {
  const earth = planetAt(EARTH_ORBIT, ms);
  const mars = planetAt(MARS_ORBIT, ms);
  return Math.hypot(mars.x - earth.x, mars.y - earth.y);
}

/** How far Mars is ahead of Earth around the Sun, in degrees, -180 to 180. */
function lead(ms: number): number {
  const earth = planetAt(EARTH_ORBIT, ms);
  const mars = planetAt(MARS_ORBIT, ms);
  const deg = (Math.atan2(mars.y, mars.x) - Math.atan2(earth.y, earth.x)) / RAD;
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

/** The next day after `ms` when Mars is just far enough ahead for a ship to set off. */
export function nextLaunchDay(ms: number): number {
  // Earth catches up, so the lead shrinks day by day; the launch day is when it passes the mark.
  for (let day = 1; day < 900; day++) if (lead(ms + (day - 1) * DAY_MS) > LAUNCH_LEAD_DEG && lead(ms + day * DAY_MS) <= LAUNCH_LEAD_DEG) return ms + day * DAY_MS;
  return ms; // ponytail: cannot happen inside 900 days (a window comes every 780); the caller then shows today.
}
