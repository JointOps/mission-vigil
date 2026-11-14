"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type BadgeId, badges, reportCard } from "@/engine/scoring";
import { MAX_PARTS, o2Pct } from "@/engine/simulate";
import { BADGES, FACT_IDS, FACTS, FAILURES, QUIZ, RANKS, SUCCESS } from "@/engine/story";
import { useGame } from "@/store/game";

const PRIMARY = "rounded-md bg-sunset px-4 py-2 font-display text-lg font-bold text-dusk hover:bg-sand";
const SECONDARY = "rounded-md border border-sand/30 px-4 py-2 font-display text-lg hover:border-sunset hover:text-sunset";
const BEST_KEY = "mission-vigil:chapter-1:best";
const BADGE_IDS = Object.keys(BADGES) as BadgeId[];

function Failed() {
  const sim = useGame((s) => s.sim);
  const rewind = useGame((s) => s.rewind);
  const restart = useGame((s) => s.restart);
  const debrief = FAILURES[sim.failure!];
  return (
    <>
      <p className="font-display text-xl text-flare">Mission stopped</p>
      <h2 id="debrief-title" className="font-display text-5xl font-bold leading-none">
        {debrief.title}
      </h2>
      <p className="text-lg">{debrief.body}</p>
      {sim.failure === "co2" && <p className="text-xl text-sunset">Look: there was still oxygen left, {o2Pct(sim).toFixed(1)}%. The CO₂ got you first.</p>}
      <p className="border-l-4 border-safe pl-3 text-lg">
        <strong>Try this:</strong> {debrief.lesson}
      </p>
      <p className="text-sand/80">
        {debrief.story}{" "}
        <a href={debrief.source.url} target="_blank" rel="noreferrer" className="underline hover:text-sunset">
          {debrief.source.label}
        </a>
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={rewind} className={PRIMARY} autoFocus>
          Try again from ARIA&apos;s last message
        </button>
        <button type="button" onClick={restart} className={SECONDARY}>
          Start the chapter again
        </button>
      </div>
    </>
  );
}

function Quiz() {
  const [picked, setPicked] = useState<readonly (number | undefined)[]>([]);
  return (
    <ol className="flex flex-col gap-4">
      {QUIZ.map((q, i) => (
        <li key={q.prompt}>
          <p className="font-semibold">{q.prompt}</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {q.choices.map((choice, c) => {
              const answered = picked[i] !== undefined;
              const tone = !answered ? "border-sand/30 hover:border-sunset" : c === q.answer ? "border-safe bg-safe/15" : c === picked[i] ? "border-flare bg-flare/15" : "border-sand/15 text-sand/50";
              return (
                <button key={choice} type="button" disabled={answered} onClick={() => setPicked((p) => Object.assign([...p], { [i]: c }))} className={`rounded-md border-2 px-3 py-1.5 text-left ${tone}`}>
                  {choice}
                </button>
              );
            })}
          </div>
          {picked[i] !== undefined && (
            <p className="mt-1.5 text-sm" role="status">
              <strong className={picked[i] === q.answer ? "text-safe" : "text-flare"}>{picked[i] === q.answer ? "Yes!" : "Not quite."}</strong> {q.why}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/** The best score so far, kept in this browser. */
function useBest(earned: number) {
  const [before] = useState(() => {
    try {
      return Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      return 0; // storage is blocked: play on without a best score
    }
  });
  useEffect(() => {
    try {
      if (earned > before) localStorage.setItem(BEST_KEY, String(earned));
    } catch {}
  }, [earned, before]);
  return before;
}

function Passed() {
  const sim = useGame((s) => s.sim);
  const restart = useGame((s) => s.restart);
  const card = reportCard(sim);
  const won = badges(sim);
  const before = useBest(sim.earned);
  return (
    <>
      <p className="font-display text-5xl leading-none text-sulfur" role="img" aria-label={`${card.stars} of 3 stars`}>
        {"★".repeat(card.stars)}
        <span className="text-sand/25">{"★".repeat(3 - card.stars)}</span>
      </p>
      <h2 id="debrief-title" className="font-display text-5xl font-bold leading-none">
        {SUCCESS.title}
      </h2>
      <p className="text-lg">{SUCCESS.body}</p>
      <dl className="grid grid-cols-3 gap-3 border-y border-sand/15 py-3 text-sm text-sand/70">
        {[
          [RANKS[card.rank], "your rank"],
          [`${sim.earned}`, `parts earned, out of ${MAX_PARTS}`],
          [`${card.safeAirPct}%`, "of the time the base was safe"],
        ].map(([value, label]) => (
          <div key={label}>
            <dd className="font-display text-3xl font-bold text-sand tabular-nums">{value}</dd>
            <dt>{label}</dt>
          </div>
        ))}
      </dl>
      <p className="text-sand/80">
        {sim.earned > before && before > 0 ? `New best! Your old best was ${before} parts. ` : before > 0 ? `Your best is ${before} parts. ` : ""}
        {card.stars < 3 ? "For 3 stars, keep the air good and the room warm 85% of the time. Watch the gauges: when the CO₂ is very low, move power from the air cleaner to the oxygen maker. " : ""}
        {card.rank < 2 ? "To be a Commander, do the blue jobs too." : ""}
      </p>

      <h3 className="font-display text-2xl font-semibold">
        Your badges: {won.length} of {BADGE_IDS.length}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-3">
        {BADGE_IDS.map((id) => (
          <li key={id} className={`rounded-md border p-2.5 text-sm ${won.includes(id) ? "border-safe/50" : "border-dashed border-sand/20 text-sand/60"}`}>
            <p className={`font-display text-lg ${won.includes(id) ? "text-safe" : ""}`}>
              <span aria-hidden>{won.includes(id) ? "★ " : "☆ "}</span>
              {BADGES[id].name}
              <span className="sr-only">{won.includes(id) ? " (won)" : " (not won yet)"}</span>
            </p>
            <p>{BADGES[id].how}</p>
          </li>
        ))}
      </ul>

      <h3 className="font-display text-2xl font-semibold">
        Your fact cards: {sim.facts.length} of {FACT_IDS.length}
      </h3>
      <ul className="grid gap-2 sm:grid-cols-2">
        {FACT_IDS.map((id) =>
          sim.facts.includes(id) ? (
            <li key={id} className="rounded-md border border-sulfur/40 p-2.5 text-sm">
              <p className="font-display text-lg text-sulfur">{FACTS[id].title}</p>
              <p>{FACTS[id].text}</p>
              <a href={FACTS[id].source.url} target="_blank" rel="noreferrer" className="text-sand/60 underline hover:text-sunset">
                {FACTS[id].source.label}
              </a>
            </li>
          ) : (
            <li key={id} className="rounded-md border border-dashed border-sand/20 p-2.5 text-sm text-sand/50">
              <p className="font-display text-lg">?</p>
              <p>Not found yet. Try the jobs you skipped.</p>
            </li>
          ),
        )}
      </ul>

      <h3 className="font-display text-2xl font-semibold">Quick quiz</h3>
      <Quiz />
      <p className="border-l-4 border-sunset pl-3 text-lg">{SUCCESS.next}</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={restart} className={PRIMARY}>
          Play again
        </button>
        <Link href="/" className={SECONDARY}>
          Back to the start
        </Link>
      </div>
    </>
  );
}

/** Shown when the chapter ends: what happened, why, and the real science behind it. */
export function Debrief() {
  const failed = useGame((s) => s.sim.failure !== null);
  const won = useGame((s) => s.sim.won);
  if (!failed && !won) return null;
  return (
    <div className="absolute inset-0 z-10 overflow-y-auto bg-dusk/70 p-3 backdrop-blur-sm md:p-8" role="dialog" aria-modal aria-labelledby="debrief-title">
      <div className="rise mx-auto flex max-w-2xl flex-col gap-4 rounded-md border border-sand/15 bg-dusk/95 p-5 md:p-8">{failed ? <Failed /> : <Passed />}</div>
    </div>
  );
}
