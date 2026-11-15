"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { co2Pct, co2Zone, isStorm, o2Pct, o2Zone, PANELS, powerAt, ROCKS, seen, TASKS, tempZone, type Upgrade } from "@/engine/simulate";
import { areaOf, BUNK, DISH, GARDEN_X, HULL, LOCK, MAST, PANEL_X, ROVER, STATIONS, TANKS, TELESCOPE } from "@/engine/world";
import { useGame } from "@/store/game";
import { BALL, Ball, Box, BOX, Cyl, flat, glow, M } from "./parts";

// The outpost itself: the cutaway habitat, the airlock, and the yard outside.
// Everything is placed from the floor plan in engine/world.ts. Static parts are
// plain meshes; the parts that show game state are animated in one useFrame.

const { damp } = THREE.MathUtils;
const HALF_PI = Math.PI / 2;

// Materials that change with the game.
const LIGHT_STRIP = glow("#ffe2b8");
const AIR_SCREEN = glow("#86d6b0");
const DESK_SCREEN = glow("#8ec5f0");
const SCRUBBER_LAMP = glow("#86d6b0");
const OXYGEN_CORE = glow("#8ec5f0");
const BUTTON = glow("#ff5533", 0.4);
const GROW_LIGHT = glow("#ff9bd0");
const BEACON = glow("#ff5533", 2);
const NOZZLE = glow("#f2c230");
const DISH_TIP = glow("#8ec5f0");
const PATH_LAMP = glow("#ffd9a0", 1.6);
const CRYSTAL = glow("#5fd4e6", 1.8);
const ROVER_EYE = glow("#8ec5f0", 0.3);
const HEATER_FIN = glow("#ff8a3c");
const WATER_LAMP = glow("#f2c230");
const WEATHER_LAMP = glow("#86d6b0");
/** The hidden telescope: its lens catches the sky, and a red lamp keeps night eyes sharp, as real stargazers use. */
const LENS = glow("#9fd3ee", 0.6);
const RED_LAMP = glow("#ff4a3a", 1.4);
const STAR_CHART = flat("#24324f");
const WET_SOIL = flat("#2a170e", 1);
const DISH_SHELL = new THREE.MeshStandardMaterial({ color: "#e9dfcf", roughness: 0.8, flatShading: true, side: THREE.DoubleSide });
/** Power box lights: in use, waiting to be plugged in, lost to dust. */
const CELL = [glow("#8ec5f0", 2.5), glow("#f2c230", 0.9), M.dark];
const PANEL_FACE = PANELS.map(() => new THREE.MeshStandardMaterial({ color: "#1d3157", roughness: 0.3, metalness: 0.5, flatShading: true }));
/** Grey fluff on the air vent. It thins as the astronaut vacuums, and settles again each morning. */
const VENT_DUST = new THREE.MeshStandardMaterial({ color: "#a59484", roughness: 1, transparent: true, opacity: 0.9, depthWrite: false });
const PANEL_DUST = PANELS.map(() => new THREE.MeshStandardMaterial({ color: "#b98058", roughness: 1, transparent: true, opacity: 1, depthWrite: false }));

const ZONE_COLOR = { safe: "#86d6b0", caution: "#f2c230", danger: "#ff5533" };
const PRINTS: readonly Upgrade[] = ["boots", "tools", "tank", "walls", "battery"];
const centre = (r: { x0: number; x1: number; z0: number; z1: number }) => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2] as const;
const [BUNK_X, BUNK_Z] = centre(BUNK);
const [TANK_X, TANK_Z] = centre(TANKS);
const [DISH_X, DISH_Z] = centre(DISH);
const [ROVER_X, ROVER_Z] = centre(ROVER);
const [MAST_X, MAST_Z] = centre(MAST);
const [SCOPE_X, SCOPE_Z] = centre(TELESCOPE);
/** The machines stand against the north wall, just beyond where the astronaut can walk. */
const NORTH = -2.93;
const SOUTH = 2.95;
const LOCK_X = (HULL.x + LOCK.to + 0.25) / 2;
const PATH_LAMPS: [number, number][] = [[10.75, 0.9], [10.75, 3.3], [8.2, 4.05], [4.75, 4.05], [1.25, 4.05], [-2.25, 4.05], [-5.6, 4.05]];

type Props = {
  /** Title screen: show the base alive and ignore the game. */
  demo: boolean;
};

export function Base({ demo }: Props) {
  const fan = useRef<THREE.Group>(null!);
  const lever = useRef<THREE.Group>(null!);
  const cells = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Group>(null!);
  const prints = useRef<THREE.Group>(null!);
  const plants = useRef<THREE.Group>(null!);
  const soil = useRef<THREE.Mesh>(null!);
  const bubble = useRef<THREE.Mesh>(null!);
  const wheel = useRef<THREE.Group>(null!);
  const cups = useRef<THREE.Group>(null!);
  const roverHead = useRef<THREE.Group>(null!);
  const dish = useRef<THREE.Group>(null!);
  const samples = useRef<THREE.Group>(null!);
  const leak = useRef<THREE.Mesh>(null!);
  const bagHeap = useRef<THREE.Group>(null!);
  const bagWall = useRef<THREE.Group>(null!);
  const innerDoor = useRef<THREE.Mesh>(null!);
  const outerDoor = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }, delta) => {
    const { sim, player, near, working } = useGame.getState();
    const t = clock.elapsedTime;
    const pulse = 0.6 + 0.4 * Math.sin(t * 6);
    const on = demo || sim.work.power === 0;
    const alloc = demo ? { scrubber: 3, oxygen: 3, heater: 1 } : sim.alloc;

    // Lights and screens come on with the main switch. The wall screen shows how good the air is.
    LIGHT_STRIP.emissiveIntensity = damp(LIGHT_STRIP.emissiveIntensity, on ? 2.2 : 0, 4, delta);
    const zones = [co2Zone(co2Pct(sim)), o2Zone(o2Pct(sim)), tempZone(sim.tempC)];
    const zone = demo ? "safe" : zones.includes("danger") ? "danger" : zones.includes("caution") ? "caution" : "safe";
    AIR_SCREEN.emissive.set(ZONE_COLOR[zone]);
    AIR_SCREEN.emissiveIntensity = on ? (zone === "danger" ? 2.5 * pulse : 1.4) : 0;
    DESK_SCREEN.emissiveIntensity = on ? 1 : 0;
    GROW_LIGHT.emissiveIntensity = on ? 1.6 : 0;
    BEACON.emissiveIntensity = t % 2 < 0.15 ? 4 : 0.2;

    // Machines show what they are given.
    const scrubberDown = sim.work.scrubber > 0;
    fan.current.rotation.z += (scrubberDown ? 0 : alloc.scrubber) * 5 * delta;
    SCRUBBER_LAMP.emissive.set(scrubberDown ? "#ff5533" : "#86d6b0");
    SCRUBBER_LAMP.emissiveIntensity = scrubberDown ? 3 * pulse : alloc.scrubber > 0 ? 2 : 0;
    OXYGEN_CORE.emissiveIntensity = alloc.oxygen * (0.7 + 0.15 * Math.sin(t * 3));
    lever.current.rotation.x = damp(lever.current.rotation.x, on ? 0 : -2.3, 8, delta);
    HEATER_FIN.emissiveIntensity = damp(HEATER_FIN.emissiveIntensity, alloc.heater * 1.6, 3, delta);
    const used = alloc.scrubber + alloc.oxygen + alloc.heater;
    const power = demo ? 6 : powerAt(sim);
    cells.current.children.forEach((cell, i) => ((cell as THREE.Mesh).material = CELL[i < used ? 0 : i < power ? 1 : 2]));

    // The printer's head slides while it has power; finished upgrades sit on its bed.
    head.current.position.x = on ? 0.35 * Math.sin(t * 1.7) : 0;
    NOZZLE.emissiveIntensity = on ? 2 : 0;
    prints.current.children.forEach((print, i) => (print.visible = sim.upgrades.includes(PRINTS[i])));

    // Watered soil turns dark and the salad grows, until it is picked.
    soil.current.material = sim.work.plant === 0 ? WET_SOIL : M.soil;
    const grown = demo ? 1 : sim.work.salad === 0 ? 0.3 : 0.4 + 0.6 * sim.grow;
    plants.current.scale.setScalar(damp(plants.current.scale.x, grown, 1.5, delta));

    // The water cleaner bubbles once it is fixed; the bike's wheel spins while it is ridden.
    const cleaning = on && (demo || sim.work.recycler === 0);
    WATER_LAMP.emissive.set(cleaning ? "#86d6b0" : "#f2c230");
    WATER_LAMP.emissiveIntensity = cleaning ? 2 : on ? 2 * pulse : 0;
    bubble.current.visible = cleaning;
    bubble.current.position.y = 0.75 + ((t * 0.5) % 0.7);
    if (working && near === "bike") wheel.current.rotation.z -= 12 * delta;

    // The green button wakes up when main life support is ready.
    const ready = sim.work.console > 0;
    BUTTON.emissive.set(ready || sim.won ? "#59e08a" : "#ff5533");
    BUTTON.emissiveIntensity = sim.won ? 3 : ready ? 3 * pulse : 0.4;

    VENT_DUST.opacity = damp(VENT_DUST.opacity, demo ? 0 : (sim.work.vents / TASKS.vents.seconds) * 0.9, 4, delta);

    // Solar panels: dust fades in and out.
    PANELS.forEach((id, i) => (PANEL_DUST[i].opacity = damp(PANEL_DUST[i].opacity, !demo && sim.work[id] > 0 ? 0.92 : 0, 3, delta)));

    // The dish hunts for Earth until it is pointed.
    const aimed = demo || sim.work.antenna === 0;
    dish.current.rotation.y = damp(dish.current.rotation.y, aimed ? 0.9 : 1.2 * Math.sin(t * 0.4), 2, delta);
    dish.current.rotation.x = damp(dish.current.rotation.x, aimed ? -0.8 : -0.15, 2, delta);
    DISH_TIP.emissiveIntensity = aimed ? 3 * pulse : 0;

    // The weather station's cups spin with the wind; the rover looks around once it is awake.
    cups.current.rotation.y += (!demo && isStorm(sim.sol) ? 14 : 2.5) * delta;
    WEATHER_LAMP.emissiveIntensity = demo || sim.work.weather === 0 ? 2.5 : 0;
    const awake = demo || sim.work.rover === 0;
    ROVER_EYE.emissiveIntensity = awake ? 2.5 : 0.3;
    roverHead.current.rotation.y = damp(roverHead.current.rotation.y, awake ? 0.9 * Math.sin(t * 0.7) : 0, 3, delta);

    samples.current.children.forEach((sample, i) => (sample.visible = demo || sim.work[ROCKS[i]] > 0));
    // The supply bags lie in a heap until the flare, when they are stacked into a shelter.
    bagWall.current.visible = !demo && seen(sim, "flare") && sim.work.bags === 0;
    bagHeap.current.visible = !bagWall.current.visible;
    leak.current.visible = sim.work.leak > 0;
    leak.current.scale.setScalar(0.8 + 0.3 * Math.sin(t * 23));

    // Airlock doors: the one nearest the astronaut opens, never both.
    const inLock = !demo && player.x > 5 && areaOf(player) !== "outside";
    const outerHalf = player.x > (HULL.x + LOCK.to) / 2;
    innerDoor.current.position.y = damp(innerDoor.current.position.y, inLock && !outerHalf ? -0.72 : 0.8, 10, delta);
    outerDoor.current.position.y = damp(outerDoor.current.position.y, (inLock && outerHalf) || (!demo && player.x > LOCK.to && player.x < LOCK.to + 1 && Math.abs(player.z) < 1) ? -0.72 : 0.8, 10, delta);
  });

  return (
    <>
      {/* ── Habitat shell: roof and south wall cut away ── */}
      <Box p={[0, 0, 0]} s={[HULL.x * 2, 0.1, HULL.z * 2]} m={M.floor} />
      <Box p={[0, 0.052, 0]} s={[11.6, 0.012, 1.5]} m={M.floorDark} />
      <Box p={[0, 1.3, -3.45]} s={[HULL.x * 2, 2.6, 0.5]} m={M.wall} shadow />
      <Box p={[0, 2.66, -3.45]} s={[HULL.x * 2 + 0.1, 0.12, 0.58]} m={M.trim} />
      <Box p={[0, 0.16, -3.18]} s={[13.2, 0.22, 0.06]} m={M.floorDark} />
      <Box p={[0, 2.45, -3.17]} s={[13.4, 0.07, 0.07]} m={LIGHT_STRIP} />
      <Box p={[-6.85, 0.8, 0]} s={[0.5, 1.6, HULL.z * 2]} m={M.wall} shadow />
      <Box p={[-6.85, 1.64, 0]} s={[0.58, 0.1, HULL.z * 2]} m={M.trim} />
      {[-2.225, 2.225].map((z) => (
        <Box key={z} p={[6.85, 0.8, z]} s={[0.5, 1.6, 2.95]} m={M.wall} shadow />
      ))}
      <Box p={[0, 0.25, 3.45]} s={[HULL.x * 2, 0.5, 0.5]} m={M.trim} />
      {[-1, 1].map((x) => (
        <Cyl key={x} p={[x * HULL.x, 1.35, -HULL.z]} s={[0.3, 2.7, 0.3]} m={M.hull} shadow />
      ))}
      {[-1, 1].map((x) => (
        <Cyl key={x} p={[x * HULL.x, 0.45, HULL.z]} s={[0.3, 0.9, 0.3]} m={M.hull} />
      ))}
      <Cyl p={[-1.5, 2.2, -3.1]} r={[0, 0, HALF_PI]} s={[0.07, 9.4, 0.07]} m={M.metal} />
      <Cyl p={[1.4, 2.03, -3.1]} r={[0, 0, HALF_PI]} s={[0.045, 10.6, 0.045]} m={M.blue} />
      <Cyl p={[-6.58, 1.05, -1.7]} r={[0, 0, HALF_PI]} s={[0.42, 0.08, 0.42]} m={M.dark} />
      <Cyl p={[-6.55, 1.05, -1.7]} r={[0, 0, HALF_PI]} s={[0.34, 0.08, 0.34]} m={M.glass} />
      {[-0.4, 0, 0.4].map((z) => (
        <Box key={z} p={[6.15, 0.056, z]} r={[0, 0.6, 0]} s={[0.5, 0.012, 0.16]} m={M.hazard} />
      ))}

      {/* Bunk and rug */}
      <Box p={[BUNK_X, 0.25, BUNK_Z]} s={[1.3, 0.4, 2.4]} m={M.dark} shadow />
      <Box p={[BUNK_X, 0.52, BUNK_Z]} s={[1.2, 0.16, 2.3]} m={M.cloth} />
      <Box p={[BUNK_X, 0.64, BUNK_Z - 0.45]} s={[1.24, 0.1, 1.3]} m={M.blue} />
      <Box p={[BUNK_X, 0.66, BUNK_Z + 0.85]} s={[0.9, 0.14, 0.45]} m={M.hull} />
      <Box p={[BUNK_X, 0.6, BUNK.z1 + 0.06]} s={[1.3, 0.9, 0.08]} m={M.trim} />
      <Box p={[-4.4, 0.056, 0.6]} s={[1.3, 0.012, 1.9]} m={M.blue} />

      {/* Air cleaner: the fan spins faster with more power */}
      <group position={[STATIONS.scrubber.x, 0, NORTH]}>
        <Box p={[0, 0.9, 0]} s={[1.5, 1.7, 0.55]} m={M.hull} shadow />
        <Box p={[0, 0.12, 0.28]} s={[1.5, 0.14, 0.02]} m={M.trim} />
        <Cyl p={[-0.3, 1.15, 0.29]} r={[HALF_PI, 0, 0]} s={[0.5, 0.06, 0.5]} m={M.dark} />
        <group ref={fan} position={[-0.3, 1.15, 0.34]}>
          <Box p={[0, 0, 0]} s={[0.85, 0.14, 0.03]} m={M.trim} />
          <Box p={[0, 0, 0]} s={[0.14, 0.85, 0.03]} m={M.trim} />
        </group>
        <Box p={[0.45, 0.6, 0.3]} s={[0.45, 0.6, 0.12]} m={M.trim} />
        <Box p={[0.45, 0.6, 0.38]} s={[0.25, 0.05, 0.04]} m={M.dark} />
        <Ball p={[0.5, 1.5, 0.3]} s={0.07} m={SCRUBBER_LAMP} />
        <Cyl p={[0, 1.95, 0]} s={[0.14, 0.5, 0.14]} m={M.metal} />
      </group>

      {/* Oxygen maker: the core glows brighter with more power */}
      <group position={[-2, 0, NORTH]}>
        <Box p={[0, 0.2, 0]} s={[1.1, 0.4, 0.55]} m={M.dark} shadow />
        <Cyl p={[0, 1, 0]} s={[0.2, 1.1, 0.2]} m={OXYGEN_CORE} />
        <Cyl p={[0, 1, 0]} s={[0.42, 1.2, 0.42]} m={M.glass} />
        {[0.45, 1.6].map((y) => (
          <Cyl key={y} p={[0, y, 0]} s={[0.47, 0.1, 0.47]} m={M.metal} />
        ))}
        <Cyl p={[0, 1.85, 0]} s={[0.05, 0.45, 0.05]} m={M.blue} />
      </group>

      {/* Air screen: green, yellow or red with the air */}
      <Box p={[-0.95, 1.6, -3.19]} s={[0.9, 0.62, 0.03]} m={M.dark} />
      <Box p={[-0.95, 1.6, -3.17]} s={[0.76, 0.48, 0.03]} m={AIR_SCREEN} />
      {/* The dial under it is what you read in a leak */}
      <Cyl p={[-0.95, 1.02, -3.16]} r={[HALF_PI, 0, 0]} s={[0.17, 0.05, 0.17]} m={M.cloth} />
      <Box p={[-0.9, 1.06, -3.12]} r={[0, 0, -0.7]} s={[0.03, 0.15, 0.02]} m={M.trim} />

      {/* Air vent: dusty until it is vacuumed, with the hand vacuum waiting below */}
      <group position={[STATIONS.vents.x, 0, -3.17]}>
        <Box p={[0, 1.15, 0]} s={[0.95, 0.6, 0.04]} m={M.dark} />
        {[-0.18, -0.06, 0.06, 0.18].map((y) => (
          <Box key={y} p={[0, 1.15 + y, 0.03]} s={[0.8, 0.05, 0.03]} m={M.metal} />
        ))}
        <Box p={[0, 1.15, 0.06]} s={[0.85, 0.5, 0.02]} m={VENT_DUST} />
        <Cyl p={[-0.35, 0.25, 0.35]} s={[0.13, 0.45, 0.13]} m={M.hazard} />
        <Cyl p={[-0.35, 0.5, 0.35]} s={[0.07, 0.1, 0.07]} m={M.dark} />
        <Box p={[-0.2, 0.2, 0.45]} r={[0, 0, 0.9]} s={[0.05, 0.4, 0.05]} m={M.rubber} />
      </group>

      {/* Power box: a lever and one light for each power */}
      <group position={[STATIONS.power.x, 0, -3]}>
        <Box p={[0, 1.15, 0]} s={[1.6, 1.6, 0.4]} m={M.dark} shadow />
        <Box p={[0, 0.42, 0.21]} s={[1.6, 0.1, 0.03]} m={M.hazard} />
        <group ref={lever} position={[-0.52, 1.35, 0.24]} rotation={[-2.3, 0, 0]}>
          <Box p={[0, -0.22, 0.05]} s={[0.09, 0.5, 0.09]} m={M.metal} />
          <Ball p={[0, -0.48, 0.05]} s={0.09} m={M.hazard} />
        </group>
        <group ref={cells} position={[0.22, 1.3, 0.23]}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} geometry={BOX} position={[(i - 3) * 0.16, 0, 0]} scale={[0.1, 0.5, 0.05]} material={M.dark} />
          ))}
        </group>
        <Cyl p={[0.6, 2.1, 0]} s={[0.05, 0.4, 0.05]} m={M.rubber} />
      </group>

      {/* 3D printer */}
      <group position={[STATIONS.printer.x, 0, NORTH]}>
        <Box p={[0, 0.3, 0]} s={[1.2, 0.6, 0.55]} m={M.hull} shadow />
        {[-0.52, 0.52].flatMap((x) => [-0.2, 0.2].map((z) => <Box key={`${x}${z}`} p={[x, 1.05, z]} s={[0.06, 0.9, 0.06]} m={M.dark} />))}
        <Box p={[0, 1.52, 0]} s={[1.2, 0.08, 0.55]} m={M.dark} />
        <Box p={[0, 0.62, 0]} s={[0.95, 0.04, 0.45]} m={M.metal} />
        <group ref={head} position={[0, 1.38, 0]}>
          <Box p={[0, 0, 0]} s={[0.18, 0.14, 0.5]} m={M.trim} />
          <Cyl p={[0, -0.12, 0.05]} s={[0.03, 0.12, 0.03]} m={NOZZLE} />
        </group>
        <group ref={prints} position={[0, 0.64, 0.05]}>
          <Box p={[-0.36, 0.07, 0]} s={[0.1, 0.14, 0.2]} m={M.suitDark} />
          <Box p={[-0.18, 0.03, 0]} r={[0, 0.5, 0]} s={[0.05, 0.05, 0.3]} m={M.metal} />
          <Cyl p={[0, 0.13, 0]} s={[0.06, 0.26, 0.06]} m={M.metal} />
          <Box p={[0.18, 0.1, 0]} s={[0.12, 0.2, 0.05]} m={M.hull} />
          <Box p={[0.36, 0.09, 0]} s={[0.12, 0.18, 0.12]} m={M.hazard} />
        </group>
      </group>

      {/* Shelf: spare filters and patches */}
      <group position={[STATIONS.storage.x, 0, -2.95]}>
        <Box p={[0, 0.95, -0.22]} s={[1.4, 1.9, 0.04]} m={M.floorDark} />
        {[-0.7, 0.7].map((x) => (
          <Box key={x} p={[x, 0.95, 0]} s={[0.06, 1.9, 0.5]} m={M.dark} shadow />
        ))}
        {[0.1, 0.7, 1.3, 1.88].map((y) => (
          <Box key={y} p={[0, y, 0]} s={[1.4, 0.05, 0.5]} m={M.dark} />
        ))}
        {[-0.4, 0, 0.4].map((x) => (
          <Cyl key={x} p={[x, 0.88, 0.02]} r={[HALF_PI, 0, 0]} s={[0.15, 0.4, 0.15]} m={M.trim} />
        ))}
        {[-0.4, 0, 0.4].map((x) => (
          <Box key={x} p={[x, 0.25, 0.05]} s={[0.3, 0.22, 0.3]} m={M.hazard} />
        ))}
        <Ball p={[-0.3, 1.55, 0]} s={0.2} m={M.suit} />
        <Box p={[0.3, 1.53, 0]} s={[0.5, 0.36, 0.4]} m={M.wall} />
      </group>
      <Box p={[5.95, 0.35, -2.92]} s={[0.7, 0.7, 0.5]} m={M.wall} shadow />
      <Box p={[5.95, 0.95, -2.92]} s={[0.5, 0.5, 0.42]} m={M.trim} />

      {/* Heater: the fins glow when it has power */}
      <group position={[3.45, 0, NORTH]}>
        <Box p={[0, 0.55, 0.05]} s={[0.7, 0.9, 0.3]} m={M.dark} shadow />
        {[-0.24, -0.12, 0, 0.12, 0.24].map((x) => (
          <Box key={x} p={[x, 0.55, 0.22]} s={[0.06, 0.7, 0.06]} m={HEATER_FIN} />
        ))}
        <Cyl p={[0.2, 1.5, 0]} s={[0.04, 1, 0.04]} m={M.trim} />
      </group>

      {/* Exercise bike */}
      <group position={[STATIONS.bike.x, 0, SOUTH]}>
        <Box p={[0, 0.06, 0]} s={[1.1, 0.08, 0.4]} m={M.dark} />
        <Box p={[-0.15, 0.45, 0]} r={[0, 0, 0.35]} s={[0.07, 0.8, 0.07]} m={M.metal} />
        <Box p={[-0.3, 0.86, 0]} s={[0.3, 0.07, 0.2]} m={M.rubber} />
        <Box p={[0.32, 0.6, 0]} r={[0, 0, -0.25]} s={[0.06, 1, 0.06]} m={M.metal} />
        <Box p={[0.42, 1.08, 0]} s={[0.07, 0.07, 0.5]} m={M.rubber} />
        <group ref={wheel} position={[0.3, 0.38, 0]}>
          <Cyl p={[0, 0, 0]} r={[HALF_PI, 0, 0]} s={[0.3, 0.07, 0.3]} m={M.blue} />
          <Box p={[0, 0, 0]} s={[0.56, 0.05, 0.09]} m={M.hull} />
          <Box p={[0, 0, 0]} s={[0.05, 0.56, 0.09]} m={M.hull} />
        </group>
      </group>

      {/* Water cleaner: a bubble climbs the glass once it is fixed */}
      <group position={[STATIONS.recycler.x, 0, SOUTH]}>
        <Box p={[0, 0.3, 0]} s={[1.6, 0.6, 0.5]} m={M.hull} shadow />
        {[-0.5, 0.5].map((x) => (
          <Cyl key={x} p={[x, 1, 0]} s={[0.24, 0.8, 0.24]} m={M.blue} />
        ))}
        <Cyl p={[0, 1.05, 0]} s={[0.13, 0.9, 0.13]} m={M.glass} />
        <mesh ref={bubble} geometry={BALL} position={[0, 0.75, 0]} scale={0.07} material={M.cloth} visible={false} />
        <Cyl p={[0, 1.55, 0]} r={[0, 0, HALF_PI]} s={[0.04, 1, 0.04]} m={M.metal} />
        <Ball p={[0.68, 0.72, 0]} s={0.06} m={WATER_LAMP} />
      </group>

      {/* Supply bags: a heap by the wall, or a shelter wall once they are stacked */}
      <group position={[STATIONS.bags.x, 0, SOUTH]}>
        <group ref={bagHeap}>
          <Box p={[-0.3, 0.14, -0.1]} s={[0.55, 0.28, 0.4]} m={M.cloth} shadow />
          <Box p={[0.3, 0.14, -0.15]} r={[0, 0.3, 0]} s={[0.55, 0.28, 0.4]} m={M.blue} shadow />
          <Box p={[0, 0.42, -0.1]} r={[0, -0.2, 0]} s={[0.55, 0.28, 0.4]} m={M.cloth} shadow />
        </group>
        <group ref={bagWall} visible={false}>
          {[0, 1, 2, 3].map((row) =>
            [-0.58, 0, 0.58].map((x) => <Box key={`${row}${x}`} p={[x + (row % 2) * 0.1, 0.14 + row * 0.29, -0.1]} s={[0.55, 0.28, 0.4]} m={(row + Math.round(x)) % 2 ? M.blue : M.cloth} shadow />),
          )}
        </group>
      </group>

      {/* Table by the airlock: a mug and a plate */}
      <Box p={[6.33, 0.72, 2]} s={[0.5, 0.06, 1.1]} m={M.trim} />
      <Box p={[6.33, 0.36, 2]} s={[0.1, 0.7, 0.1]} m={M.dark} />
      <Cyl p={[6.3, 0.82, 1.75]} s={[0.07, 0.14, 0.07]} m={M.blue} />
      <Cyl p={[6.3, 0.765, 2.2]} s={[0.16, 0.025, 0.16]} m={M.cloth} />

      {/* Garden: salad grows when watered */}
      <group position={[GARDEN_X, 0, SOUTH]}>
        <Box p={[0, 0.3, 0]} s={[2.6, 0.5, 0.5]} m={M.hull} />
        <mesh ref={soil} geometry={BOX} position={[0, 0.56, 0]} scale={[2.4, 0.04, 0.36]} material={M.soil} receiveShadow />
        <group ref={plants} position={[0, 0.58, 0]} scale={0.4}>
          {[-1, -0.6, -0.2, 0.2, 0.6, 1].map((x, i) => (
            <group key={x} position={[x, 0, (i % 2) * 0.1 - 0.05]}>
              <Cyl p={[0, 0.14, 0]} s={[0.025, 0.28, 0.025]} m={M.leaf} />
              <Ball p={[0, 0.34, 0]} s={[0.17, 0.11, 0.17]} m={M.leaf} />
              <Ball p={[0.08, 0.2, 0.04]} s={0.09} m={M.leaf} />
            </group>
          ))}
        </group>
        {[-1.25, 1.25].map((x) => (
          <Box key={x} p={[x, 0.95, 0.15]} s={[0.05, 0.8, 0.05]} m={M.dark} />
        ))}
        <Box p={[0, 1.36, 0.15]} s={[2.6, 0.06, 0.18]} m={M.dark} />
        <Box p={[0, 1.32, 0.15]} s={[2.4, 0.02, 0.1]} m={GROW_LIGHT} />
        <Cyl p={[-1.85, 0.45, -0.02]} s={[0.28, 0.8, 0.28]} m={M.blue} />
        <Cyl p={[-1.85, 0.88, -0.02]} s={[0.12, 0.08, 0.12]} m={M.metal} />
      </group>

      {/* Big desk: the green button restarts main life support */}
      <group position={[STATIONS.console.x, 0, SOUTH]}>
        <Box p={[0, 0.4, 0]} s={[2.4, 0.8, 0.5]} m={M.dark} shadow />
        <Box p={[-0.35, 0.82, 0]} s={[1.4, 0.03, 0.38]} m={DESK_SCREEN} />
        <Cyl p={[0.8, 0.84, 0]} s={[0.24, 0.06, 0.24]} m={M.metal} />
        <Ball p={[0.8, 0.9, 0]} s={[0.18, 0.11, 0.18]} m={BUTTON} />
        <Cyl p={[-1.08, 0.87, 0.05]} s={[0.05, 0.1, 0.05]} m={M.trim} />
      </group>

      {/* ── Airlock: two doors, never both open ── */}
      <Box p={[LOCK_X, 0, 0]} s={[LOCK.to + 0.25 - HULL.x, 0.1, HULL.lockZ * 2]} m={M.floorDark} />
      <Box p={[LOCK_X, 0.8, -1.55]} s={[LOCK.to + 0.25 - HULL.x, 1.6, 0.3]} m={M.wall} shadow />
      <Box p={[LOCK_X, 0.25, 1.55]} s={[LOCK.to + 0.25 - HULL.x, 0.5, 0.3]} m={M.trim} />
      {[-1.2, 1.2].map((z) => (
        <Box key={z} p={[LOCK.to + 0.13, 0.8, z]} s={[0.25, 1.6, 1]} m={M.wall} shadow />
      ))}
      <mesh ref={innerDoor} geometry={BOX} position={[6.85, 0.8, 0]} scale={[0.16, 1.5, 1.45]} material={M.dark} />
      <mesh ref={outerDoor} geometry={BOX} position={[LOCK.to + 0.13, 0.8, 0]} scale={[0.16, 1.5, 1.38]} material={M.dark} />
      <Box p={[8.3, 0.75, -1.2]} s={[1.6, 1.5, 0.4]} m={M.hull} />
      {[7.8, 8.3, 8.8].map((x) => (
        <Ball key={x} p={[x, 1.15, -0.98]} s={0.19} m={M.suit} />
      ))}
      <Box p={[8.3, 0.3, 1.15]} s={[1.4, 0.12, 0.4]} m={M.trim} />
      <Box p={[LOCK.to + 0.65, 0.03, 0]} s={[0.8, 0.06, 1.6]} m={M.metal} />
      <mesh ref={leak} position={[LOCK.to + 0.5, 1, 0.85]} rotation={[0, 0, -HALF_PI]} visible={false}>
        <coneGeometry args={[0.28, 1.1, 8, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Yard ── */}
      {/* Walkway from the airlock to the solar panels, with lamps */}
      <Box p={[10, 0.012, 2.1]} s={[1.1, 0.02, 5.6]} m={M.path} />
      <Box p={[2.2, 0.012, 4.75]} s={[16.7, 0.02, 1.1]} m={M.path} />
      {PATH_LAMPS.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <Cyl p={[0, 0.3, 0]} s={[0.04, 0.6, 0.04]} m={M.dark} />
          <Ball p={[0, 0.65, 0]} s={0.09} m={PATH_LAMP} />
        </group>
      ))}

      {/* Solar panels: dusty panels give no power */}
      {PANELS.map((id, i) => (
        <group key={id} position={[PANEL_X[i], 0, 6.8]}>
          <Box p={[0, 0.06, 0]} s={[0.7, 0.12, 0.7]} m={M.dark} />
          <Cyl p={[0, 0.55, 0]} s={[0.08, 1.1, 0.08]} m={M.dark} />
          <Box p={[0.35, 0.03, -1.65]} s={[0.06, 0.05, 2.9]} m={M.rubber} />
          <group position={[0, 1.15, 0]} rotation={[0.5, 0, 0]}>
            <Box p={[0, -0.05, 0]} s={[2.82, 0.05, 1.82]} m={M.metal} shadow />
            <Box p={[0, 0, 0]} s={[2.7, 0.07, 1.7]} m={PANEL_FACE[i]} />
            {[-0.675, 0, 0.675].map((x) => (
              <Box key={x} p={[x, 0.04, 0]} s={[0.03, 0.012, 1.7]} m={M.metal} />
            ))}
            <Box p={[0, 0.04, 0]} s={[2.7, 0.012, 0.03]} m={M.metal} />
            <Box p={[0, 0.05, 0]} s={[2.72, 0.014, 1.72]} m={PANEL_DUST[i]} />
          </group>
        </group>
      ))}

      {/* Air and water tanks behind the habitat */}
      <group position={[TANK_X, 0, TANK_Z]}>
        <Cyl p={[0, 1, 0]} r={[0, 0, HALF_PI]} s={[0.8, 3.6, 0.8]} m={M.hull} shadow />
        {[-1.8, 1.8].map((x) => (
          <Ball key={x} p={[x, 1, 0]} s={0.8} m={M.hull} />
        ))}
        {[-1.1, 1.1].map((x) => (
          <Cyl key={x} p={[x, 1, 0]} r={[0, 0, HALF_PI]} s={[0.83, 0.3, 0.83]} m={M.blue} />
        ))}
        {[-1.3, 1.3].map((x) => (
          <Box key={x} p={[x, 0.15, 0]} s={[0.3, 0.3, 1.5]} m={M.dark} />
        ))}
        <Cyl p={[0, 1.2, 0.85]} r={[HALF_PI, 0, 0]} s={[0.07, 0.9, 0.07]} m={M.metal} />
      </group>

      {/* Radio dish */}
      <group position={[DISH_X, 0, DISH_Z]}>
        <Box p={[0, 0.2, 0]} s={[1.4, 0.4, 1.4]} m={M.dark} shadow />
        <Cyl p={[0, 1.5, 0]} s={[0.1, 2.6, 0.1]} m={M.metal} shadow />
        <group ref={dish} position={[0, 2.9, 0]}>
          <mesh position={[0, 0, 1]} rotation={[-HALF_PI, 0, 0]} material={DISH_SHELL} castShadow>
            <sphereGeometry args={[1.2, 16, 5, 0, Math.PI * 2, 0, 0.9]} />
          </mesh>
          <Cyl p={[0, 0, 0.45]} r={[HALF_PI, 0, 0]} s={[0.03, 0.9, 0.03]} m={M.dark} />
          <Ball p={[0, 0, 0.92]} s={0.08} m={DISH_TIP} />
        </group>
      </group>

      {/* Rover, parked */}
      <group position={[ROVER_X, 0, ROVER_Z]} rotation={[0, 0.25, 0]}>
        <Box p={[0, 0.75, 0]} s={[2.4, 0.45, 1.3]} m={M.hull} shadow />
        <Box p={[0, 1, 0]} s={[2.2, 0.06, 1.2]} m={PANEL_FACE[0]} />
        {[-0.95, 0, 0.95].flatMap((x) => [-0.8, 0.8].map((z) => <Cyl key={`${x}${z}`} p={[x, 0.38, z]} r={[HALF_PI, 0, 0]} s={[0.38, 0.3, 0.38]} m={M.rubber} shadow />))}
        <Cyl p={[0.8, 1.5, 0.3]} s={[0.05, 1, 0.05]} m={M.metal} />
        <group ref={roverHead} position={[0.8, 2.05, 0.3]}>
          <Box p={[0, 0, 0]} s={[0.4, 0.2, 0.25]} m={M.dark} />
          <Ball p={[0.1, 0, 0.13]} s={0.05} m={ROVER_EYE} />
        </group>
        <Cyl p={[-0.9, 1.4, -0.4]} s={[0.015, 0.8, 0.015]} m={M.dark} />
      </group>

      {/* Weather station: the cups spin in the wind */}
      <group position={[MAST_X, 0, MAST_Z]}>
        <Box p={[0, 0.1, 0]} s={[0.7, 0.2, 0.7]} m={M.dark} />
        <Cyl p={[0, 1.4, 0]} s={[0.05, 2.6, 0.05]} m={M.metal} shadow />
        <Box p={[0, 1.2, 0.12]} s={[0.36, 0.3, 0.2]} m={M.hull} />
        <Ball p={[0.1, 1.25, 0.23]} s={0.04} m={WEATHER_LAMP} />
        <Box p={[0, 1.9, 0.1]} r={[0.6, 0, 0]} s={[0.6, 0.03, 0.4]} m={PANEL_FACE[0]} />
        <group ref={cups} position={[0, 2.75, 0]}>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
              <Box p={[0.2, 0, 0]} s={[0.4, 0.03, 0.03]} m={M.dark} />
              <Ball p={[0.42, 0, 0]} s={0.08} m={M.trim} />
            </group>
          ))}
        </group>
      </group>

      {/* Blue rock samples, until they are picked up */}
      <group ref={samples}>
        {ROCKS.map((id) => (
          <group key={id} position={[STATIONS[id].x, 0, STATIONS[id].z]}>
            <mesh position={[0.25, 0.2, -0.25]} scale={0.38} material={M.rock} castShadow>
              <dodecahedronGeometry args={[1, 0]} />
            </mesh>
            {[[0.05, 0.22, -0.1, 0.2], [0.4, 0.14, 0, 0.13], [0.15, 0.1, 0.1, 0.1]].map(([x, y, z, size], i) => (
              <mesh key={i} position={[x, y, z]} scale={[size * 0.6, size * 1.4, size * 0.6]} rotation={[0.2 * i, i, 0.3]} material={CRYSTAL}>
                <octahedronGeometry args={[1, 0]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* The hidden telescope behind the rover, aimed up at the evening sky. The eyepiece faces west, where the astronaut stands. */}
      <group position={[SCOPE_X, 0, SCOPE_Z]}>
        {/* Tripod: three legs from the head out to rubber feet */}
        {[0, 1, 2].map((i) => (
          <group key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]}>
            <Cyl p={[0.275, 0.5, 0]} r={[0, 0, 0.5]} s={[0.025, 1.14, 0.025]} m={M.metal} shadow />
            <Ball p={[0.55, 0.03, 0]} s={[0.06, 0.03, 0.06]} m={M.rubber} />
          </group>
        ))}
        {/* Tray between the legs: spare eyepieces and the red lamp */}
        <Cyl p={[0, 0.45, 0]} s={[0.28, 0.02, 0.28]} m={M.dark} />
        <Cyl p={[0.08, 0.5, 0.06]} s={[0.035, 0.08, 0.035]} m={M.rubber} />
        <Cyl p={[0.02, 0.5, -0.1]} s={[0.03, 0.07, 0.03]} m={M.metal} />
        <Ball p={[-0.1, 0.5, 0.05]} s={0.04} m={RED_LAMP} />
        {/* Mount head and the counterweight that balances the tube */}
        <Box p={[0, 1.06, 0]} s={[0.18, 0.14, 0.18]} m={M.dark} />
        <Box p={[0, 1.18, 0]} s={[0.08, 0.14, 0.2]} m={M.metal} />
        <group position={[0, 1.25, 0]} rotation={[0, 0.5, -0.95]}>
          <Cyl p={[-0.2, 0, 0]} r={[0, 0, Math.PI / 2]} s={[0.015, 0.35, 0.015]} m={M.metal} />
          <Cyl p={[-0.38, 0, 0]} r={[0, 0, Math.PI / 2]} s={[0.07, 0.08, 0.07]} m={M.dark} />
          {/* Tube, dew shield, lens and trim rings */}
          <Cyl p={[0, 0.2, 0]} s={[0.11, 1.2, 0.11]} m={M.hull} shadow />
          <Cyl p={[0, -0.2, 0]} s={[0.117, 0.05, 0.117]} m={M.trim} />
          <Cyl p={[0, 0.5, 0]} s={[0.117, 0.05, 0.117]} m={M.trim} />
          <Cyl p={[0, 0.86, 0]} s={[0.13, 0.25, 0.13]} m={M.dark} />
          <Cyl p={[0, 0.96, 0]} s={[0.11, 0.01, 0.11]} m={LENS} />
          {/* Focuser and the eyepiece, bent sideways so a helmet fits */}
          <Cyl p={[0, -0.44, 0]} s={[0.08, 0.08, 0.08]} m={M.dark} />
          <Cyl p={[0, -0.53, 0]} s={[0.04, 0.12, 0.04]} m={M.metal} />
          <Cyl p={[-0.08, -0.58, 0]} r={[0, 0, Math.PI / 2]} s={[0.035, 0.14, 0.035]} m={M.rubber} />
          {/* Little finder scope on top, on two brackets */}
          <Cyl p={[0.17, 0.25, 0]} s={[0.035, 0.4, 0.035]} m={M.dark} />
          <Box p={[0.13, 0.12, 0]} s={[0.06, 0.03, 0.04]} m={M.metal} />
          <Box p={[0.13, 0.38, 0]} s={[0.06, 0.03, 0.04]} m={M.metal} />
        </group>
        {/* A stool with a mug and a star chart: someone came out here to watch the sky */}
        <Cyl p={[0.35, 0.02, 0.55]} s={[0.13, 0.03, 0.13]} m={M.dark} />
        <Cyl p={[0.35, 0.21, 0.55]} s={[0.03, 0.4, 0.03]} m={M.metal} />
        <Cyl p={[0.35, 0.42, 0.55]} s={[0.16, 0.04, 0.16]} m={M.trim} />
        <Cyl p={[0.29, 0.49, 0.5]} s={[0.04, 0.09, 0.04]} m={M.blue} />
        <Box p={[0.42, 0.455, 0.6]} r={[0, 0.4, 0]} s={[0.14, 0.03, 0.1]} m={STAR_CHART} />
      </group>

      {/* The lander that brought you, far off */}
      <group position={[-17, 0, -14]}>
        <mesh position={[0, 2.4, 0]} material={M.hull} castShadow>
          <cylinderGeometry args={[0.8, 1.7, 3.2, 10]} />
        </mesh>
        <Ball p={[0, 4, 0]} s={0.8} m={M.hull} />
        <Cyl p={[0, 0.6, 0]} s={[0.9, 0.6, 0.9]} m={M.dark} />
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} p={[Math.cos(i * HALF_PI + 0.8) * 1.9, 0.6, Math.sin(i * HALF_PI + 0.8) * 1.9]} r={[0, -i * HALF_PI - 0.8, 0.5]} s={[1.6, 0.1, 0.1]} m={M.metal} />
        ))}
        <Box p={[0, 2.4, 1.3]} s={[0.5, 0.5, 0.08]} m={flat("#3f6ea3")} />
      </group>

      {/* Mast and beacon */}
      <Cyl p={[-6.6, 3.6, -3.45]} s={[0.04, 2, 0.04]} m={M.dark} />
      <Ball p={[-6.6, 4.65, -3.45]} s={0.09} m={BEACON} />
    </>
  );
}
