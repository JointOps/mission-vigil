"use client";

import { useRef } from "react";
import { FACTS, LEARN } from "@/engine/story";
import { useGame } from "@/store/game";
import { Icon } from "./Icon";
import { SpaceView } from "./SpaceView";

/**
 * The "?" button and its window of short lessons. A native <dialog> gives
 * Escape to close, a focus trap, and focus back on "?" for free; <details name>
 * keeps one topic open at a time with no script.
 */
export function Learn({ className }: { className: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // Reading pauses the game, and closing puts it back as it was: a game already paused stays paused.
  const wasPaused = useRef(false);

  const show = () => {
    const game = useGame.getState();
    wasPaused.current = game.paused;
    if (!game.paused) game.togglePause();
    dialog.current?.showModal();
  };
  const onClose = () => {
    const game = useGame.getState();
    if (!wasPaused.current && game.paused) game.togglePause();
  };

  return (
    <>
      <button type="button" onClick={show} aria-label={LEARN.open} aria-haspopup="dialog" className={`${className} min-w-11 font-bold`}>
        ?
      </button>
      <dialog
        ref={dialog}
        onClose={onClose}
        // A tap on the dimmed backdrop closes it too.
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        aria-labelledby="learn-title"
        className="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(36rem,calc(100vw-1.5rem))] rounded-3xl border border-sand/15 bg-dusk p-0 text-sand backdrop:bg-dusk/70 backdrop:backdrop-blur-sm"
      >
        <div className="flex flex-col gap-3 p-4 md:p-6">
          <h2 id="learn-title" className="font-display text-4xl font-bold">
            {LEARN.title}
          </h2>
          <p className="-mt-2 text-sand/80">{LEARN.intro}</p>
          {LEARN.topics.map((topic) => (
            <details key={topic.question} name="learn" className="group rounded-xl border border-sand/15 bg-sand/5 open:border-sunset/60">
              <summary className="flex cursor-pointer list-none items-center gap-3 px-3 py-2 font-display text-xl marker:hidden [&::-webkit-details-marker]:hidden">
                <span aria-hidden className="w-8 text-sunset">
                  <Icon name={topic.icon} className="mx-auto size-6" />
                </span>
                <span className="flex-1">{topic.question}</span>
                <span aria-hidden className="text-sunset transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="flex flex-col gap-2 px-3 pb-3 text-lg leading-snug">
                {topic.answer.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {"map" in topic && (
                  <div className="flex justify-center">
                    <SpaceView brief />
                  </div>
                )}
                {"fact" in topic && (
                  <aside className="rounded-lg border border-sulfur/50 bg-sulfur/10 px-3 py-2 text-base">
                    <p className="font-display text-sulfur">
                      {LEARN.didYouKnow} {FACTS[topic.fact].title}
                    </p>
                    <p>{FACTS[topic.fact].text}</p>
                    <a href={FACTS[topic.fact].source.url} target="_blank" rel="noreferrer" className="text-sm text-sand/60 underline hover:text-sunset">
                      {FACTS[topic.fact].source.label}
                    </a>
                  </aside>
                )}
              </div>
            </details>
          ))}
          <form method="dialog" className="flex justify-end">
            <button type="submit" className="rounded-xl bg-sunset px-4 py-2 font-display text-lg font-bold text-dusk hover:bg-sand">
              {LEARN.close}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
