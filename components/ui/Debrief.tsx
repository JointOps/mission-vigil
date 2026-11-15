"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";
import { type BadgeId, badges, finalCheck, reportCard } from "@/engine/scoring";
import { MAX_PARTS, o2Pct } from "@/engine/simulate";
import { BADGES, CERTIFICATE, FACT_IDS, FACTS, FAILURES, POSTCARD, type Question, QUIZ, RANKS, SECRET_IDS, SECRETS, SUCCESS } from "@/engine/story";
import { useGame } from "@/store/game";
import { Icon } from "./Icon";
import { Postcard } from "./Postcard";

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

/** The seal's colour says the rank, so a better rank is something to come back for. */
const SEAL = ["#c8814a", "#d8dee6", "#f2c230"] as const;

/** A starburst seal with the rank on it, drawn in code. It stamps onto the certificate. */
function Seal({ rank }: { rank: 0 | 1 | 2 }) {
  const points = Array.from({ length: 48 }, (_, i) => {
    const a = (i * Math.PI) / 24;
    const r = i % 2 ? 44 : 50;
    return `${(r * Math.sin(a)).toFixed(1)},${(-r * Math.cos(a)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="-52 -52 104 104" className="stamp size-28 shrink-0 drop-shadow-lg" style={{ animationDelay: "500ms", transformOrigin: "center" }} role="img" aria-label={CERTIFICATE.seal(RANKS[rank])}>
      <polygon points={points} fill={SEAL[rank]} />
      <circle r="38" fill="none" stroke="#1c0f0b" strokeOpacity="0.35" strokeWidth="2" />
      <circle r="33" fill="#1c0f0b" fillOpacity="0.12" />
      {[-14, 0, 14].map((x, i) => (
        <text key={x} x={x} y={i === 1 ? -14 : -10} textAnchor="middle" fontSize="12" fill="#1c0f0b" fillOpacity="0.7">
          ★
        </text>
      ))}
      <text y="12" textAnchor="middle" fontSize="16" fontWeight="700" fill="#1c0f0b" className="font-display uppercase">
        {RANKS[rank]}
      </text>
    </svg>
  );
}

/** The certificate to keep: the player's name, big, with a seal for their rank. Printing prints it alone. */
function Certificate({ name, wings, rank, stars, secrets }: { name: string; wings: number; rank: 0 | 1 | 2; stars: number; secrets: number }) {
  const [today] = useState(() => new Date().toLocaleDateString());
  return (
    <section className="certificate relative rounded-xl border-4 border-double border-sulfur bg-[radial-gradient(ellipse_at_top,rgb(242_194_48/0.14),transparent_70%)] p-4 text-center" aria-label={CERTIFICATE.title}>
      <p className="font-stencil text-base tracking-wide uppercase opacity-80">Mission Vigil: Junior Astronaut Mission Trainer</p>
      <p className="mt-3 text-sm opacity-70">{CERTIFICATE.goesTo}</p>
      {name ? (
        <p className="pop-in font-display text-6xl leading-none font-bold break-words text-sulfur" style={{ animationDelay: "200ms" }}>
          {name}
        </p>
      ) : (
        <p className="mx-6 mt-6 border-b border-current pb-1 text-sm opacity-60">{CERTIFICATE.sign}</p>
      )}
      <p className="mt-2 leading-snug">{CERTIFICATE.line}</p>
      <h2 id="debrief-title" className="mx-auto mt-3 w-fit -skew-x-6 bg-sunset px-5 py-1 font-stencil text-3xl text-dusk uppercase">
        {CERTIFICATE.title}
      </h2>
      <div className="mt-3 flex items-center justify-center gap-4">
        <Seal rank={rank} />
        <div className="text-left">
          <p className="font-display text-4xl leading-none text-sulfur" role="img" aria-label={`${stars} of 3 stars`}>
            {"★".repeat(stars)}
            <span className="opacity-25">{"★".repeat(3 - stars)}</span>
          </p>
          <p className="mt-1 font-display text-xl">✦ {CERTIFICATE.wings(wings)}</p>
          <p className="font-display text-xl">◆ {CERTIFICATE.secrets(secrets, SECRET_IDS.length)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3 text-left text-sm">
        <p className="opacity-70">
          {today}
          <br />
          {CERTIFICATE.where}
        </p>
        <p className="flex items-center gap-2">
          <span className="orb size-7! shrink-0 print:hidden" aria-hidden />
          <span>
            <span className="font-display text-lg italic">ARIA</span>
            <br />
            <span className="opacity-70">{CERTIFICATE.signed}</span>
          </span>
        </p>
      </div>
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

type Loot = { readonly id: string; readonly icon: ReactNode; readonly name: string; readonly lit: boolean; readonly text: string; readonly source?: { readonly label: string; readonly url: string } };

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
              <span aria-hidden className={item.lit ? "" : "opacity-40 grayscale"}>
                {item.icon}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = 6;

/** The win screen: six short cards, one tap each, so nothing needs scrolling and the win comes first. */
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
  // The name lives here and nowhere else: never stored, never sent. The postcard asks for it, and the certificate shows it.
  const [name, setName] = useState("");
  const next = () => setStep(step + 1);
  const nextButton = (label: string) => (
    <button type="button" onClick={next} className={`${PRIMARY} mt-auto self-end`} autoFocus>
      {label} →
    </button>
  );
  const loot: Loot[] = [
    ...BADGE_IDS.map((id) => ({ id, icon: <Icon name={BADGES[id].icon} className="size-5" />, name: BADGES[id].name, lit: won.includes(id), text: BADGES[id].how })),
    ...FACT_IDS.map((id) => ({ id, icon: sim.facts.includes(id) ? "✦" : "?", name: sim.facts.includes(id) ? FACTS[id].title : "Fact card", lit: sim.facts.includes(id), text: sim.facts.includes(id) ? FACTS[id].text : SUCCESS.missing, source: sim.facts.includes(id) ? FACTS[id].source : undefined })),
    // A secret not found yet shows only its riddle.
    ...SECRET_IDS.map((id) => ({ id, icon: sim.secrets.includes(id) ? "◆" : "?", name: sim.secrets.includes(id) ? SECRETS[id].name : SUCCESS.secret, lit: sim.secrets.includes(id), text: sim.secrets.includes(id) ? SECRETS[id].how : SECRETS[id].riddle })),
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
                [<Icon key="rank" name="medal" className="mx-auto size-8" />, SUCCESS.rank, RANKS[card.rank]],
                ["⬢", SUCCESS.parts, `${sim.earned} of ${MAX_PARTS}`],
              ].map(([icon, label, value], i) => (
                <div key={String(label)} className="pop-in flex items-center gap-3 rounded-xl border border-sand/15 bg-sand/5 p-3" style={{ animationDelay: `${i * 200}ms` }}>
                  <span className="w-10 text-center text-3xl text-sulfur" aria-hidden>
                    {icon}
                  </span>
                  <dt className="flex-1 text-lg text-sand/80">{label}</dt>
                  <dd className="font-display text-3xl font-bold tabular-nums">{value}</dd>
                </div>
              ))}
              <div className="pop-in rounded-xl border border-sand/15 bg-sand/5 p-3" style={{ animationDelay: "400ms" }}>
                <div className="flex items-center gap-3">
                  <span className="w-10 text-safe" aria-hidden>
                    <Icon name="shield" className="mx-auto size-8" />
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
              <p className="ringing mt-6 text-sunset" aria-hidden>
                <Icon name="dish" className="mx-auto size-20" />
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
            <Collection title={SUCCESS.cards} items={loot.slice(BADGE_IDS.length, BADGE_IDS.length + FACT_IDS.length)} columns="grid-cols-6 sm:grid-cols-8" onPick={setOpen} />
            <Collection title={SUCCESS.secrets} items={loot.slice(BADGE_IDS.length + FACT_IDS.length)} columns="grid-cols-5" onPick={setOpen} />
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
            {nextButton(SUCCESS.toPostcard)}
          </>
        )}

        {step === 4 && (
          <>
            <Postcard name={name} setName={setName} rank={RANKS[card.rank]} stars={card.stars} wings={wings}>
              <button type="button" onClick={next} className={PRIMARY} autoFocus>
                {POSTCARD.toCertificate} →
              </button>
            </Postcard>
          </>
        )}

        {step === 5 && (
          <>
            <Certificate name={name.trim()} wings={wings} rank={card.rank} stars={card.stars} secrets={sim.secrets.length} />
            <p className="border-l-4 border-sunset pl-3">{tip}</p>
            <div className="mt-auto flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => window.print()} className={SECONDARY}>
                <Icon name="printer" className="mr-1.5" />
                {SUCCESS.print}
              </button>
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
