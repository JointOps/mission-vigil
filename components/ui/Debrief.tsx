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
function Ask({ question, onDone, focus }: { question: Question; onDone?: (firstTry: boolean) => void; focus?: boolean }) {
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
            <button key={choice} type="button" autoFocus={focus && c === 0} disabled={solved || wrong.includes(c)} onClick={() => pick(c)} className={`rounded-md border-2 px-3 py-2 text-left text-lg ${tone}`}>
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
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="debrief-title" className="font-display text-3xl font-bold text-sunset">
          Question {at + 1} of {questions.length}
        </h2>
        <p className="font-display text-2xl text-sulfur" role="img" aria-label={`${wings} wings so far`}>
          {"✦".repeat(wings)}
          <span className="text-sand/25">{"✦".repeat(questions.length - wings)}</span>
        </p>
      </div>
      <p className="-mt-2 text-sm text-sand/70">A right first pick earns a wing.</p>
      <Ask
        key={at}
        question={questions[at]}
        focus
        onDone={(firstTry) => {
          setSolved(true);
          if (firstTry) setWings(wings + 1);
        }}
      />
      {/* Keyed on `solved` so it takes the focus the moment it can be pressed. */}
      <button key={String(solved)} type="button" onClick={next} disabled={!solved} autoFocus={solved} className={`${PRIMARY} mt-auto self-end disabled:bg-sand/20 disabled:text-sand/50`}>
        {last ? "Finish the call" : "Next question"}
      </button>
    </>
  );
}

/** A certificate to print and sign by hand: no name is typed in or kept. */
function Certificate({ wings, rank, stars }: { wings: number; rank: string; stars: number }) {
  return (
    <section className="certificate rounded-md border-4 border-double border-sulfur p-4 text-center" aria-label="Your certificate">
      <p className="font-stencil text-lg uppercase">Mission Vigil: Junior Astronaut Mission Trainer</p>
      <p className="mt-4 border-b border-current pb-1 text-sm opacity-60">{CERTIFICATE.sign}</p>
      <p className="mt-2">{CERTIFICATE.line}</p>
      <h2 id="debrief-title" className="mt-1 font-display text-4xl font-bold">
        {CERTIFICATE.title}
      </h2>
      <p className="mt-1 font-display text-xl">
        Rank: {rank} · {"★".repeat(stars)} · {wings} of 5 wings
      </p>
      <p className="mt-1 text-sm opacity-60">{new Date().toLocaleDateString()}</p>
      <button type="button" onClick={() => window.print()} className="mt-2 text-sand/70 underline hover:text-sunset print:hidden">
        {SUCCESS.print}
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

type Loot = { readonly id: string; readonly icon: string; readonly name: string; readonly lit: boolean; readonly text: string; readonly source?: { readonly label: string; readonly url: string } };

/** A grid of things to collect. Tapping one shows what it is below the grid. */
function Collection({ title, items, columns, onPick }: { title: string; items: readonly Loot[]; columns: string; onPick: (item: Loot) => void }) {
  const lit = items.filter((i) => i.lit).length;
  return (
    <div>
      <h3 className="font-display text-xl">
        {title}: {lit} of {items.length}
      </h3>
      <ul className={`mt-1 grid gap-1.5 ${columns}`}>
        {items.map((item, i) => (
          <li key={item.id} className="pop-in" style={{ animationDelay: `${i * 40}ms` }}>
            <button
              type="button"
              aria-label={item.lit ? item.name : `${item.name}, not found yet`}
              onClick={() => onPick(item)}
              className={`flex h-11 w-full items-center justify-center gap-1 rounded-md border-2 px-1 font-display text-lg ${item.lit ? "border-sulfur/60 bg-sulfur/10 text-sulfur" : "border-dashed border-sand/20 text-sand/40"}`}
            >
              <span aria-hidden>{item.icon}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = 5;

/** The win screen: five short cards, one tap each, so nothing needs scrolling and the win comes first. */
function Passed() {
  const sim = useGame((s) => s.sim);
  const restart = useGame((s) => s.restart);
  const card = reportCard(sim);
  const won = badges(sim);
  const before = useBest(sim.earned);
  const [step, setStep] = useState(0);
  const [calling, setCalling] = useState(false);
  const [wings, setWings] = useState(0);
  const [open, setOpen] = useState<Loot | null>(null);
  const next = () => setStep(step + 1);
  const nextButton = (label: string) => (
    <button type="button" onClick={next} className={`${PRIMARY} mt-auto self-end`} autoFocus>
      {label} →
    </button>
  );
  const loot: Loot[] = [
    ...BADGE_IDS.map((id) => ({ id, icon: won.includes(id) ? "★" : "☆", name: BADGES[id].name, lit: won.includes(id), text: BADGES[id].how })),
    ...FACT_IDS.map((id) => ({ id, icon: sim.facts.includes(id) ? "✦" : "?", name: sim.facts.includes(id) ? FACTS[id].title : "Fact card", lit: sim.facts.includes(id), text: sim.facts.includes(id) ? FACTS[id].text : SUCCESS.missing, source: sim.facts.includes(id) ? FACTS[id].source : undefined })),
  ];
  const tip = card.stars < 3 ? SUCCESS.tipStars : card.rank < 2 ? SUCCESS.tipRank : SUCCESS.next;
  return (
    <>
      <div className="flex gap-1.5" role="progressbar" aria-label="End of mission" aria-valuemin={1} aria-valuemax={STEPS} aria-valuenow={step + 1}>
        {Array.from({ length: STEPS }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-sunset" : "bg-sand/20"}`} />
        ))}
      </div>

      <div key={`${step}-${calling}`} className="rise flex flex-1 flex-col gap-4" aria-live="polite">
        {step === 0 && (
          <>
            <p className="mt-4 text-center font-display text-7xl leading-none text-sulfur" role="img" aria-label={`${card.stars} of 3 stars`}>
              {[0, 1, 2].map((i) => (
                <span key={i} className={`pop-in inline-block ${i < card.stars ? "" : "text-sand/25"}`} style={{ animationDelay: `${300 + i * 350}ms` }}>
                  ★
                </span>
              ))}
            </p>
            <h2 id="debrief-title" className="text-center font-display text-5xl font-bold leading-none">
              {SUCCESS.title}
            </h2>
            <div className="flex items-start gap-3 rounded-2xl border-2 border-sunset/60 p-3">
              <div className="orb shrink-0" aria-hidden />
              <div>
                <p className="font-display text-lg text-sunset">ARIA</p>
                <p className="text-xl leading-snug">{SUCCESS.aria}</p>
              </div>
            </div>
            {nextButton(SUCCESS.toStats)}
          </>
        )}

        {step === 1 && (
          <>
            <h2 id="debrief-title" className="font-display text-4xl font-bold">
              {SUCCESS.statsTitle}
            </h2>
            {sim.earned > before && before > 0 && <p className="pop-in self-start rounded-full bg-sulfur px-3 py-1 font-display text-lg font-bold text-dusk">{SUCCESS.newBest}</p>}
            <dl className="flex flex-col gap-3">
              {[
                ["🏅", SUCCESS.rank, RANKS[card.rank]],
                ["⬢", SUCCESS.parts, `${sim.earned} of ${MAX_PARTS}`],
              ].map(([icon, label, value], i) => (
                <div key={label} className="pop-in flex items-center gap-3 rounded-xl border border-sand/15 bg-sand/5 p-3" style={{ animationDelay: `${i * 200}ms` }}>
                  <span className="w-10 text-center text-3xl text-sulfur" aria-hidden>
                    {icon}
                  </span>
                  <dt className="flex-1 text-lg text-sand/80">{label}</dt>
                  <dd className="font-display text-3xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
              <div className="pop-in rounded-xl border border-sand/15 bg-sand/5 p-3" style={{ animationDelay: "400ms" }}>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-center text-3xl" aria-hidden>
                    🛡
                  </span>
                  <dt className="flex-1 text-lg text-sand/80">{SUCCESS.safe}</dt>
                  <dd className="font-display text-3xl font-bold tabular-nums">
                    {card.safeAirPct}% <span className="text-base font-normal text-sand/70">{SUCCESS.safeOf}</span>
                  </dd>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-sand/15" aria-hidden>
                  <div className="h-full rounded-full bg-safe" style={{ width: `${card.safeAirPct}%` }} />
                </div>
              </div>
            </dl>
            {before > 0 && !(sim.earned > before) && <p className="text-sand/70">Your best is {before} parts.</p>}
            {nextButton(SUCCESS.toCall)}
          </>
        )}

        {step === 2 &&
          (calling ? (
            <FinalCheck
              onDone={(w) => {
                setWings(w);
                next();
              }}
            />
          ) : (
            <>
              <p className="ringing mt-6 text-center text-7xl" aria-hidden>
                📡
              </p>
              <h2 id="debrief-title" className="text-center font-display text-5xl font-bold leading-none text-sunset">
                {SUCCESS.callTitle}
              </h2>
              <p className="text-center text-xl">{SUCCESS.call}</p>
              <button type="button" onClick={() => setCalling(true)} className={`${PRIMARY} mt-auto self-center px-8 text-2xl`} autoFocus>
                {SUCCESS.answer}
              </button>
            </>
          ))}

        {step === 3 && (
          <>
            <h2 id="debrief-title" className="font-display text-4xl font-bold">
              {SUCCESS.lootTitle}
            </h2>
            <Collection title={SUCCESS.badges} items={loot.slice(0, BADGE_IDS.length)} columns="grid-cols-6" onPick={setOpen} />
            <Collection title={SUCCESS.cards} items={loot.slice(BADGE_IDS.length)} columns="grid-cols-6 sm:grid-cols-8" onPick={setOpen} />
            <div className="min-h-28 rounded-xl border border-sand/15 bg-sand/5 p-3" role="status">
              {open ? (
                <>
                  <p className={`font-display text-xl ${open.lit ? "text-sulfur" : "text-sand/70"}`}>{open.name}</p>
                  <p>{open.text}</p>
                  {open.source && (
                    <a href={open.source.url} target="_blank" rel="noreferrer" className="text-sm text-sand/60 underline hover:text-sunset">
                      {open.source.label}
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sand/70">{SUCCESS.tapToRead}</p>
              )}
            </div>
            {nextButton(SUCCESS.toCertificate)}
          </>
        )}

        {step === 4 && (
          <>
            <Certificate wings={wings} rank={RANKS[card.rank]} stars={card.stars} />
            <p className="border-l-4 border-sunset pl-3 text-lg">{tip}</p>
            <div className="mt-auto flex flex-wrap justify-end gap-3">
              <Link href="/" className={SECONDARY}>
                Back to the start
              </Link>
              <button type="button" onClick={restart} className={PRIMARY} autoFocus>
                Play again
              </button>
            </div>
          </>
        )}
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
    // The win keeps the backdrop light, so the base the player brought back to life shows around the cards.
    <div className={`absolute inset-0 z-10 flex flex-col overflow-y-auto p-3 md:p-8 ${failed ? "bg-dusk/70 backdrop-blur-sm" : "bg-dusk/30"}`} role="dialog" aria-modal aria-labelledby="debrief-title">
      <div className={`rise mx-auto my-auto flex w-full flex-col gap-4 rounded-3xl border border-sand/15 bg-dusk/95 p-5 md:p-8 ${failed ? "max-w-2xl" : "min-h-[min(36rem,calc(100dvh-1.5rem))] max-w-md"}`}>{failed ? <Failed /> : <Passed />}</div>
    </div>
  );
}
