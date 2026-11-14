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
| **01 · First Breath** | Restore life support | Oxygen, CO₂, power, and heat |
| **02 · Keep the Lights On** | Weather a dust storm | Solar output, heating, and air cleaning |
| **03 · Green Thumb** | Grow food | Water, light, power, and time |
| **04 · Storm Warning** | Respond to a solar flare | Shelter, radiation, and a habitat leak |
| **05 · Launch Window** | Call home | Communications and the systems keeping the base alive |

Explore the outpost, follow ARIA’s guidance, earn parts from tasks, and use the 3D printer to buy upgrades. Fact cards connect actions to space research; a report card shows the outcome. Time, event severity, and selected thresholds are compressed or tuned for play, and are identified as game rules in [SOURCES.md](SOURCES.md).

## Try it

**[Launch MISSION VIGIL →](https://mission-vigil.vercel.app)**

- **Keyboard:** arrow keys or WASD to move; E, Space, or Enter to interact and advance dialogue; P to pause.
- **Touch:** tap the ground to move and tap a machine to interact.
- Follow the guided introduction and the yellow trail to the next task. Blue markers indicate optional jobs.

The game stores a best score in the browser’s local storage. It has no accounts or analytics and does not collect personal data.

## How it works

The interface and 3D scene are built with **Next.js, React, TypeScript, Three.js, React Three Fiber, drei, and Tailwind CSS**. A plain TypeScript simulation models the systems; **Zustand** connects that simulation to the player interface. The scene is procedural and uses no external 3D models or textures.

The simulation distinguishes sourced values from game rules. See [SOURCES.md](SOURCES.md) for research, asset licences, and items still requiring verification.

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
```

## Team JointOps

Five builders from Pakistan. Handles are Space Apps handles, not GitHub usernames.

| Member | Space Apps handle | Role |
| :--- | :--- | :--- |
| Shayan Hussain · Team Owner | @rockstarsb | Backend architecture and integration |
| AbdulMoiz Yousuf | @moizyousuf | Frontend lead |
| Owais Iqbal | @owaistar | AI, management, and game design |
| Zoha Hasan | @zo._ha | Documentation |
| Maha Waris Khan | @mahawaris | Frontend support |

## AI disclosure

Claude (Anthropic) assisted with the white paper, research, and code. OpenAI Codex assisted with repository setup and code. Any AI-generated images must carry a visible watermark. The game scene is procedural and does not use image assets.

## Licence

[MIT](LICENSE). Third-party font licences and research sources are listed in [SOURCES.md](SOURCES.md).
