"use client";

import { useEffect } from "react";
import { type Ambience, ambience, radio, sfx, wake } from "@/components/sound";
import { Outpost } from "@/components/three/Outpost";
import { Debrief } from "@/components/ui/Debrief";
import { Controls, Hud } from "@/components/ui/Hud";
import { type Failure, isFlare, isOver, isStorm, jobs } from "@/engine/simulate";
import { FACT_IDS, FAILURES } from "@/engine/story";
import { areaOf } from "@/engine/world";
import { type GameState, useGame } from "@/store/game";

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
/** Which line of ARIA's "earth" message is Earth's own voice on the radio. */
const EARTH_SPEAKS = 2;

/** The background sound for a moment of play: silent when muted, paused or over. */
function ambienceOf(g: GameState): Ambience | null {
  if (g.muted || g.paused || isOver(g.sim)) return null;
  const outside = areaOf(g.player) === "outside";
  const { alloc, work, sol } = g.sim;
  const machines = alloc.scrubber + alloc.oxygen + alloc.heater;
  return {
    // The storm howls; indoors the walls muffle it.
    wind: (isStorm(sol) ? 1 : 0.35) * (outside ? 1 : 0.4),
    outside,
    // The base hums once the power is on, louder with more machines running.
    hum: work.power > 0 ? 0 : Math.min(1, 0.3 + machines * 0.15) * (outside ? 0.25 : 1),
    // The radiation counter clicks fastest outside, and calms behind the bag shelter.
    clicks: !isFlare(sol) ? 0 : outside ? 1 : work.bags > 0 ? 0.45 : 0.15,
  };
}

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
      // Typing in a box, or any key in an open window (where Escape closes it), is not for the game.
      // Key releases always count, so a key held while a window opens does not keep the astronaut walking.
      if (down && e.target instanceof Element && e.target.closest("input, dialog")) return;
      const game = useGame.getState();
      // A held Enter would press every button that takes the focus next, skipping the end cards unread.
      if (down && e.repeat && USE.includes(e.code) && e.target instanceof HTMLButtonElement) return e.preventDefault();
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
      ambience(ambienceOf(now));
      if (now.muted) return;
      if (now.line !== before.line && now.line === EARTH_SPEAKS && now.sim.message === "earth") return radio();
      if (now.sim.failure && !before.sim.failure) {
        sfx("fail");
        navigator.vibrate?.(400);
      }
      else if (now.sim.won && !before.sim.won) sfx("win");
      else if (now.sim.secrets.length > before.sim.secrets.length) sfx("secret");
      else if (now.sim.said !== before.sim.said) {
        const alarm = ALERTS.includes(now.sim.message);
        sfx(alarm ? "alert" : "talk");
        // A short double buzz on phones that can (Android); others ignore it. Sound off turns it off too.
        if (alarm) navigator.vibrate?.([120, 80, 120]);
      }
      else if (now.sim.upgrades.length > before.sim.upgrades.length) sfx("buy");
      else if (now.sim.earned > before.sim.earned) sfx("done");
      else if (now.line !== before.line || now.sim.alloc !== before.sim.alloc || now.sim.carrying !== before.sim.carrying) sfx("tap");
    });

    // In development the store and the job list are on `window`, for the play-through script and for poking from the console.
    // `?end=win`, or a failure such as `?end=cold`, jumps straight to the end screen to check it without playing.
    // The production build replaces NODE_ENV and drops this whole block.
    if (process.env.NODE_ENV !== "production") {
      Object.assign(window, { vigil: useGame, vigilJobs: jobs });
      const end = new URLSearchParams(location.search).get("end");
      const sim = useGame.getState().sim;
      if (end === "win") useGame.setState({ sim: { ...sim, won: true, sol: 5, safeSols: 3, earned: 970, facts: FACT_IDS.slice(0, 17), secrets: ["stargazer", "planner"] } });
      else if (end && end in FAILURES) useGame.setState({ sim: { ...sim, failure: end as Failure } });
    }

    // Browsers only let sound start after the player clicks or presses a key.
    const start = () => {
      wake();
      ambience(ambienceOf(useGame.getState()));
    };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    window.addEventListener("blur", release);
    return () => {
      cancelAnimationFrame(frame);
      quiet();
      ambience(null);
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
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
