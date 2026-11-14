# MISSION VIGIL

A browser game for the NASA Space Apps challenge "Junior Astronaut Mission Trainer". Students wake up alone in a Mars outpost and keep it alive by balancing life support, power, food and radiation. The goal is to win the hackathon: judges will play for a few minutes, so the first minutes must look great, be fun, teach real science, and never break.

The game is one **chapter** (never "level") of five sols: the hackathon is too short to ship more, so everything lives in Chapter 1. Each sol adds one demand: air, power and heat, food and water, radiation, the call home. The sols are listed in `SOLS` in `engine/story.ts`.

If `docs/WHITEPAPER.md` exists, it is the design source of truth. Read it before any design work.

## Game direction

Decided with the team owner. Do not drift from these without asking.

- **You play an astronaut, not a dashboard.** The player walks a character around the base from an overhead camera (arrow keys or W A S D, or tap the ground) and does every job by hand.
- **Bring the base to life, tycoon style.** A chapter starts with something broken or asleep and the player restores it piece by piece. Jobs pay **parts**; the 3D printer turns parts into upgrades. Each restored thing should visibly change the base (lights come on, plants grow, the dish turns).
- **Guide the player.** Every chapter opens with a short guided start that teaches one control at a time. A trail of yellow dots on the floor always leads to the next job, and a marker floats over every station with something to do.
- **Story through ARIA.** ARIA is a small flying helper robot. She tells the story in short spoken lines, reacts to what happens, and ends each chapter on a hook for the next.
- **Always something to do.** Must-do jobs (yellow) keep you alive. Extra jobs (blue) pay parts and unlock "Did you know?" fact cards. Rank, stars, the card collection and the best score give reasons to play again.
- **Make the challenges real.** Each job mirrors something real crews or missions deal with, and its fact card says so with a source. Borrow pacing and feel from good survival and management games; never copy their names, characters, art or levels.
- **Detail matters.** The base should look lived in: furniture, pipes, lamps, a rover, a walkway. Add props when you add a place.
- **One chapter, five sols.** No more chapters will ship. New ideas go into a sol of Chapter 1, and each sol adds one new demand. Finish, play-test and polish a sol's content before adding more.

## Writing for players

The players are children. This is the rule teams break most, so check every string against it.

- Short sentences. Common words. One idea in each sentence.
- Use the easy name: "air cleaner", not "CO₂ scrubber"; "power box", not "power panel"; "filter", not "filter bed".
- Give a number together with what it means ("You breathe out about 1 kg of CO₂ every day").
- Explain a new word the first time it appears ("A sol is one day on Mars").
- A failure screen says what happened, what to try, and the real story behind it. Buttons say what they do.
- All player text lives in `engine/story.ts` or in a job's `label` in `engine/simulate.ts`.

## Commands

```sh
npm run dev      # dev server
npm test         # engine tests (node --test, no framework)
npm run lint     # eslint
npm run build    # production build; must pass before merging
```

Node 24 (see `.nvmrc`). The tests rely on Node running TypeScript directly.

In development the game store is on `window.vigil` and the job list on `window.vigilJobs`, so a script or the browser console can read the game and drive it (`vigil.getState().walkTo({ x: 0.2, z: -1.9 })`, `vigilJobs(vigil.getState().sim)`).

## This is not the Next.js you know

Next.js 16 with Cache Components. APIs differ from older versions. Read the matching guide in `node_modules/next/dist/docs/` before touching routing, caching, fonts or config. Two things already bit us:

- Route `params` must be awaited inside a `<Suspense>` boundary (`app/play/[chapter]/page.tsx`).
- Navigating away hides the old page instead of unmounting it. Effects are cleaned up, state is kept. Reset state in effect cleanup when a page must start fresh (`components/Game.tsx`).

## Architecture

```
engine/      Pure TypeScript. No React, no DOM, no three.js. All game rules live here.
  constants.ts   Every number, tagged "real" (sourced) or "game" (tunable rule)
  simulate.ts    step(state, input, seconds) -> state. The guided start, the air, heat, food, the flare, jobs, parts, upgrades, events.
  world.ts       Floor plan: stations, walls, obstacles, and route() for walking around them
  story.ts       Every word the player reads: ARIA's lines, fact cards, upgrades, sols, badges, end screens, quiz
  scoring.ts     Stars, rank and badges
store/game.ts    Zustand store. The only place the engine meets the UI. Owns the astronaut's position and ARIA's speech.
components/
  Game.tsx       One chapter: scene + HUD + keyboard + sounds + the requestAnimationFrame loop
  sound.ts       Small Web Audio synth; no audio files
  three/         Outpost.tsx (sky, sun, ground, camera), Base.tsx (habitat, airlock, yard), Crew.tsx (astronaut, ARIA, trail, markers), parts.tsx (shared shapes and materials)
  ui/            Hud.tsx (gauges, jobs, speech, power box, printer, fact cards), Debrief.tsx (end screens)
app/             Routes only. Keep pages thin.
```

Data flows one way: the loop calls `tick`, `tick` moves the astronaut and calls the engine's `step`, the store publishes the new state, and the UI reads it. The UI never computes game rules.

How to add things:

- **A job:** add it to `Task` and `TASKS` in `simulate.ts`, list it in `jobs()`, give it a spot in `STATIONS` in `world.ts`, and draw it in `Base.tsx`. The job list, floor trail, marker and prompt then work by themselves.
- **Something ARIA says:** add a `MessageId` and its lines in `story.ts`, and call `say()` in `step`. The game pauses and shows it.
- **A fact card:** add a `FactId` with text and a source in `story.ts`, add the source to `docs/SOURCES.md`, and name it in a task's `fact` (or call `learn()`).
- **An obstacle:** add a rectangle in `world.ts` and draw the prop from the same rectangle, so what you see is what blocks you.

Inside `engine/`, relative imports carry the `.ts` extension so Node can run the tests without a bundler. Everywhere else, import through `@/`.

## Code rules

Write the least code that works. Before adding anything, stop at the first of these that holds:

1. Does it need to exist? If the need is a guess, skip it and say so.
2. Is it already in this codebase? Reuse it.
3. Does the standard library or the platform do it? Use that (CSS over JS, a `<button>` over a clickable `<div>`).
4. Does an installed dependency do it? Use that. Do not add a dependency for something a few lines can do.
5. Only then write it, as small as it can be.

- No abstraction with one user: no interface with one implementation, no config for a value that never changes, no scaffolding for a later chapter.
- Fix bugs at the root. Find every caller of the function you are about to change first.
- Deleting code beats adding code. Boring beats clever.
- TypeScript strict. No `any`. Mark data `readonly`. Engine functions are pure: same input, same output, no mutation of what they are given.
- Comments explain why, not what. When you take a shortcut with a known ceiling, mark it `// ponytail: <the limit>, <what to do when it bites>`.
- Any logic with a branch or a loop leaves one runnable check in `engine/*.test.ts`. Test what a player would notice ("pouring power into oxygen fails on CO₂"), not implementation details. Trivial code needs no test.
- Never cut input validation, error handling that prevents data loss, or accessibility basics to save lines.

## Performance rules

The game must hold 60 fps on a school laptop.

- **Nothing in React re-renders per frame.** The simulation ticks every frame, so every store selector must round or derive its value so the component re-renders only when what it shows changes. See the selectors in `components/ui/Hud.tsx`.
- Selectors that return a list go through `useShallow`, and the engine returns the same objects each call (see `jobs()`), so the list only re-renders when it changes.
- **The 3D scene never uses React state for animation.** Read `useGame.getState()` inside `useFrame` and mutate through refs. One `useFrame` per scene file.
- Build static geometry and materials once at module scope. Every prop is a scaled copy of the unit box, cylinder or ball in `three/parts.tsx`. Never create three.js objects inside `useFrame`.
- Repeated meshes use `InstancedMesh` (rocks, trail dots). Particles are one `Points` object.
- No textures or model files: the scene is procedural and low-poly. Keep `dpr` capped and shadows to one light.
- Animate HUD elements with CSS `transform` and `opacity` only. Respect `prefers-reduced-motion`.
- Check before and after any scene change: frame rate should stay at 60 and DOM mutations should stay in the tens per second while the clock runs.

## Science and submission rules

These come from the hackathon rules and are not negotiable.

- Every number shown as fact has a source in `docs/SOURCES.md` and is tagged `kind: "real"` in `engine/constants.ts`. Anything tuned for gameplay is tagged `kind: "game"`. Never present a game value as a fact.
- When you add a real value or a fact card, add its source to `docs/SOURCES.md` in the same change.
- No NASA logos or mission patches. No content from *The Martian* or any other copyrighted work. Real missions may be described as history.
- Third-party assets (fonts, images, audio) need a licence entry in `docs/SOURCES.md` before they are added.
- AI use is disclosed in `docs/AI_DISCLOSURE.md`. AI-generated images need a visible watermark.
- Always use the full name "MISSION VIGIL: Junior Astronaut Mission Trainer" in titles and metadata.

## Design

- Palette comes from Mars: rust ground, sand haze, and the blue of a Martian sunset as the one accent. Tokens are in `app/globals.css`. Green, yellow and red are reserved for good, warning and danger. Yellow also marks the next job (trail, markers, prompt); blue marks extra jobs.
- Type: Big Shoulders (display and numerals, stencil cut for the wordmark) and Atkinson Hyperlegible Next (body).
- The 3D base is the hero. HUD panels stay quiet and translucent over it, and open only when needed (the power box and printer panels appear when the astronaut stands there).
- Works on a phone in portrait (tap to walk, tap a machine to use it), with the keyboard alone, and with a screen reader reading the gauges.

## Before you call work done

1. `npm test`, `npm run lint` and `npm run build` all pass.
2. Play the change in a browser: win once and fail once, with the keyboard and with taps. Check a phone-sized window.
3. Read every new line of player text aloud. Would a ten-year-old follow it?
4. Run `/ponytail-review` on the diff and delete what it finds.
5. Report what you verified and what you did not.

Commit only when asked. Always read `commit-instructions.md` before preparing or making a commit. Branch names start with `feat/` or `fix/`. Never commit secrets or `.env` files.
