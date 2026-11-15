import { create } from "zustand";
import { type Area, buy, initialState, isOver, isStarving, jobs, setCells, type SimState, spotEarth, type StationId, step, type System, take, type Upgrade } from "@/engine/simulate";
import { MESSAGES } from "@/engine/story";
import { areaOf, type Point, route, START, STATIONS, stationNear, walk } from "@/engine/world";

/** Walking speed in metres per second, indoors and in a suit. Game pacing. */
const SPEED: Record<Area, number> = { inside: 3.8, airlock: 3.8, outside: 3.2 };
/** How much faster the fast boots make you. Game rule. */
const BOOTS = 1.3;
/** How much an empty stomach slows you down. Game rule. */
const STARVING = 0.6;

export type Player = Point & {
  /** Facing direction in radians, 0 = south (toward the camera). */
  readonly heading: number;
  readonly moving: boolean;
};

type Snapshot = { readonly sim: SimState; readonly player: Player };

export type GameState = Snapshot & {
  /** Which line of ARIA's message is on screen, or null while the player is in control. */
  readonly line: number | null;
  readonly paused: boolean;
  readonly muted: boolean;
  /** The station within reach, and whether the astronaut is working at it. */
  readonly near: StationId | null;
  readonly working: boolean;
  /** The moment ARIA last spoke, so a failed player can try again from there. */
  readonly checkpoint: Snapshot;
  tick(seconds: number): void;
  /** Walk in a direction (keyboard). Zero stops. */
  steer(dx: number, dz: number): void;
  /** Walk to a point on the ground (mouse or touch). */
  walkTo(target: Point): void;
  /** Read on if ARIA is talking; otherwise use the station within reach. */
  interact(): void;
  setCells(system: System, cells: number): void;
  buy(upgrade: Upgrade): void;
  /** Earth is in the hidden telescope's sights. */
  spotEarth(): void;
  togglePause(): void;
  toggleMute(): void;
  rewind(): void;
  restart(): void;
};

/** True while the clock runs and the astronaut can move. */
export const isPlaying = (s: GameState) => s.line === null && !s.paused && !isOver(s.sim);

const start = (): Snapshot => ({ sim: initialState(), player: { ...START, heading: 0, moving: false } });

// Movement input changes many times a second and nothing renders from it, so
// it lives outside the reactive state.
let steering = { x: 0, z: 0 };
let path: Point[] = [];
/** The station a tap sent the astronaut to; they use it on arrival. */
let goal: StationId | null = null;

/** One frame of walking: follow the keys if any are held, otherwise the tapped route. */
function move(player: Player, metres: number): Player {
  let { x: dx, z: dz } = steering;
  let reach = Infinity;
  if (dx || dz) {
    path = [];
    goal = null;
  } else if (path.length > 0) {
    dx = path[0].x - player.x;
    dz = path[0].z - player.z;
    reach = Math.hypot(dx, dz);
    if (reach < 0.05) {
      path.shift();
      return move(player, metres);
    }
  }
  if (!dx && !dz) return player.moving ? { ...player, moving: false } : player;
  const stride = Math.min(metres, reach) / Math.hypot(dx, dz);
  const to = walk(player, dx * stride, dz * stride);
  if (to === player) path = []; // blocked: give up on the route
  return { ...to, heading: Math.atan2(dx, dz), moving: to !== player };
}

// ponytail: only the best score is saved between visits (in the debrief). Add
// zustand `persist` when a second chapter needs to know the first was finished.
export const useGame = create<GameState>((set, get) => ({
  ...start(),
  line: 0,
  paused: false,
  muted: false,
  near: null,
  working: false,
  checkpoint: start(),

  tick(seconds) {
    const state = get();
    if (!isPlaying(state)) return;
    const speed = SPEED[areaOf(state.player)] * (state.sim.upgrades.includes("boots") ? BOOTS : 1) * (isStarving(state.sim) ? STARVING : 1);
    const player = move(state.player, speed * seconds);
    const near = stationNear(player);
    // Walking away from a job stops it.
    const sim = step(state.sim, { area: areaOf(player), near, working: state.working && !player.moving }, seconds);

    if (sim.said !== state.sim.said) {
      // ARIA has something to say: stop so the player can read it.
      const snapshot = { sim, player: { ...player, moving: false } };
      set({ ...snapshot, checkpoint: snapshot, near, working: false, line: 0 });
      return;
    }
    const working = state.working && !player.moving && jobs(sim).some((j) => j.at === near && j.action === "work");
    set({ sim, player, near, working });
    if (goal && path.length === 0) {
      if (near === goal) get().interact();
      goal = null;
    }
  },

  steer(dx, dz) {
    steering = { x: dx, z: dz };
  },

  walkTo(target) {
    const state = get();
    if (!isPlaying(state)) return;
    // A tap on or beside a station means "go and use it".
    goal = stationNear(target, 2);
    path = route(state.player, goal ? STATIONS[goal] : target);
  },

  interact() {
    const state = get();
    if (state.line !== null) {
      set({ line: state.line + 1 < MESSAGES[state.sim.message].length ? state.line + 1 : null });
      return;
    }
    const job = isPlaying(state) ? jobs(state.sim).find((j) => j.at === state.near) : undefined;
    if (job?.action === "take") set({ sim: take(state.sim) });
    if (job?.action === "work") set({ working: true });
  },

  setCells(system, cells) {
    const state = get();
    // Power is moved by hand, at the power box.
    if (isPlaying(state) && state.near === "power") set({ sim: setCells(state.sim, system, cells) });
  },

  buy(upgrade) {
    const state = get();
    if (isPlaying(state) && state.near === "printer") set({ sim: buy(state.sim, upgrade) });
  },

  spotEarth() {
    const state = get();
    if (isPlaying(state) && state.near === "telescope") set({ sim: spotEarth(state.sim) });
  },

  togglePause: () => set({ paused: !get().paused }),
  toggleMute: () => set({ muted: !get().muted }),

  rewind() {
    const { checkpoint } = get();
    path = [];
    goal = null;
    set({ ...checkpoint, near: stationNear(checkpoint.player), working: false, line: 0, paused: false });
  },

  restart() {
    path = [];
    goal = null;
    set({ ...start(), checkpoint: start(), near: null, working: false, line: 0, paused: false });
  },
}));
