"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { jobs, type StationId } from "@/engine/simulate";
import { areaOf, type Point, route, STATIONS } from "@/engine/world";
import { useGame } from "@/store/game";
import { Ball, Box, BOX, Cyl, CYL, glow, M } from "./parts";

// The astronaut, ARIA the helper robot, and the guides that show the way: a
// trail of dots on the ground to the next job and a marker over every station
// with something to do.

const { damp } = THREE.MathUtils;
const STATION_IDS = Object.keys(STATIONS) as StationId[];

const ARIA_EYE = glow("#8ec5f0", 2.5);
const CHEST_LIGHT = glow("#86d6b0", 2);
const HEAD_LAMP = glow("#fff4d6", 0);
const MAIN_MARK = glow("#f2c230", 2.5);
const SIDE_MARK = glow("#8ec5f0", 2);

const DOTS = 72;
const DOT_GAP = 0.6;
const TRAIL = new THREE.InstancedMesh(new THREE.CircleGeometry(0.1, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#f2c230", transparent: true, opacity: 0.9, depthWrite: false }), DOTS);
TRAIL.frustumCulled = false;
const dot = new THREE.Object3D();

/** Smallest turn from angle `from` to angle `to`. */
const turn = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

type Props = {
  /** Title screen: stand still, no guides. */
  demo: boolean;
};

export function Crew({ demo }: Props) {
  const astronaut = useRef<THREE.Group>(null!);
  const helmet = useRef<THREE.Group>(null!);
  const lamp = useRef<THREE.PointLight>(null!);
  const limbs = useRef<(THREE.Group | null)[]>([]);
  const filter = useRef<THREE.Mesh>(null!);
  const patch = useRef<THREE.Mesh>(null!);
  const aria = useRef<THREE.Group>(null!);
  const halo = useRef<THREE.Mesh>(null!);
  const markers = useRef<THREE.Group>(null!);
  // The trail's route is only worked out again when the goal changes or the astronaut has moved.
  const trail = useRef<{ goal: StationId | null; from: Point; path: Point[] }>({ goal: null, from: { x: 99, z: 99 }, path: [] });

  useFrame(({ clock, scene }, delta) => {
    const { sim, player, near, working, line } = useGame.getState();
    const t = clock.elapsedTime;
    const area = areaOf(player);

    // Astronaut: turn to face the way they walk, or the thing they are working on.
    const station = near ? STATIONS[near] : null;
    const facing = working && station ? (near?.startsWith("panel") ? 0 : near === "leak" ? -Math.PI / 2 : near === "rover" ? Math.PI / 2 : station.z > 0 && area === "inside" ? 0 : Math.PI) : player.heading;
    astronaut.current.position.set(player.x, 0.05 + (player.moving ? Math.abs(Math.sin(t * 11)) * 0.05 : Math.sin(t * 2) * 0.01), player.z);
    astronaut.current.rotation.y += turn(astronaut.current.rotation.y, demo ? 0.5 : facing) * Math.min(1, 14 * delta);
    helmet.current.visible = area !== "inside";
    const swing = player.moving ? Math.sin(t * 11) * 0.7 : 0;
    const reach = working ? -1.3 + 0.35 * Math.sin(t * 14) : sim.carrying ? -1.1 : 0;
    const [legL, legR, armL, armR] = limbs.current;
    legL!.rotation.x = swing;
    legR!.rotation.x = -swing;
    armL!.rotation.x = reach || -swing;
    armR!.rotation.x = reach || swing;
    filter.current.visible = sim.carrying === "filter";
    patch.current.visible = sim.carrying === "patch";
    // The helmet lamp comes on outside when the sky is dark.
    const dark = area === "outside" && (scene.fog as THREE.FogExp2).color.r < 0.35;
    lamp.current.intensity = damp(lamp.current.intensity, dark ? 18 : 0, 4, delta);
    HEAD_LAMP.emissiveIntensity = lamp.current.intensity / 6;

    // ARIA floats at the astronaut's shoulder and turns to the camera when she talks.
    const a = aria.current;
    a.position.x = damp(a.position.x, player.x - 0.85, 4, delta);
    a.position.z = damp(a.position.z, player.z + 0.35, 4, delta);
    a.position.y = 1.95 + 0.08 * Math.sin(t * 2.2);
    a.rotation.y += turn(a.rotation.y, line !== null || demo ? 0.3 : player.heading) * Math.min(1, 6 * delta);
    halo.current.rotation.z = t * 1.5;
    ARIA_EYE.emissiveIntensity = line !== null ? 2.5 + 1.5 * Math.sin(t * 12) : 2.5;

    // Markers bounce over every station with a job: yellow for must-do, blue for optional.
    const todo = demo ? [] : jobs(sim);
    markers.current.children.forEach((marker, i) => {
      const job = todo.find((j) => j.at === STATION_IDS[i]);
      marker.visible = job !== undefined;
      (marker as THREE.Mesh).material = job?.side ? SIDE_MARK : MAIN_MARK;
      marker.position.y = 2.7 + 0.15 * Math.sin(t * 4 + i);
      marker.rotation.y = t * 2;
    });

    // Trail: dots flow along the ground from the astronaut to the first job on the list.
    // Once the astronaut is indoors, "stay inside" needs no trail: lead on to the next job.
    const goal = todo.find((j) => j.at !== "shelter" || area === "outside")?.at ?? null;
    const state = trail.current;
    if (goal !== state.goal || Math.hypot(player.x - state.from.x, player.z - state.from.z) > 0.3) {
      state.goal = goal;
      state.from = player;
      state.path = goal ? [player, ...route(player, STATIONS[goal])] : [];
    }
    let used = 0;
    let along = 0.9 + ((t * 1.2) % DOT_GAP); // start a step ahead of the astronaut, and drift forward
    for (let i = 1; i < state.path.length && used < DOTS; i++) {
      const from = state.path[i - 1];
      const to = state.path[i];
      const length = Math.hypot(to.x - from.x, to.z - from.z);
      const last = i === state.path.length - 1;
      for (; along < length - (last ? 0.5 : 0) && used < DOTS; along += DOT_GAP) {
        dot.position.set(from.x + ((to.x - from.x) * along) / length, 0.075, from.z + ((to.z - from.z) * along) / length);
        dot.updateMatrix();
        TRAIL.setMatrixAt(used++, dot.matrix);
      }
      along -= length;
    }
    TRAIL.count = used;
    TRAIL.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      {/* The astronaut. Faces +z (south) at heading 0. */}
      <group ref={astronaut} scale={1.25}>
        <Ball p={[0, 0.98, 0]} s={[0.27, 0.36, 0.22]} m={M.suit} shadow />
        <Box p={[0, 0.72, 0]} s={[0.44, 0.08, 0.3]} m={M.suitDark} />
        <Box p={[0, 1.05, 0.2]} s={[0.26, 0.18, 0.08]} m={M.suitDark} />
        <Ball p={[0.07, 1.08, 0.25]} s={0.025} m={CHEST_LIGHT} />
        <Box p={[0, 1.02, -0.27]} s={[0.42, 0.56, 0.22]} m={M.hull} shadow />
        {[-0.1, 0.1].map((x) => (
          <Cyl key={x} p={[x, 1.05, -0.4]} s={[0.07, 0.42, 0.07]} m={M.metal} />
        ))}
        <Cyl p={[0.17, 1.5, -0.3]} s={[0.012, 0.4, 0.012]} m={M.dark} />
        <Ball p={[0, 1.52, 0]} s={0.19} m={M.skin} />
        <Ball p={[0, 1.58, -0.03]} s={[0.2, 0.16, 0.2]} m={M.hair} />
        {[-0.07, 0.07].map((x) => (
          <Ball key={x} p={[x, 1.54, 0.17]} s={0.025} m={M.rubber} />
        ))}
        <group ref={helmet}>
          <Ball p={[0, 1.52, 0]} s={0.29} m={M.suit} />
          <Ball p={[0, 1.53, 0.1]} s={[0.23, 0.2, 0.22]} m={M.visor} />
          <Ball p={[0.21, 1.72, 0.1]} s={0.045} m={HEAD_LAMP} />
        </group>
        <pointLight ref={lamp} position={[0, 1.7, 0.6]} color="#fff4d6" distance={9} intensity={0} />
        {[
          [-0.12, 0.55],
          [0.12, 0.55],
        ].map(([x, y], i) => (
          <group key={i} ref={(g) => void (limbs.current[i] = g)} position={[x, y, 0]}>
            <Box p={[0, -0.2, 0]} s={[0.17, 0.42, 0.19]} m={M.suit} shadow />
            <Box p={[0, -0.47, 0.04]} s={[0.2, 0.14, 0.3]} m={M.suitDark} />
          </group>
        ))}
        {[
          [-0.36, 1.25],
          [0.36, 1.25],
        ].map(([x, y], i) => (
          <group key={i} ref={(g) => void (limbs.current[i + 2] = g)} position={[x, y, 0]}>
            <Box p={[0, -0.2, 0]} s={[0.13, 0.42, 0.14]} m={M.suit} shadow />
            <Box p={[0, -0.1, 0]} s={[0.145, 0.07, 0.155]} m={M.trim} />
            <Ball p={[0, -0.45, 0]} s={0.08} m={M.suitDark} />
          </group>
        ))}
        <mesh ref={filter} geometry={CYL} position={[0, 1, 0.48]} rotation={[0, 0, Math.PI / 2]} scale={[0.15, 0.4, 0.15]} material={M.trim} visible={false} />
        <mesh ref={patch} geometry={BOX} position={[0, 1, 0.48]} scale={[0.34, 0.26, 0.2]} material={M.hazard} visible={false} />
      </group>

      {/* ARIA */}
      <group ref={aria} position={[-5.2, 1.95, 1]}>
        <Ball p={[0, 0, 0]} s={0.24} m={M.hull} shadow />
        <Cyl p={[0, 0, 0.2]} r={[Math.PI / 2, 0, 0]} s={[0.12, 0.05, 0.12]} m={ARIA_EYE} />
        <Cyl p={[0, 0.3, 0]} s={[0.012, 0.16, 0.012]} m={M.dark} />
        <Ball p={[0, 0.39, 0]} s={0.03} m={ARIA_EYE} />
        <mesh ref={halo} rotation={[Math.PI / 2, 0, 0]} material={M.trim}>
          <torusGeometry args={[0.36, 0.025, 6, 24]} />
        </mesh>
      </group>

      {!demo && <primitive object={TRAIL} />}
      <group ref={markers}>
        {STATION_IDS.map((id) => (
          <mesh key={id} position={[STATIONS[id].x, 2.7, STATIONS[id].z]} scale={[0.2, 0.3, 0.2]} material={MAIN_MARK} visible={false}>
            <octahedronGeometry args={[1, 0]} />
          </mesh>
        ))}
      </group>
    </>
  );
}
