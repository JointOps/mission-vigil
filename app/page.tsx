import Link from "next/link";
import { Outpost } from "@/components/three/Outpost";
import { SOLS } from "@/engine/story";

export default function Home() {
  return (
    <main className="relative h-dvh overflow-hidden">
      {/* Just before sunset, when the sky around the sun turns blue on Mars. */}
      <div className="absolute inset-0">
        <Outpost fixedHour={17.7} />
      </div>
      <div className="pointer-events-none relative flex h-full flex-col justify-between bg-linear-to-t from-dusk via-transparent to-transparent p-5 md:p-10">
        <header>
          <h1 className="font-stencil text-[clamp(4.5rem,13vw,10rem)] leading-[0.82] font-black uppercase">
            Mission
            <br />
            Vigil
          </h1>
          <p className="mt-3 font-display text-2xl md:text-3xl">Junior astronaut mission trainer</p>
        </header>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="pointer-events-auto max-w-md">
            <p className="text-lg leading-snug md:text-xl">You wake up alone on Mars. The base is asleep and the air is going bad. Bring it back to life, and keep it alive for five sols.</p>
            <Link href="/play/1" className="mt-4 inline-block rounded-md bg-sunset px-6 py-3 font-display text-2xl font-bold text-dusk hover:bg-sand">
              Start the mission
            </Link>
          </div>
          <ol className="grid grid-cols-2 gap-x-6 gap-y-1 font-display text-lg md:grid-cols-1 md:text-xl" aria-label="The five sols of the mission">
            {SOLS.map((sol, i) => (
              <li key={sol.title}>
                <span className="mr-2 text-sand/60 tabular-nums">Sol {i + 1}</span>
                {sol.title}
                <span className="ml-2 hidden text-base text-sand/60 md:inline">{sol.focus}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}
