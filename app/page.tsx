import type { Metadata } from "next";
import Link from "next/link";
import { Outpost } from "@/components/three/Outpost";
import { Icon } from "@/components/ui/Icon";
import { SpaceView } from "@/components/ui/SpaceView";
import { CHAPTERS, DESCRIPTION, NAME, REPO, SITE, TITLE } from "@/engine/story";

/** Chapter numbers read like mission codes: 01, 02… */
const code = (i: number) => String(i + 1).padStart(2, "0");

export const metadata: Metadata = { alternates: { canonical: "/" } };

// Tells search engines and AI assistants what this page is. Every field is a plain fact about the game.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: NAME,
  url: SITE,
  description: DESCRIPTION,
  image: `${SITE}/opengraph-image.jpg`,
  genre: ["Educational game", "Simulation"],
  gamePlatform: "Web browser",
  applicationCategory: "Game",
  operatingSystem: "Any",
  inLanguage: "en",
  isAccessibleForFree: true,
  audience: { "@type": "EducationalAudience", educationalRole: "student" },
  about: ["Mars", "Life support", "Space radiation", "Solar power"],
  author: { "@type": "Organization", name: "Team JointOps", url: REPO },
  license: "https://opensource.org/licenses/MIT",
  trailer: {
    "@type": "VideoObject",
    name: `${NAME}: 30-second trailer`,
    description: "Real gameplay: the astronaut wakes the base, shares the power, rides out a dust storm, hides from a solar flare and answers the call from Earth.",
    contentUrl: `${SITE}/media/trailer.mp4`,
    thumbnailUrl: `${SITE}/media/title.jpg`,
    uploadDate: "2026-11-15",
    duration: "PT30S",
  },
};

export default function Home() {
  return (
    <main className="relative h-dvh overflow-hidden">
      {/* Escaping "<" keeps any text in the data from closing the script tag. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {/* Just before sunset, when the sky around the sun turns blue on Mars. */}
      <Outpost fixedHour={17.7} />
      <div className="pointer-events-none relative flex h-full flex-col justify-between gap-4 bg-linear-to-t from-dusk via-dusk/20 to-transparent p-5 md:p-10">
        <div className="flex items-start justify-between gap-6">
          <header>
            <h1 className="stamp font-stencil text-[clamp(4rem,12vw,9rem)] leading-[0.82] font-black uppercase">
              {TITLE.name[0]}
              <br />
              {TITLE.name[1]}
            </h1>
            <p className="mt-3 font-display text-2xl md:text-3xl">{TITLE.subtitle}</p>
          </header>
          {/* Where Earth is today, for real: the whole story is the way home. */}
          <div className="pointer-events-auto hidden w-72 lg:block">
            <SpaceView brief />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="pointer-events-auto max-w-lg">
            <p className="font-display text-3xl font-bold text-sunset md:text-4xl">{TITLE.tagline}</p>
            <p className="mt-1 text-lg leading-snug md:text-xl">{TITLE.intro}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href="/play/1" className="rounded-xl bg-sunset px-7 py-3 font-display text-2xl font-bold text-dusk shadow-[0_0_32px_var(--color-sunset)] hover:bg-sand">
                {TITLE.start} →
              </Link>
              <a href={REPO} target="_blank" rel="noopener noreferrer" aria-label={TITLE.codeLabel} className="flex items-center gap-2 rounded-xl border border-sand/25 bg-dusk/60 px-4 py-3 font-display text-xl text-sand/85 hover:border-sand/50 hover:bg-dusk hover:text-sand">
                <Icon name="github" className="size-6" />
                {TITLE.code}
              </a>
            </div>
          </div>

          <ol className="pointer-events-auto -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1 md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0" aria-label={TITLE.chapters}>
            {CHAPTERS.map((chapter, i) => {
              const open = i === 0;
              const body = (
                <>
                  <p className="flex justify-between font-display text-sm tracking-wide text-sand/70">
                    <span>{TITLE.chapter(code(i))}</span>
                    {!open && <Icon name="lock" className="size-4" />}
                  </p>
                  <h2 className="font-display text-2xl leading-none font-bold uppercase">{chapter.name}</h2>
                  <p className="text-sm leading-snug text-sand/80">{chapter.teaser}</p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    {/* Each chapter is harder than the last. */}
                    <span className="flex gap-1" role="img" aria-label={TITLE.difficulty(i + 1, CHAPTERS.length)}>
                      {CHAPTERS.map((_, d) => (
                        <span key={d} className={`h-1.5 w-2.5 rounded-full ${d <= i ? "bg-sunset" : "bg-sand/20"}`} />
                      ))}
                    </span>
                    {!open && <span className="rounded-full bg-sand/15 px-2 py-0.5 font-display text-xs tracking-wide whitespace-nowrap uppercase">{TITLE.soon}</span>}
                  </div>
                </>
              );
              return (
                <li key={chapter.name} className="pop-in flex w-44 shrink-0 snap-start md:w-auto" style={{ animationDelay: `${400 + i * 90}ms` }}>
                  {open ? (
                    <Link href="/play/1" className="flex w-full flex-col gap-1.5 rounded-2xl border-2 border-sunset bg-dusk/85 p-3 hover:bg-dusk">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex w-full flex-col gap-1.5 rounded-2xl border border-dashed border-sand/25 bg-dusk/60 p-3 text-sand/70">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </main>
  );
}
