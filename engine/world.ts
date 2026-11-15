import type { Area, StationId } from "./simulate.ts";

// The outpost floor plan, in metres. +x is east (right on screen, toward the
// airlock) and +z is south (toward the camera). The astronaut is a point;
// walls and furniture sit a little beyond the walkable edges so the body never
// clips them. The 3D scene draws everything from these numbers.

export type Point = { readonly x: number; readonly z: number };
type Rect = { readonly x0: number; readonly x1: number; readonly z0: number; readonly z1: number };

/** Half-size of the room the astronaut can walk in. */
export const ROOM = { x: 6, z: 2.6 } as const;
/** The airlock corridor on the east side: from the room's edge to the outer door. */
export const LOCK = { to: 9.2, z: 0.6 } as const;
/** Half-size of the habitat's outer hull, and how far the airlock's walls stick out. */
export const HULL = { x: 7.1, z: 3.7, lockZ: 1.7 } as const;
/** Where each solar panel stands, west to east. */
export const PANEL_X = [-4, -0.5, 3] as const;

/** The middle of the garden bed on the south wall. Water it at its west end, pick the salad at its east end. */
export const GARDEN_X = -3.4;

/** Where the astronaut stands to use each station. */
export const STATIONS: Readonly<Record<StationId, Point>> = {
  scrubber: { x: -4, z: -1.9 },
  gauge: { x: -0.95, z: -1.9 },
  power: { x: 0.2, z: -1.9 },
  printer: { x: 2.4, z: -1.9 },
  storage: { x: 4.6, z: -1.9 },
  plant: { x: GARDEN_X - 0.65, z: 1.9 },
  salad: { x: GARDEN_X + 0.65, z: 1.9 },
  bike: { x: -0.9, z: 1.9 },
  console: { x: 1.6, z: 1.9 },
  bags: { x: 3, z: 1.9 },
  recycler: { x: 4.4, z: 1.9 },
  shelter: { x: 3.4, z: 0.2 },
  leak: { x: 9.9, z: 1.3 },
  panel0: { x: PANEL_X[0], z: 5 },
  panel1: { x: PANEL_X[1], z: 5 },
  panel2: { x: PANEL_X[2], z: 5 },
  antenna: { x: 11.5, z: -2.8 },
  weather: { x: -10.4, z: -2.5 },
  rover: { x: 12.2, z: 6.5 },
  rock0: { x: 12.5, z: 3.5 },
  rock1: { x: 8.2, z: 6.4 },
  rock2: { x: -9.5, z: 2 },
};
/** Stations with something to use. The shelter is only a place to go, so it must not catch taps or prompts. */
const USABLE = (Object.keys(STATIONS) as StationId[]).filter((id) => id !== "shelter");

/** Beside the bunk, where the chapter begins. */
export const START: Point = { x: -4.4, z: 0.6 };

/** Things the astronaut must walk around. The scene draws them at these spots. */
export const BUNK: Rect = { x0: -6.6, x1: -5.3, z0: -0.6, z1: 1.8 };
export const TANKS: Rect = { x0: -5.6, x1: -0.4, z0: -5.5, z1: -3.7 };
export const DISH: Rect = { x0: 10.6, x1: 12.4, z0: -5.6, z1: -3.7 };
export const ROVER: Rect = { x0: 12.8, x1: 16.2, z0: 5.4, z1: 7.6 };
export const MAST: Rect = { x0: -11.6, x1: -10.8, z0: -3.7, z1: -2.9 };
const OBSTACLES: readonly Rect[] = [BUNK, TANKS, DISH, ROVER, MAST, ...PANEL_X.map((x) => ({ x0: x - 1.5, x1: x + 1.5, z0: 5.9, z1: 7.7 }))];

/** How close the astronaut must stand to use a station. */
const REACH = 1.2;
/** How far from the base the astronaut may wander. */
const EDGE = 21;
/** Corners the astronaut walks around: the two airlock doors, then the outside corners of the airlock and the hull. */
const WAYPOINTS: readonly Point[] = [
  { x: 5.8, z: 0 },
  { x: 9.6, z: 0 },
  { x: 9.9, z: 2.4 },
  { x: 9.9, z: -2.4 },
  { x: 7.8, z: 4.4 },
  { x: -7.8, z: 4.4 },
  { x: 7.8, z: -4.4 },
  { x: -7.8, z: -4.4 },
];

export function areaOf(p: Point): Area {
  if (Math.abs(p.x) <= ROOM.x && Math.abs(p.z) <= ROOM.z) return "inside";
  if (p.x > ROOM.x && p.x <= LOCK.to && Math.abs(p.z) <= LOCK.z) return "airlock";
  return "outside";
}

function walkable(p: Point): boolean {
  if (OBSTACLES.some((r) => p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1)) return false;
  if (areaOf(p) !== "outside") return true;
  const inHull = Math.abs(p.x) < HULL.x && Math.abs(p.z) < HULL.z;
  const inLockWalls = p.x >= HULL.x && p.x < LOCK.to && Math.abs(p.z) < HULL.lockZ;
  return !inHull && !inLockWalls && Math.hypot(p.x, p.z) < EDGE;
}

/** Move by (dx, dz), sliding along a wall when the straight step is blocked. */
export function walk(p: Point, dx: number, dz: number): Point {
  for (const q of [{ x: p.x + dx, z: p.z + dz }, { x: p.x + dx, z: p.z }, { x: p.x, z: p.z + dz }]) if (walkable(q)) return q;
  return p;
}

/** The nearest station within reach of `p`, if any. */
export function stationNear(p: Point, reach = REACH): StationId | null {
  let best: StationId | null = null;
  for (const id of USABLE) {
    const d = Math.hypot(STATIONS[id].x - p.x, STATIONS[id].z - p.z);
    if (d <= reach) [best, reach] = [id, d];
  }
  return best;
}

const distance = (a: Point, b: Point) => Math.hypot(b.x - a.x, b.z - a.z);

/** True when the straight line from `a` to `b` can be walked. */
function clear(a: Point, b: Point): boolean {
  const steps = Math.ceil(distance(a, b) / 0.2);
  for (let i = 1; i < steps; i++) if (!walkable({ x: a.x + ((b.x - a.x) * i) / steps, z: a.z + ((b.z - a.z) * i) / steps })) return false;
  return true;
}

/**
 * The shortest walk from `from` to `to`, as a list of points ending at `to`.
 * Dijkstra over the start, the end and the fixed corners above.
 * ponytail: a dozen nodes, so a plain scan beats a priority queue. Switch to a
 * grid search if the base grows rooms.
 */
export function route(from: Point, to: Point): Point[] {
  const nodes = [from, ...WAYPOINTS, to];
  const end = nodes.length - 1;
  const cost = nodes.map((_, i) => (i === 0 ? 0 : Infinity));
  const via = nodes.map(() => 0);
  const open = new Set(nodes.keys());
  while (open.size > 0) {
    let u = -1;
    for (const i of open) if (u < 0 || cost[i] < cost[u]) u = i;
    if (u === end || cost[u] === Infinity) break;
    open.delete(u);
    for (const v of open) {
      const c = cost[u] + distance(nodes[u], nodes[v]);
      if (c < cost[v] && clear(nodes[u], nodes[v])) [cost[v], via[v]] = [c, u];
    }
  }
  // No way through (a tap on a wall, say): head straight for it and stop where the wall is.
  if (cost[end] === Infinity) return [to];
  const path: Point[] = [];
  for (let i = end; i !== 0; i = via[i]) path.unshift(nodes[i]);
  return path;
}
