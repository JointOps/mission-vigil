import * as THREE from "three";

// Building blocks for the low-poly scene. One unit box, cylinder and sphere are
// scaled into every prop, so the scene holds three geometries instead of hundreds.

export const BOX = new THREE.BoxGeometry(1, 1, 1);
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 14);
export const BALL = new THREE.SphereGeometry(1, 14, 10);

export const flat = (color: string, roughness = 0.85, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
/** A dark surface that gives off light. Change `emissive` and `emissiveIntensity` to animate it. */
export const glow = (color: string, intensity = 0) => new THREE.MeshStandardMaterial({ color: "#161210", emissive: color, emissiveIntensity: intensity });

export const M = {
  hull: flat("#e9dfcf"),
  wall: flat("#d8ccb8"),
  floor: flat("#bfb4a2"),
  floorDark: flat("#9a9080"),
  trim: flat("#b5613a", 0.7),
  dark: flat("#3d3530", 0.9),
  metal: flat("#8d8f94", 0.45, 0.6),
  rubber: flat("#211d1b", 1),
  hazard: flat("#f2c230", 0.7),
  blue: flat("#3f6ea3", 0.7),
  soil: flat("#4a2c1c", 1),
  leaf: flat("#5fae5a", 0.8),
  cloth: flat("#f4efe6", 0.95),
  path: flat("#7a3f26", 1),
  rock: flat("#6e3a24", 1),
  glass: new THREE.MeshStandardMaterial({ color: "#9fd3ee", roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.4 }),
  suit: flat("#f4efe6", 0.6),
  suitDark: flat("#55504c", 0.8),
  skin: flat("#b98562"),
  hair: flat("#2b1d16"),
  visor: new THREE.MeshStandardMaterial({ color: "#d9a441", roughness: 0.2, metalness: 0.85 }),
} as const;

type V3 = [number, number, number];
type Part = {
  /** Centre. */
  p: V3;
  /** Size: width, height, depth for a box; radius, height, radius for a cylinder; radius (or three radii) for a ball. */
  s: V3 | number;
  m: THREE.Material;
  /** Rotation in radians. */
  r?: V3;
  shadow?: boolean;
};

const part = (geometry: THREE.BufferGeometry) =>
  function Part({ p, s, m, r, shadow }: Part) {
    return <mesh geometry={geometry} position={p} scale={s} rotation={r} material={m} castShadow={shadow} receiveShadow />;
  };
export const Box = part(BOX);
export const Cyl = part(CYL);
export const Ball = part(BALL);
