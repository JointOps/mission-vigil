"use client";

import { useEffect } from "react";
import { sfx } from "@/components/sound";
import { Outpost } from "@/components/three/Outpost";
import { Debrief } from "@/components/ui/Debrief";
import { Controls, Hud } from "@/components/ui/Hud";
import { jobs } from "@/engine/simulate";
import { useGame } from "@/store/game";

/** Walking keys and the direction each one pushes: x is east, z is south. */
const WALK: Record<string, readonly [x: number, z: number]> = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};
const USE = ["KeyE", "Space", "Enter"];
const ALERTS = ["storm", "filter", "leak", "suit", "flare"];

/** A playable chapter: the 3D outpost, the HUD over it, and the loop that drives the simulation. */
export function Game() {
  useEffect(() => {
    let last = performance.now();
    let frame = requestAnimationFrame(function loop(now) {
      // Cap the step so a background tab can't jump the simulation forward.
      useGame.getState().tick(Math.min((now - last) / 1000, 0.1));
      last = now;
      frame = requestAnimationFrame(loop);
    });

    const held = new Set<string>();
    const steer = () => {
      let x = 0;
      let z = 0;
      for (const code of held) {
        x += WALK[code][0];
        z += WALK[code][1];
      }
      useGame.getState().steer(x, z);
    };
    const onKey = (e: KeyboardEvent) => {
      const down = e.type === "keydown";
      const game = useGame.getState();
      if (e.code in WALK) {
        e.preventDefault();
        if (down) held.add(e.code);
        else held.delete(e.code);
        steer();
      } else if (down && !e.repeat) {
        // Space and Enter already press a focused button, so only E is handled there.
        const onButton = e.target instanceof HTMLButtonElement && e.code !== "KeyE";
        if (USE.includes(e.code) && !onButton) {
          e.preventDefault();
          game.interact();
        } else if (e.code === "KeyP" || e.code === "Escape") game.togglePause();
      }
    };
    const release = () => {
      held.clear();
      steer();
    };

    // Sounds follow what changed in the game.
    const quiet = useGame.subscribe((now, before) => {
      if (now.muted) return;
      if (now.sim.failure && !before.sim.failure) sfx("fail");
      else if (now.sim.won && !before.sim.won) sfx("win");
      else if (now.sim.said !== before.sim.said) sfx(ALERTS.includes(now.sim.message) ? "alert" : "talk");
      else if (now.sim.upgrades.length > before.sim.upgrades.length) sfx("buy");
      else if (now.sim.earned > before.sim.earned) sfx("done");
      else if (now.line !== before.line || now.sim.alloc !== before.sim.alloc || now.sim.carrying !== before.sim.carrying) sfx("tap");
    });

    // In development the store and the job list are on `window`, for the play-through script and for poking from the console.
    if (process.env.NODE_ENV !== "production") Object.assign(window, { vigil: useGame, vigilJobs: jobs });

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", release);
    return () => {
      cancelAnimationFrame(frame);
      quiet();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
      window.removeEventListener("blur", release);
      release();
      useGame.getState().restart();
    };
  }, []);

  return (
    <main className="relative flex h-dvh flex-col overflow-hidden">
      <div className="relative min-h-0 flex-1">
        <Outpost />
        <Hud />
      </div>
      <Controls />
      <Debrief />
    </main>
  );
}
