# MISSION VIGIL: Junior Astronaut Mission Trainer

A browser-based survival game for students: alone on Mars, players restore an outpost, balance scarce resources, and learn from mission failures using NASA research and clearly labeled game rules.

## Challenge

> Build a Junior Astronaut Mission Trainer — an interactive game or app that lets students run a lunar or Martian outpost, balancing competing demands like life support, radiation shielding, power, and food production, so they experience firsthand the decisions that determine whether a mission fails or succeeds.

## How it answers the challenge

The game is one mission of five sols. A sol is one day on Mars. You wake in a dark, sleeping base with ARIA, a small helper robot, and walk your astronaut around to bring the base back to life. Each sol adds one demand the outpost has to balance.

- **Sol 1, First Breath (life support).** Switch on the power and share it between the air cleaner and the oxygen maker. Go out in a suit to brush dust off the solar panels. At sunset the panels stop and the cold comes: the heater needs power too.
- **Sol 2, Keep the Lights On (power).** A dust storm buries the panels. For most of a sol there are only 3 power to share between the air cleaner, the oxygen maker and the heater. The air cleaner's filter fills up in the middle of it.
- **Sol 3, Green Thumb (food and water).** You are hungry. Salad needs water, light and time, so watering it early pays off. Fixing the water cleaner makes it grow twice as fast.
- **Sol 4, Storm Warning (radiation).** The base springs a leak, and then a solar flare is on its way. Patch the hole in time, or wait indoors and lose air?
- **Sol 5, Launch Window (the way home).** Point the radio dish at Earth, and restart the big air system at sunset.

Extra jobs (exercise bike, weather station, rover, radio dish, rock samples) earn parts for upgrades from the 3D printer. Every first-time job unlocks a "Did you know?" card with a real space fact and its source. Stars, a rank, six badges and a best score give reasons to play again.

Live demo: TODO  
Screenshots: TODO

## Tech stack

Next.js App Router, TypeScript, Tailwind CSS, Three.js, React Three Fiber, drei, and Zustand. React Three Fiber 9 supports React 19 (see its [npm package](https://www.npmjs.com/package/@react-three/fiber)). The simulation in `engine/` is plain TypeScript with no UI dependencies; see [CLAUDE.md](CLAUDE.md) for the architecture and code rules.

## Quick start

Use the Node version in `.nvmrc` and npm:

Controls: arrow keys or W A S D to walk, E (or Space or Enter) to use things and to read on, P to pause. On a phone, tap where you want to go and tap a machine to use it.

```sh
npm install
npm run dev
npm test
npm run build
```

## Team

All members are from Pakistan. Handles below are Space Apps handles, not GitHub usernames.

| Member | Space Apps handle | Roles |
|---|---|---|
| Shayan Hussain (Team Owner) | @rockstarsb | Backend architecture and integration |
| AbdulMoiz Yousuf | @moizyousuf | Frontend lead |
| Owais Iqbal | @owaistar | AI, management, and game design |
| Zoha Hasan | @zo._ha | Documentation |
| Maha Waris Khan | @mahawaris | Frontend support |

## NASA data and AI use

See [sources and verification needs](docs/SOURCES.md) and the [AI disclosure](docs/AI_DISCLOSURE.md). The [white paper](docs/WHITEPAPER.md) is the project design source of truth.

## License

MIT; see [LICENSE](LICENSE).
