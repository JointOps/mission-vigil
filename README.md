# MISSION VIGIL
### Junior Astronaut Mission Trainer

**The base is asleep. The air is going bad. You have five sols to keep it alive.**

[▶ Play the mission](https://mission-vigil.vercel.app) · [Science & sources](SOURCES.md) · [Meet the team](#team-jointops) · [Run locally](#run-locally)

A browser-based survival game by **Team JointOps, Pakistan**, for the **NASA Space Apps Challenge 2026**. Players walk an astronaut through a Martian outpost, restore its systems, and learn how one resource decision can affect the rest of the mission. No account is required.

---

## The challenge

> Build a Junior Astronaut Mission Trainer — an interactive game or app that lets students run a lunar or Martian outpost, balancing competing demands like life support, radiation shielding, power, and food production, so they experience firsthand the decisions that determine whether a mission fails or succeeds.

## Five sols. One interconnected base.

A **sol** is a day on Mars. Each day introduces another demand while earlier systems still need attention.

| Sol | Mission | What the player balances |
| :--- | :--- | :--- |
| **01 · Go for Air** | Restore life support | Oxygen, CO₂, power, and heat |
| **02 · Go for Power** | Weather a dust storm | Solar output, heating, and air cleaning |
| **03 · Go for Harvest** | Grow food | Water, light, power, and time |
| **04 · Hold for Flare** | Respond to a solar flare | Shelter, radiation, and a habitat leak |
| **05 · Go for Home** | Call home | Communications and the systems keeping the base alive |

Explore the outpost, follow ARIA’s guidance, earn parts from tasks, and use the 3D printer to buy upgrades. Daily chores come back every morning, as they do for real crews. Each first-time job unlocks a “Did you know?” fact card with its source, and a “?” window answers the big questions (what a sol is, why CO₂ matters, how far away Earth is) at any time.

Real data runs through the game: the weather station shows recent sols measured by the Curiosity rover, and a map shows where Earth and Mars are today and how long a radio message takes. Hidden secrets reward curious players.

At the end, players answer a short check from Earth, see their stars, rank, badges and collection, and can save a postcard from Mars and print a certificate. Time, event severity, and selected thresholds are compressed or tuned for play, and are identified as game rules in [SOURCES.md](SOURCES.md).

## Try it

**[Launch MISSION VIGIL →](https://mission-vigil.vercel.app)**

- **Keyboard:** arrow keys or WASD to move; E, Space, or Enter to interact and advance dialogue; P or Escape to pause.
- **Touch:** tap the ground to move and tap a machine to interact. On a phone, tap a gauge chip to open it.
- Follow the guided introduction and the yellow trail to the next task. Blue markers indicate optional jobs.

The game stores a best score in the browser’s local storage. The name typed on the postcard stays on the page and is never stored or sent. It has no accounts or analytics and does not collect personal data.

## How it works

The interface and 3D scene are built with **Next.js, React, TypeScript, Three.js, React Three Fiber, and Tailwind CSS**. A plain TypeScript simulation models the systems; **Zustand** connects that simulation to the player interface. The scene is procedural and uses no external 3D models or textures, the icons are hand-drawn SVG, and every sound is synthesised with the Web Audio API, so there are no image or audio files.

The 3D scene loads after the page, behind a short loading screen, so the controls work while it arrives. It holds 60 fps and keeps React updates to a handful per second.

The simulation distinguishes sourced values from game rules. See [SOURCES.md](SOURCES.md) for research and asset licences.

## Run locally

Use Node.js 24 (see `.nvmrc`) and npm:

```sh
npm ci
npm run dev
```

Open [localhost:3000](http://localhost:3000). For verification:

```sh
npm test
npm run lint
npm run build
npm run start   # the production build, for checking load time and frame rate
```

## Team JointOps

Team JointOps is based in Pakistan. Handles are Space Apps handles, not GitHub usernames.

| Member | Space Apps handle | Role |
| :--- | :--- | :--- |
| Shayan Hussain · Team Owner | @rockstarsb | Backend architecture and integration |
| AbdulMoiz Yousuf | @moizyousuf | Frontend lead |
| Owais Iqbal | @owaistar | AI, management, and game design |
| Zoha Hasan | @zo._ha | Documentation |
| Maha Waris Khan | @mahawaris | Frontend support |
| Sultan Nadeem | Not provided | Systems design and technical strategy |

## AI disclosure

Claude (Anthropic) assisted with the white paper, research, and code. OpenAI Codex assisted with repository setup and code. Any AI-generated images must carry a visible watermark. The game scene is procedural and does not use image assets.

## Licence

[MIT](LICENSE). Third-party font licences and research sources are listed in [SOURCES.md](SOURCES.md).
