"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { isAurora, isFlare, isStorm, START_OF_DAY } from "@/engine/simulate";
import { areaOf } from "@/engine/world";
import { useGame } from "@/store/game";
import { Base } from "./Base";
import { Crew } from "./Crew";
import { M } from "./parts";

// The world around the outpost: sky, sun, dust, ground and camera.
//
// Performance rules for the 3D scene: everything static is built once at
// module scope, and everything that moves is mutated through refs inside
// useFrame. Nothing here causes a React re-render after mount.

const { damp, lerp, smoothstep } = THREE.MathUtils;

/** Seeded random numbers so the landscape is the same on every load. */
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = seeded(11);

/** Flat where the astronaut can walk, rolling hills further out. */
function groundHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  const hills = 3.4 * Math.sin(x * 0.045 + 1.3) * Math.cos(z * 0.05) + 1.7 * Math.sin(x * 0.11 + z * 0.07) + 0.7 * Math.sin(x * 0.23 - z * 0.19 + 2);
  return smoothstep(r, 26, 80) * hills + smoothstep(r, 23, 30) * 0.14 * Math.sin(x * 0.9) * Math.sin(z * 0.8);
}

const TERRAIN = new THREE.PlaneGeometry(440, 440, 176, 176).rotateX(-Math.PI / 2);
for (let i = 0, p = TERRAIN.attributes.position; i < p.count; i++) p.setY(i, groundHeight(p.getX(i), p.getZ(i)));

const ROCKS = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), M.rock, 200);
for (let i = 0, m = new THREE.Object3D(); i < ROCKS.count; i++) {
  const angle = rand() * Math.PI * 2;
  const r = 22.5 + rand() ** 2 * 90; // just beyond where the astronaut can walk
  const size = 0.15 + rand() ** 3 * 1.5;
  m.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r);
  m.position.y = groundHeight(m.position.x, m.position.z) + size * 0.3;
  m.rotation.set(rand() * 3, rand() * 3, rand() * 3);
  m.scale.set(size, size * (0.5 + rand() * 0.5), size);
  m.updateMatrix();
  ROCKS.setMatrixAt(i, m.matrix);
}
ROCKS.castShadow = true;

const DUST_COUNT = 900;
const DUST = new Float32Array(DUST_COUNT * 3);
for (let i = 0; i < DUST_COUNT; i++) DUST.set([rand() * 70 - 35, 0.2 + rand() * 10, rand() * 60 - 30], i * 3);

// A soft round dot, so dust motes are not drawn as squares.
const MOTE = new THREE.DataTexture(
  Uint8Array.from({ length: 16 * 16 * 4 }, (_, i) => (i % 4 < 3 ? 255 : 255 * smoothstep(1 - Math.hypot(((i >> 2) % 16) - 7.5, (i >> 6) - 7.5) / 8, 0, 0.6))),
  16,
  16,
);
MOTE.needsUpdate = true;

const STARS = new Float32Array(700 * 3);
for (let i = 0; i < 700; i++) {
  const v = new THREE.Vector3().setFromSphericalCoords(400, Math.acos(rand() * 0.98), rand() * Math.PI * 2);
  STARS.set([v.x, v.y, v.z], i * 3);
}

// Sky colours. A Martian day is butterscotch; the glow around a low sun is blue.
const DAY_HORIZON = new THREE.Color("#e2b47c");
const DAY_ZENITH = new THREE.Color("#8f6a4a");
const NIGHT_HORIZON = new THREE.Color("#120c0b");
const NIGHT_ZENITH = new THREE.Color("#030305");
const STORM_HAZE = new THREE.Color("#7a4f33");
const LOW_SUN = new THREE.Color("#ffb48a");
const HIGH_SUN = new THREE.Color("#fff1dc");
const NIGHT_FILL = new THREE.Color("#55648f");
const DAY_FILL = new THREE.Color("#e6c9a3");
const WARM = new THREE.Color("#ffe2b8");
const ALARM = new THREE.Color("#ff3b1f");
const FLARE_LIGHT = new THREE.Color("#f3e9ff");
const AURORA = new THREE.Color("#4fe08a");

const SKY = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  depthWrite: false,
  fog: false,
  uniforms: {
    uHorizon: { value: new THREE.Color() },
    uZenith: { value: new THREE.Color() },
    uSun: { value: new THREE.Vector3() },
    uGlow: { value: 0 },
    uDisc: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec3 vDir;
    void main() {
      vDir = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uHorizon, uZenith, uSun;
    uniform float uGlow, uDisc;
    varying vec3 vDir;
    void main() {
      vec3 d = normalize(vDir);
      vec3 col = mix(uHorizon, uZenith, pow(clamp(d.y, 0.0, 1.0), 0.45));
      float toSun = max(dot(d, uSun), 0.0);
      col += vec3(0.10, 0.30, 0.75) * (pow(toSun, 6.0) * 0.7 + pow(toSun, 60.0)) * uGlow;
      col += vec3(1.0, 0.93, 0.8) * smoothstep(0.9993, 0.9997, toSun) * uDisc;
      gl_FragColor = vec4(col, 1.0);
      #include <colorspace_fragment>
    }`,
});

/** The point the title screen's camera looks at and sways around. */
const TITLE_AIM = new THREE.Vector3(1.5, 0.8, 0.5);
const UP = new THREE.Vector3(0, 1, 0);

type Props = {
  /** Freeze the clock at this hour (0–24) and hold a cinematic camera. Used by the title screen. */
  fixedHour?: number;
};

function World({ fixedHour }: Props) {
  const demo = fixedHour !== undefined;
  // On narrow screens the HUD covers the top of the scene, so pull back and
  // aim past the astronaut to keep them in the clear area.
  const narrow = useThree((s) => s.size.width < s.size.height * 1.3);
  const walkTo = useGame((s) => s.walkTo);

  const sun = useRef<THREE.DirectionalLight>(null!);
  const fill = useRef<THREE.HemisphereLight>(null!);
  const cabin = useRef<THREE.Group>(null!);
  const fog = useRef<THREE.FogExp2>(null!);
  const stars = useRef<THREE.PointsMaterial>(null!);
  const dust = useRef<THREE.Points>(null!);
  const storm = useRef(0);
  const flare = useRef(0);
  const aurora = useRef(0);
  const zoom = useRef(1);
  const titleView = useRef<THREE.Vector3 | null>(null);
  const [still] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);

  useFrame(({ camera, clock }, delta) => {
    const { sim, player } = useGame.getState();
    const t = clock.elapsedTime;
    const dayFraction = demo ? fixedHour / 24 : (sim.sol + START_OF_DAY) % 1;
    storm.current = damp(storm.current, !demo && isStorm(sim.sol) ? 1 : 0, 1.2, delta);
    const haze = storm.current;

    // Sun: rises in +x at 06:00, sets in -x at 18:00. In play its path leans
    // toward the camera so the outpost is lit; the title screen leans it away
    // so the sunset sits behind the outpost.
    const angle = (dayFraction - 0.25) * Math.PI * 2;
    const dir = SKY.uniforms.uSun.value.set(Math.cos(angle), Math.sin(angle), demo ? -0.35 : 0.35).normalize();
    const day = smoothstep(dir.y, -0.12, 0.25);

    const horizon = SKY.uniforms.uHorizon.value.copy(NIGHT_HORIZON).lerp(DAY_HORIZON, day);
    const zenith = SKY.uniforms.uZenith.value.copy(NIGHT_ZENITH).lerp(DAY_ZENITH, day);
    horizon.lerp(STORM_HAZE, haze * 0.85 * (0.15 + 0.85 * day));
    zenith.lerp(STORM_HAZE, haze * 0.85 * (0.15 + 0.85 * day));
    SKY.uniforms.uGlow.value = smoothstep(dir.y, -0.3, 0) * (1 - smoothstep(dir.y, 0.05, 0.5)) * (1 - haze);
    SKY.uniforms.uDisc.value = dir.y > -0.03 ? 1 - haze : 0;

    fog.current.color.copy(horizon);
    fog.current.density = lerp(0.009, 0.03, haze);
    sun.current.position.copy(dir).multiplyScalar(60);
    sun.current.intensity = 3.2 * smoothstep(dir.y, -0.02, 0.3) * (1 - 0.75 * haze);
    sun.current.color.copy(LOW_SUN).lerp(HIGH_SUN, smoothstep(dir.y, 0, 0.5));
    fill.current.color.copy(NIGHT_FILL).lerp(DAY_FILL, day);
    fill.current.intensity = lerp(0.9, 1.1, day) * (1 - 0.35 * haze);

    // The solar flare washes the yard in hard white light. The night after it,
    // the aurora overhead tints everything green. Both swell slowly: no flashing.
    flare.current = damp(flare.current, !demo && isFlare(sim.sol) ? 1 : 0, 2, delta);
    aurora.current = damp(aurora.current, !demo && isAurora(sim.sol) ? 1 : 0, 0.8, delta);
    fill.current.color.lerp(FLARE_LIGHT, flare.current * 0.7).lerp(AURORA, aurora.current * (0.55 + 0.25 * Math.sin(t * 0.9)));
    fill.current.intensity += 0.9 * flare.current * (0.8 + 0.2 * Math.sin(t * 3)) + 0.5 * aurora.current;
    stars.current.opacity = (1 - day) * (1 - haze);

    // Cabin lights: a red alarm until the main switch is on, then warm and steady.
    const on = demo || sim.work.power === 0;
    for (const light of cabin.current.children as THREE.PointLight[]) {
      light.color.lerp(on ? WARM : ALARM, Math.min(1, 6 * delta));
      light.intensity = damp(light.intensity, on ? 26 * (1.25 - 0.55 * day) : 9 * (0.5 + 0.5 * Math.sin(t * 5)), 8, delta);
    }

    // Dust drifts downwind and wraps around.
    const speed = (1.2 + 11 * haze) * delta;
    const p = dust.current.geometry.attributes.position;
    for (let i = 0; i < DUST_COUNT; i++) {
      const x = p.getX(i) + speed * (0.6 + (i % 7) * 0.1);
      p.setX(i, x > 35 ? x - 70 : x);
    }
    p.needsUpdate = true;
    const motes = dust.current.material as THREE.PointsMaterial;
    motes.opacity = 0.22 + 0.6 * haze;
    motes.size = 0.1 + 0.08 * haze;

    // The camera looks down from the south and follows the astronaut, pulling back outdoors.
    if (!demo) {
      zoom.current = damp(zoom.current, (narrow ? 1.6 : 1) * (areaOf(player) === "outside" ? 1.25 : 1), 3, delta);
      const k = zoom.current;
      camera.position.x = damp(camera.position.x, player.x, 5, delta);
      camera.position.z = damp(camera.position.z, player.z + 8.5 * k, 5, delta);
      camera.position.y = 11.5 * k;
      camera.lookAt(camera.position.x, 0.8, camera.position.z - 8.5 * k + (narrow ? -4 : 1));
    } else if (!still) {
      // The title screen sways slowly around the outpost, never far enough to see its unlit side.
      titleView.current ??= camera.position.clone();
      camera.position.copy(titleView.current).sub(TITLE_AIM).applyAxisAngle(UP, Math.sin(clock.elapsedTime * 0.12) * 0.28).add(TITLE_AIM);
      camera.lookAt(TITLE_AIM);
    }
  });

  return (
    <>
      <fogExp2 ref={fog} attach="fog" args={["#120c0b", 0.009]} />
      <mesh material={SKY}>
        <sphereGeometry args={[450, 32, 16]} />
      </mesh>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[STARS, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={stars} color="#fff4e6" size={1.6} sizeAttenuation={false} transparent depthWrite={false} fog={false} />
      </points>
      <points ref={dust} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[DUST, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#e0b48a" map={MOTE} size={0.1} transparent depthWrite={false} />
      </points>

      <hemisphereLight ref={fill} groundColor="#3b1f14" />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
        shadow-camera-far={140}
        shadow-bias={-0.0006}
      />
      <group ref={cabin}>
        {[-3.4, 3.4].map((x) => (
          <pointLight key={x} position={[x, 2.5, 0.2]} distance={13} intensity={0} color="#ff3b1f" />
        ))}
      </group>

      <mesh geometry={TERRAIN} receiveShadow>
        <meshStandardMaterial color="#9c4f2e" roughness={1} flatShading />
      </mesh>
      <primitive object={ROCKS} />

      {/* Tap or click the ground to walk there. */}
      {!demo && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.07, 0]} onPointerDown={(e) => walkTo({ x: e.point.x, z: e.point.z })}>
          <planeGeometry args={[60, 60]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      <Base demo={demo} />
      <Crew demo={demo} />
    </>
  );
}

/** The outpost on the Martian surface. Reads live game state from the store each frame. */
export function Outpost({ fixedHour }: Props) {
  return (
    <Canvas
      flat
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ position: [13, 7.5, 16], fov: 40, far: 1000 }}
      onCreated={({ camera, size }) => {
        // The title screen's fixed view. Narrow screens stand further back to fit the outpost.
        camera.position.multiplyScalar(THREE.MathUtils.clamp(1.6 / (size.width / size.height), 1, 1.9));
        camera.lookAt(TITLE_AIM);
      }}
      aria-label="The outpost on the surface of Mars"
      role="img"
    >
      <World fixedHour={fixedHour} />
    </Canvas>
  );
}
