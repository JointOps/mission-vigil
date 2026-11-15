"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type BadgeId, badges, finalCheck, reportCard } from "@/engine/scoring";
import { MAX_PARTS, o2Pct } from "@/engine/simulate";
import { BADGES, CERTIFICATE, FACT_IDS, FACTS, FAILURES, type Question, QUIZ, RANKS, SUCCESS } from "@/engine/story";
import { useGame } from "@/store/game";

const PRIMARY = "rounded-xl bg-sunset px-4 py-2 font-display text-lg font-bold text-dusk hover:bg-sand";
const SECONDARY = "rounded-xl border border-sand/30 px-4 py-2 font-display text-lg hover:border-sunset hover:text-sunset";
const BEST_KEY = "mission-vigil:chapter-1:best";
const BADGE_IDS = Object.keys(BADGES) as BadgeId[];

function Failed() {
  const sim = useGame((s) => s.sim);
  const rewind = useGame((s) => s.rewind);
  const restart = useGame((s) => s.restart);
  const debrief = FAILURES[sim.failure!];
  const check = QUIZ.find((q) => q.about === sim.failure);
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
      {check && (
        <div className="border-t border-sand/15 pt-3">
          <p className="font-display text-xl text-sunset">Quick check before you go again</p>
          <Ask key={check.prompt} question={check} />
        </div>
      )}
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

/** One question. A wrong answer is crossed out and the player picks again; `onDone` hears whether the first pick was right. */
function Ask({ question, onDone }: { question: Question; onDone?: (firstTry: boolean) => void }) {
  const [wrong, setWrong] = useState<readonly number[]>([]);
  const [solved, setSolved] = useState(false);
  const pick = (choice: number) => {
    if (choice !== question.answer) return setWrong([...wrong, choice]);
    setSolved(true);
    onDone?.(wrong.length === 0);
  };
  return (
    <div>
      <p className="text-lg font-semibold">{question.prompt}</p>
      <div className="mt-2 flex flex-col gap-2">
        {question.choices.map((choice, c) => {
          const tone = solved && c === question.answer ? "border-safe bg-safe/15" : wrong.includes(c) ? "border-flare/60 text-sand/50 line-through" : solved ? "border-sand/15 text-sand/50" : "border-sand/30 hover:border-sunset";
          return (
            <button key={choice} type="button" disabled={solved || wrong.includes(c)} onClick={() => pick(c)} className={`rounded-md border-2 px-3 py-2 text-left text-lg ${tone}`}>
              {choice}
            </button>
          );
        })}
      </div>
      <p className="mt-2 min-h-12" role="status">
        {solved ? (
          <>
            <strong className="text-safe">{wrong.length === 0 ? "Yes!" : "That is it."}</strong> {question.why}
          </>
        ) : (
          wrong.length > 0 && <strong className="text-sulfur">Not quite. Try another one!</strong>
        )}
      </p>
    </div>
  );
}

/** The final check with Earth: five questions, one at a time. A right first pick earns a wing. */
function FinalCheck({ onDone }: { onDone: (wings: number) => void }) {
  const [questions] = useState(() => finalCheck(useGame.getState().sim.facts));
  const [at, setAt] = useState(0);
  const [wings, setWings] = useState(0);
  const [solved, setSolved] = useState(false);
  const last = at === questions.length - 1;
  const next = () => {
    if (last) return onDone(wings);
    setAt(at + 1);
    setSolved(false);
  };
  return (
    <section className="rounded-md border border-sunset/50 p-4" aria-label="Final check with Earth">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-2xl font-semibold text-sunset">Earth calling: your final check</h3>
        <p className="font-display text-xl text-sulfur" role="img" aria-label={`${wings} wings so far`}>
          {"✦".repeat(wings)}
          <span className="text-sand/25">{"✦".repeat(questions.length - wings)}</span>
        </p>
      </div>
      <p className="mb-2 text-sm text-sand/70">
        Question {at + 1} of {questions.length}. Take your time. A right first pick earns a wing.
      </p>
      <Ask
        key={at}
        question={questions[at]}
        onDone={(firstTry) => {
          setSolved(true);
          if (firstTry) setWings(wings + 1);
        }}
      />
      <button type="button" onClick={next} disabled={!solved} className={`${PRIMARY} disabled:bg-sand/20 disabled:text-sand/50`}>
        {last ? "Finish training" : "Next question"}
      </button>
    </section>
  );
}

/** A certificate to print and sign by hand: no name is typed in or kept. */
function Certificate({ wings, rank, stars }: { wings: number; rank: string; stars: number }) {
  return (
    <section className="certificate rise rounded-md border-4 border-double border-sulfur p-5 text-center" aria-label="Your certificate">
      <p className="font-stencil text-xl uppercase">Mission Vigil: Junior Astronaut Mission Trainer</p>
      <p className="mt-6 border-b border-current pb-1 text-sm opacity-60">{CERTIFICATE.sign}</p>
      <p className="mt-3 text-lg">{CERTIFICATE.line}</p>
      <h3 className="mt-2 font-display text-5xl font-bold">{CERTIFICATE.title}</h3>
      <p className="mt-2 font-display text-2xl">
        Rank: {rank} · {"★".repeat(stars)} · {wings} of 5 wings
      </p>
      <p className="mt-1 text-sm opacity-60">{new Date().toLocaleDateString()}</p>
      <button type="button" onClick={() => window.print()} className={`${SECONDARY} mt-4 print:hidden`}>
        Print my certificate
      </button>
    </section>
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
  const [wings, setWings] = useState<number | null>(null);
  return (
    <>
      <p className="pop font-display text-6xl leading-none text-sulfur" role="img" aria-label={`${card.stars} of 3 stars`}>
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

      {wings === null ? <FinalCheck onDone={setWings} /> : <Certificate wings={wings} rank={RANKS[card.rank]} stars={card.stars} />}

      {/* The collections stay folded, so the end screen is the result, the final check and one button. */}
      <details>
        <summary className="cursor-pointer font-display text-2xl font-semibold hover:text-sunset">
          Your badges: {won.length} of {BADGE_IDS.length}
        </summary>
        <ul className="mt-2 grid gap-2 sm:grid-cols-3">
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
      </details>

      <details>
        <summary className="cursor-pointer font-display text-2xl font-semibold hover:text-sunset">
          Your fact cards: {sim.facts.length} of {FACT_IDS.length}
        </summary>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
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
      </details>

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
      <div className="rise mx-auto flex max-w-2xl flex-col gap-4 rounded-3xl border border-sand/15 bg-dusk/95 p-5 md:p-8">{failed ? <Failed /> : <Passed />}</div>
    </div>
  );
}
