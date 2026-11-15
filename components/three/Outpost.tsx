"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SCENE } from "@/engine/story";

// three.js is most of the game's download, so the scene loads after the page:
// the HUD and the title work while it arrives. The loader sits behind the
// canvas, which is see-through until its first frame covers it, so the scene
// appears with no jump.
const load = () => import("./World");
// Start the download as this file runs, before React hydrates, so it does not wait in line behind hydration.
if (typeof window !== "undefined") void load();
const World = dynamic(load, { ssr: false });

/** The outpost on the Martian surface, with a dusk sky and ARIA holding its place until the first frame. */
export function Outpost({ fixedHour }: { fixedHour?: number }) {
  const [ready, setReady] = useState(false);
  return (
    <div className="absolute inset-0">
      {!ready && (
        <div className="fade-late absolute inset-0 flex flex-col items-center gap-3 pt-[30vh] bg-linear-to-b from-dusk via-umber to-regolith/70">
          <div className="orb" aria-hidden />
          <p role="status" className="font-display text-xl text-sand/80">
            {SCENE.loading}
          </p>
        </div>
      )}
      <World fixedHour={fixedHour} onReady={() => setReady(true)} />
    </div>
  );
}
