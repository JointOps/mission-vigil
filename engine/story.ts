import type { BadgeId } from "./scoring.ts";
import type { FactId, Failure, MessageId, SecretId, StationId, Upgrade } from "./simulate.ts";

// Every word the player reads. Written for young readers: short sentences,
// common words, one idea at a time. A number is given with what it means.

export type Source = { readonly label: string; readonly url: string };
export type Fact = { readonly title: string; readonly text: string; readonly source: Source };
export type Debrief = { readonly title: string; readonly body: string; readonly lesson: string; readonly story: string; readonly source: Source };
export type Question = {
  readonly prompt: string;
  readonly choices: readonly string[];
  readonly answer: number;
  readonly why: string;
  /** Asked only of a player who found this fact card. */
  readonly card?: FactId;
  /** Asked of a player whose mission stopped this way. */
  readonly about?: Failure;
};

/** What ARIA, the base computer, says. Each entry is shown one line at a time while the game waits. */
export const MESSAGES: Readonly<Record<MessageId, readonly string[]>> = {
  intro: [
    "Beep! Beep! Wake up, please!",
    "Hello! I am ARIA. I am the computer of this base, and I am your helper.",
    "A big dust storm hit us while you slept. The base shut itself down to stay safe.",
    "Now the air in here is going bad. Let's fix it together, one job at a time.",
    "First we need power. Follow the yellow dots on the floor to the power box.",
  ],
  switch: ["This is the power box.", "Press E, or tap the yellow button, to turn the power on."],
  cleaner: [
    "Lights! That is much better.",
    "When you breathe out, you make a gas called CO₂. Too much CO₂ makes you sick.",
    "The air cleaner takes CO₂ out of the air. Tap the bars to give it 2 power.",
  ],
  oxygen: ["Good! The air cleaner is running.", "You breathe in oxygen. The oxygen maker makes more of it. Give it 1 power."],
  ready: [
    "Well done! Now the clock starts.",
    "The big air system needs 5 sols to start again. A sol is one day on Mars. Keep the base alive until then.",
    "We only have 3 power, and that is not enough. The solar panels outside are covered in dust.",
    "Each panel you clean gives 1 more power while the sun shines on it. Go out through the airlock, the small room on the right. I will come with you!",
  ],
  suit: [
    "Wait! You cannot breathe the air on Mars.",
    "Your suit has its own air. Look at the suit bar on the left.",
    "When the bar gets low, come back inside to fill it up.",
  ],
  night: [
    "The sun has set. Solar panels need sunlight, so they sleep at night.",
    "Now we are back to 3 power. And nights on Mars are very, very cold.",
    "Go to the power box. Take power back from a machine. Then give 1 power to the heater.",
  ],
  forecast: [
    "Good morning! This is sol 2. The sun is up, so the clean panels work again.",
    "The heater can rest in the day. Use your spare power at the power box.",
    "Uh-oh. A dust storm is coming this afternoon. It will cover the panels.",
    "Tip: make extra oxygen now, before the storm gets here.",
    "And every morning the chores come back: ride the bike, read the weather, and vacuum the air vents. Real crews keep a daily routine too.",
  ],
  storm: [
    "The storm is here! Dust is on the panels. We are back to 3 power.",
    "The power box switched everything off. Go and choose where the power goes.",
    "The dust hides the sun, so it gets cold. Keep the heater on, and stay inside until the storm is over.",
  ],
  filter: ["Oh no. The air cleaner has stopped!", "Its filter is full. Take a new filter from the shelf and put it in."],
  clear: ["This is sol 3. The storm is over. Look at all that dust!", "Go out and brush the panels clean to get our power back."],
  hungry: [
    "Grrr. Was that your tummy?",
    "You have not eaten since you woke up, and the food packs are gone.",
    "But we have a garden! Salad needs water and light to grow. When it is big, pick it and eat.",
  ],
  leak: [
    "This is sol 4. Warning! I hear air hissing.",
    "There is a hole by the outside door. Our air is leaking out!",
    "Do not run to the hole yet. First come to the air screen. We need to know how much time we have.",
  ],
  gathered: [
    "Good. Look at the new bar called Time left. It shows how long our air will last.",
    "Space Station crews do it this way too: warn, gather, then work.",
    "Now we work. Take a patch from the shelf and fix the hole from outside. Be quick!",
  ],
  flare: [
    "Alarm! The Sun just shot out a burst of radiation. It is called a solar flare.",
    "Radiation is made of tiny, fast bits you cannot see. Too much of it can make you very sick.",
    "It will hit us in a few seconds. Get inside! The walls stop most of it.",
    "Then stack the supply bags by the big desk. A wall of bags stops the rest. Stay in until it is over!",
  ],
  allclear: [
    "All clear! The flare is over. You can go out again.",
    "Look, the ground glows green! The sky high above us is shining. That is called an aurora.",
  ],
  lastsol: [
    "Good morning! This is sol 5, the last one. The big air system will be ready at sunset.",
    "A dusty wind blew in the night. The solar panels are dirty again, so brush them clean.",
    "Earth can send a ship for us. But first they must know we are alive. Then point the radio dish at Earth.",
  ],
  earth: [
    "The dish is pointing at Earth. Look at the map: the red dot is us, and the blue dot is Earth.",
    "Our call is the small white dot. It has a long way to fly. Listen!",
    "“Mars Base, this is Earth. We hear you! Ships can only fly to Mars about every 26 months. The next one is coming for you. Keep the base alive.”",
    "They heard us! We can do this. Together.",
  ],
  restart: ["Good news! The big air system is ready.", "Go to the big desk and press the green button!"],
};

/** The small line pictures drawn in components/ui/Icon.tsx. Words always sit beside them. */
export type IconName =
  | "bolt" | "fan" | "dial" | "bandage" | "shield" | "home" | "droplet" | "leaf" | "bowl" | "tap" | "bike" | "dish" | "windsock" | "rover" | "button" | "box" | "printer"
  | "sun" | "moon" | "rock" | "telescope" | "bubbles" | "wind" | "thermometer" | "helmet" | "food" | "hourglass" | "radiation" | "flame"
  | "boot" | "wrench" | "tank" | "bricks" | "battery" | "cards" | "clipboard" | "sound" | "mute" | "pause" | "play" | "medal" | "download" | "lock" | "gamepad" | "sunset"
  | "smile" | "worried" | "scared" | "vent";

/** "Did you know?" cards. Each is found by doing something for the first time. */
export const FACTS: Readonly<Record<FactId, Fact>> = {
  sol: {
    title: "A day on Mars",
    text: "A day on Mars is called a sol. It is about 40 minutes longer than a day on Earth.",
    source: { label: "Mars Curiosity rover data", url: "https://www.sciencedaily.com/releases/2013/12/131209181133.htm" },
  },
  co2: {
    title: "Your breath",
    text: "You breathe out about 1 kg of CO₂ every day. In a closed room it has nowhere to go.",
    source: { label: "NASA life support numbers", url: "https://ntrs.nasa.gov/api/citations/20100036823/downloads/20100036823.pdf" },
  },
  moxie: {
    title: "Oxygen from Mars air",
    text: "A machine called MOXIE rode to Mars on the Perseverance rover. It made oxygen out of Mars air: 122 grams in all.",
    source: { label: "MIT: MOXIE on Mars", url: "https://aeroastro.mit.edu/news-impact/oxygen-generating-experiment-moxie-completes-mars-mission" },
  },
  insight: {
    title: "Dust is a big problem",
    text: "The InSight lander on Mars ran on solar power. Dust slowly covered its panels, and in 2022 it ran out of power.",
    source: { label: "NASA: InSight retires", url: "https://www.nasa.gov/missions/insight/nasa-retires-insight-mars-lander-mission-after-years-of-science/" },
  },
  veggie: {
    title: "Space salad",
    text: "Astronauts grow plants on the Space Station. In 2015 they ate lettuce grown in space for the first time.",
    source: { label: "NASA: growing plants in space", url: "https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/" },
  },
  delay: {
    title: "A slow phone call",
    text: "Radio is as fast as light, but Mars is very far away. A message takes from 4 to 22 minutes to reach Earth.",
    source: { label: "NASA Mars mission questions", url: "https://mars.nasa.gov/mgs/faqs/faq_mplan.html" },
  },
  samples: {
    title: "Rocks in tubes",
    text: "The Perseverance rover drills out bits of Mars rock and seals them in tubes, so they can be sent to Earth one day.",
    source: { label: "NASA: Perseverance sample tubes", url: "https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/a-martian-roundtrip-nasas-perseverance-rover-sample-tubes/" },
  },
  suit: {
    title: "A spaceship you wear",
    text: "A spacesuit is like a tiny spaceship for one person. A NASA suit holds about 7 hours of air.",
    source: { label: "NASA: spacewalk suits", url: "https://ntrs.nasa.gov/citations/20140000238" },
  },
  marsair: {
    title: "Mars air",
    text: "Mars has air, but you cannot breathe it. It is almost all CO₂, and it is more than 100 times thinner than air on Earth.",
    source: { label: "NASA Mars fact sheet", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html" },
  },
  apollo13: {
    title: "Saved by tape",
    text: "In 1970 the air on Apollo 13 filled with CO₂. The crew built a filter holder from a plastic bag, cardboard and tape. It worked!",
    source: { label: "NASA: a square peg in a round hole", url: "https://www.nasa.gov/image-article/putting-square-peg-round-hole" },
  },
  thinair: {
    title: "How much oxygen?",
    text: "The air on Earth is about 21% oxygen. If it falls below 19.5%, it is not safe to work in.",
    source: { label: "US work safety rules", url: "https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146" },
  },
  printer: {
    title: "Tools by email",
    text: "The Space Station has a 3D printer. In 2014 it printed a wrench from a design sent up from Earth.",
    source: { label: "NASA: 3D printed wrench", url: "https://www.nasa.gov/missions/station/space-station-3-d-printer-builds-ratchet-wrench-to-complete-first-phase-of-operations/" },
  },
  rtg: {
    title: "Power in the dark",
    text: "Solar panels stop at night. The Perseverance rover carries a nuclear battery instead. It makes power day and night, and its heat keeps the rover warm.",
    source: { label: "NASA: how Perseverance gets power", url: "https://www.jpl.nasa.gov/news/press_kits/mars_2020/launch/mission/spacecraft/power/" },
  },
  cold: {
    title: "Colder than a freezer",
    text: "Mars is about −59 °C on average. A kitchen freezer is only −18 °C. At one landing site, the nights fell to −89 °C.",
    source: { label: "NASA Mars fact sheet", url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html" },
  },
  wind: {
    title: "A free car wash",
    text: "Sometimes the wind on Mars blows dust off solar panels. In 2009 a gust cleaned the Spirit rover's panels and gave it more power.",
    source: { label: "NASA: Spirit gets an energy boost", url: "https://www.jpl.nasa.gov/news/spirit-gets-energy-boost-from-cleaner-solar-panels/" },
  },
  water: {
    title: "Water, again and again",
    text: "The Space Station cleans its used water and drinks it again. It gets back 98 of every 100 drops, even from sweat and pee!",
    source: { label: "NASA: water recovery on the Space Station", url: "https://www.nasa.gov/missions/station/iss-research/nasa-achieves-water-recovery-milestone-on-international-space-station/" },
  },
  bones: {
    title: "Space gym",
    text: "In space, bones and muscles get weak because they have so little work to do. Space Station astronauts exercise about 2 hours every day.",
    source: { label: "NASA: astronaut exercise", url: "https://www.nasa.gov/missions/station/iss-research/astronaut-exercise" },
  },
  food: {
    title: "Packing lunch for years",
    text: "An astronaut eats about 0.6 kg of dry food every day. On a long trip that adds up to a lot to carry, so growing some food helps.",
    source: { label: "NASA food planning numbers", url: "https://ntrs.nasa.gov/api/citations/20190027610/downloads/20190027610.pdf" },
  },
  rover: {
    title: "The rover that would not stop",
    text: "The Opportunity rover was built to work for 90 sols on Mars. It kept going for almost 15 years!",
    source: { label: "NASA: Opportunity's mission ends", url: "https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/" },
  },
  flare: {
    title: "Counting radiation",
    text: "Earth's air and its magnetic field block most radiation from space. Mars has thin air and no such shield. The Curiosity rover carries a tool that counts the radiation there.",
    source: { label: "Mars Curiosity rover data", url: "https://www.sciencedaily.com/releases/2013/12/131209181133.htm" },
  },
  aurora: {
    title: "Green sky on Mars",
    text: "In 2024, after a storm on the Sun, the Perseverance rover saw the sky of Mars glow green. It was the first aurora ever seen from the ground of another planet.",
    source: { label: "NASA: first visible auroras at Mars", url: "https://www.jpl.nasa.gov/news/nasa-observes-first-visible-light-auroras-at-mars/" },
  },
  gather: {
    title: "Warn, gather, work",
    text: "The Space Station crew has three steps for any emergency. Warn everyone. Gather in one safe place. Then work on the problem. For a leak, they first work out how much time they have.",
    source: { label: "NASA: emergency response on the Space Station", url: "https://ntrs.nasa.gov/citations/20220019247" },
  },
  shelter: {
    title: "A fort made of bags",
    text: "On NASA's Orion spaceship, the crew can stack their storage bags into a small shelter. They wait inside until the burst from the Sun has passed.",
    source: { label: "NASA: protecting astronauts from space radiation", url: "https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon" },
  },
  chores: {
    title: "Cleaning day",
    text: "On the Space Station, Saturday is cleaning day. The whole crew wipes the walls, vacuums up dust and clears the air vents.",
    source: { label: "NASA Space Station blog", url: "https://www.nasa.gov/blogs/spacestation/2022/07/01/crew-works-multitude-of-research-before-fourth-of-july-weekend/" },
  },
  // The secret card: found only by pointing the hidden telescope at Earth.
  earthstar: {
    title: "Earth, the evening star",
    text: "From Mars, Earth looks like a bright star after sunset, with our Moon as a small star beside it. In 2014 the Curiosity rover took a photo of them both in the Mars sky.",
    source: { label: "NASA: Earth seen from Mars", url: "https://www.jpl.nasa.gov/images/pia17936-bright-evening-star-seen-from-mars-is-earth/" },
  },
};
export const FACT_IDS = Object.keys(FACTS) as FactId[];

/** Things the 3D printer can make from parts. */
export const UPGRADES: Readonly<Record<Upgrade, { readonly icon: IconName; readonly name: string; readonly text: string }>> = {
  boots: { icon: "boot", name: "Fast boots", text: "You walk faster." },
  tools: { icon: "wrench", name: "Power tools", text: "You finish jobs twice as fast." },
  tank: { icon: "tank", name: "Big air tank", text: "Your suit air lasts longer outside." },
  walls: { icon: "bricks", name: "Thick walls", text: "The base stays warm for longer." },
  battery: { icon: "battery", name: "Spare battery", text: "1 more power, day and night." },
};

/**
 * A picture for each place with a job, shown beside its words so a young reader
 * can find a job at a glance. Pictures only: screen readers read the words.
 */
export const ICONS: Readonly<Record<StationId, IconName>> = {
  power: "bolt",
  scrubber: "fan",
  gauge: "dial",
  leak: "bandage",
  bags: "shield",
  shelter: "home",
  plant: "droplet",
  salad: "bowl",
  recycler: "tap",
  bike: "bike",
  vents: "vent",
  antenna: "dish",
  weather: "windsock",
  rover: "rover",
  console: "button",
  storage: "box",
  printer: "printer",
  panel0: "sun",
  panel1: "sun",
  panel2: "sun",
  rock0: "rock",
  rock1: "rock",
  rock2: "rock",
  telescope: "telescope",
};

/** Pictures for the gauges and the machines at the power box. */
export const GAUGE_ICONS = { oxygen: "bubbles", co2: "wind", room: "thermometer", suit: "helmet", food: "food", time: "hourglass", radiation: "radiation", scrubber: "fan", heater: "flame" } as const satisfies Record<string, IconName>;

/** What ARIA says when a gauge is tapped on a phone: what it measures and what to do. */
export const GAUGE_TIPS = {
  oxygen: "You breathe in oxygen. Keep it between 19.5% and 23.5%. The oxygen maker makes more.",
  co2: "CO₂ is the gas you breathe out. Too much makes you sick. The air cleaner takes it out.",
  room: "Mars is very cold. When the sun is gone, give power to the heater.",
  suit: "Your suit has its own air. Go back inside before it runs out.",
  food: "An empty tummy makes you slow. Water the salad, then pick it and eat.",
  time: "This is how long our air will last with the leak. Patch the hole!",
  radiation: "The flare sends out radiation. The walls and the bag shelter keep you safe.",
} as const;

/** The title screen. */
export const TITLE = {
  tagline: "Six chapters. One way home.",
  intro: "You wake up alone on Mars, and the base is asleep. Wake it up, keep it alive, and find your way home to Earth.",
  start: "Start Chapter 1",
  soon: "Coming soon",
  chapters: "The chapters",
} as const;

/**
 * The whole story: six chapters from a sleeping base on Mars to splashdown on Earth.
 * Only Chapter 1 is built; the title screen shows the rest as coming soon.
 * Each one is harder, with new jobs and less help from ARIA.
 */
export const CHAPTERS: readonly { readonly name: string; readonly teaser: string }[] = [
  { name: "Cold Start", teaser: "Wake up the sleeping base. Keep it alive for 5 sols." },
  { name: "Red Blizzard", teaser: "Dust covers all of Mars. Can the base last in the dark?" },
  { name: "Clear the Pad", teaser: "The rescue lander is coming. Build it a safe place to land." },
  { name: "Thin Air", teaser: "Make rocket fuel out of Mars air and ice." },
  { name: "Escape Velocity", teaser: "Blast off with the rescue crew. Every kilogram counts." },
  { name: "Splashdown", teaser: "The long trip home. Then fire, parachutes and the sea." },
];

/**
 * The five sols of the chapter. Each one brings one new thing to look after.
 * The titles borrow the "go" and "hold" calls a flight team makes before each step.
 * `opens` is the message from ARIA that starts the sol, and shows its title card.
 */
export const SOLS: readonly { readonly title: string; readonly focus: string; readonly opens: MessageId }[] = [
  { title: "Go for Air", focus: "Air", opens: "ready" },
  { title: "Go for Power", focus: "Power and heat", opens: "forecast" },
  { title: "Go for Harvest", focus: "Food and water", opens: "clear" },
  { title: "Hold for Flare", focus: "Radiation", opens: "leak" },
  { title: "Go for Home", focus: "The call home", opens: "lastsol" },
];

/** Shown in the job list when every job that is left is a blue one. */
/** The job list shows two blue jobs and counts the rest, so it stays short. */
export const MORE_JOBS = (count: number) => `and ${count} more blue ${count === 1 ? "job" : "jobs"}`;
/** The job pill on a phone: the next job, and how many more are in the list. */
export const NEXT_JOB = "Next job:";
export const OTHER_JOBS = (count: number) => `${count} more`;
export const IDLE_HINT = "No yellow jobs right now. Do a blue job to earn parts!";

/** Extra goals shown at the end of a won chapter. */
export const BADGES: Readonly<Record<BadgeId, { readonly icon: IconName; readonly name: string; readonly how: string }>> = {
  air: { icon: "leaf", name: "Fresh air", how: "Keep the CO₂ out of the red and the oxygen at 19.5% or more." },
  warm: { icon: "flame", name: "Warm and cosy", how: "Never let the room get colder than 12 °C." },
  flare: { icon: "shield", name: "Flare smart", how: "Take no radiation in the solar flare. Stack the bags in time!" },
  jobs: { icon: "clipboard", name: "Busy bee", how: "Do every job, the blue ones too. The chores come back every morning!" },
  cards: { icon: "cards", name: "Card collector", how: "Find every fact card." },
  maker: { icon: "printer", name: "Maker", how: "Print every upgrade." },
};

/**
 * Hidden goals for curious players. Until one is found, the win screen shows only its riddle.
 * Never name the telescope outright: finding it is the fun.
 */
export const SECRETS: Readonly<Record<SecretId, { readonly name: string; readonly how: string; readonly riddle: string }>> = {
  stargazer: { name: "Stargazer", how: "You found Earth in the night sky of Mars.", riddle: "Leave the dotted path. Something out past the rover looks up at the stars." },
  skytour: { name: "Sky tour", how: "You found all 4 things in the telescope sky.", riddle: "Look up, and look all around. There are 4 things to find up there." },
  aurora: { name: "Aurora watcher", how: "You went outside to see the green sky.", riddle: "After the flare, the night sky does something special. Go out and see it!" },
  planner: { name: "Planner", how: "You made extra oxygen before the dust storm came.", riddle: "Listen to ARIA's tips. Get ready before trouble comes." },
  diy: { name: "Do it yourself", how: "You won without printing a single upgrade.", riddle: "Can you win without the 3D printer?" },
};
export const SECRET_IDS = Object.keys(SECRETS) as SecretId[];
export const SECRET_FOUND = "Secret found!";
export const NEW_FACT = "New fact card:";

export const FAILURES: Readonly<Record<Failure, Debrief>> = {
  co2: {
    title: "Too much CO₂",
    body: "The CO₂ in the air got to 4%. That is too much to stay awake.",
    lesson: "Give power to the air cleaner first. The air goes bad from too much CO₂ long before the oxygen runs out.",
    story: "This is a real danger. In 1970, on Apollo 13, the crew still had oxygen. It was the CO₂ that almost stopped them. They built a filter holder from a plastic bag, cardboard and tape.",
    source: FACTS.apollo13.source,
  },
  o2: {
    title: "Not enough oxygen",
    body: "The oxygen fell to 16%. At that level people get dizzy and cannot think well.",
    lesson: "Clean the solar panels to get more power, and keep the oxygen maker running. If there is a leak, fix it first.",
    story: "Mars air has almost no oxygen in it. But a machine called MOXIE, on the Perseverance rover, has made oxygen out of Mars air. One day machines like it could make air for astronauts.",
    source: FACTS.moxie.source,
  },
  cold: {
    title: "The base froze",
    body: "The room fell to 0 °C. That is when water turns to ice, and frozen pipes can burst.",
    lesson: "When the sun is gone, at night and in a dust storm, give 1 power to the heater. Do it before you feed the oxygen maker.",
    story: "Mars is about −59 °C on average, far colder than a kitchen freezer. Rovers on Mars use heaters to keep their parts warm through the night.",
    source: FACTS.cold.source,
  },
  radiation: {
    title: "Too much radiation",
    body: "You were outside in the solar flare for too long. In this game the flare is much stronger than a real one would feel on Mars.",
    lesson: "When ARIA warns you, drop what you are doing and go inside. Stack the supply bags into a shelter. Wait for the all clear.",
    story: "In August 1972 the Sun shot out a huge burst of radiation. It came between two Moon trips, Apollo 16 and Apollo 17. Astronauts on the Moon that week could have become very sick. Today NASA watches the Sun all the time.",
    source: { label: "NASA: keeping astronauts safe from radiation", url: "https://svs.gsfc.nasa.gov/13275" },
  },
  suit: {
    title: "Your suit ran out of air",
    body: "Outside, your suit is the only air you have. Mars air is almost all CO₂, and it is far too thin to breathe.",
    lesson: "Watch the suit bar. Turn back for the airlock when it is half empty. Two short trips are safer than one long one.",
    story: "A real NASA spacesuit holds about 7 hours of air. Every trip outside is planned around that before anyone opens the door.",
    source: FACTS.suit.source,
  },
};

/** The win screen: six cards, one tap each. */
export const SUCCESS = {
  title: "The base is alive!",
  aria: "You did it! You kept the base alive for 5 sols. Real crews do these jobs too.",
  toStats: "See how you did",
  statsTitle: "Your mission",
  rank: "Your rank",
  parts: "Parts earned",
  safe: "Base safe",
  safeOf: "of the time",
  newBest: "New best!",
  toCall: "Earth is calling",
  callTitle: "Earth is calling!",
  call: "Mission control has 5 questions for you.",
  answer: "Answer the call",
  lootTitle: "Your loot",
  badges: "Badges",
  cards: "Fact cards",
  secrets: "Secrets",
  secret: "A secret",
  tapToRead: "Tap a card or badge to read it.",
  missing: "Not found yet. Try the jobs you skipped.",
  toPostcard: "Make my postcard",
  tipStars: "Next time: keep the air good and the room warm for most of the mission. That earns 3 stars.",
  tipRank: "Next time: do the blue jobs too. Then you can be a Commander!",
  next: "A ship is on its way. Can you do it again and win every badge?",
  print: "Print my certificate",
} as const;

/** The player's rank, by parts earned. */
export const RANKS = ["Cadet", "Astronaut", "Commander"] as const;

/**
 * The final check with Earth. Questions without a `card` are the main lessons of
 * the mission; the rest are about fact cards, and are asked only if the card was found.
 */
export const QUIZ: readonly Question[] = [
  {
    prompt: "A storm takes half your power. Which machine do you keep on?",
    choices: ["The oxygen maker", "The air cleaner", "Turn both off"],
    answer: 1,
    why: "The room holds days of spare oxygen, but CO₂ gets dangerous fast. Let the oxygen dip and catch up later.",
    about: "co2",
  },
  {
    prompt: "Why are dusty solar panels a problem?",
    choices: ["Dust blocks the sunlight", "Dust makes them heavy", "Dust makes them too hot"],
    answer: 0,
    why: "Solar panels turn sunlight into power. Dust blocks the light. That is how the InSight lander ran out of power.",
    about: "o2",
  },
  {
    prompt: "The sun has set and the room is getting cold. What do you do?",
    choices: ["Wait for the morning", "Open the door", "Give power to the heater"],
    answer: 2,
    why: "With no sun on the walls the base loses heat fast. The heater needs power at night and in a dust storm.",
    about: "cold",
  },
  {
    prompt: "ARIA warns you of a solar flare. What do you do?",
    choices: ["Finish your job first", "Hide behind a rock", "Go inside and build a shelter"],
    answer: 2,
    why: "Walls and a stack of supply bags block the radiation. Real crews have a safe place to wait until the Sun is calm again.",
    about: "radiation",
  },
  {
    prompt: "You are outside and your suit air is half gone. What do you do?",
    choices: ["Turn back to the airlock", "Run to one more job", "Hold your breath"],
    answer: 0,
    why: "You need air for the walk home too. Real trips outside are planned around the air in the suit.",
    about: "suit",
  },
  {
    prompt: "You are in a closed room with no machines on. What goes wrong first?",
    choices: ["The oxygen runs out", "Too much CO₂ builds up", "Both at the same time"],
    answer: 1,
    why: "You breathe out 1 kg of CO₂ a day, and only a little is safe. It gets dangerous while there is still lots of oxygen.",
  },
  {
    prompt: "Why does the base have less power at night?",
    choices: ["The machines get tired", "The cold breaks the wires", "Solar panels need sunlight"],
    answer: 2,
    why: "Solar panels turn sunlight into power. No sun, no power. That is why some rovers carry a nuclear battery.",
  },
  {
    prompt: "The alarm rings on the Space Station. What are the crew's three steps?",
    choices: ["Run, hide, wait", "Warn, gather, work", "Stop, look, listen"],
    answer: 1,
    why: "They warn everyone, gather in one safe place, and only then work on the problem. You did the same for the leak.",
    card: "gather",
  },
  {
    prompt: "What can the crew of an Orion spaceship build a radiation shelter from?",
    choices: ["Their storage bags", "Solar panels", "Spare spacesuits"],
    answer: 0,
    why: "They stack the bags they already have on board into a thick wall, and wait behind it.",
    card: "shelter",
  },
  {
    prompt: "You say hello to Earth by radio from Mars. When do they hear it?",
    choices: ["Right away", "After 26 months", "After 4 to 22 minutes"],
    answer: 2,
    why: "Radio is as fast as light, but Mars is very far away. The wait changes as the two planets move.",
    card: "delay",
  },
  {
    prompt: "Why can you not breathe the air on Mars?",
    choices: ["It is too wet", "It is almost all CO₂, and very thin", "It is too windy"],
    answer: 1,
    why: "Mars air is almost all CO₂ and more than 100 times thinner than air on Earth. That is why you wear a suit.",
    card: "marsair",
  },
  {
    prompt: "Where does the Space Station get most of its drinking water?",
    choices: ["It cleans its used water", "It catches rain", "A ship brings it every day"],
    answer: 0,
    why: "It gets back 98 of every 100 drops, even from sweat and pee. Nothing is wasted in space.",
    card: "water",
  },
  {
    prompt: "Why do astronauts exercise about 2 hours every day?",
    choices: ["To stay warm", "To make power", "To keep bones and muscles strong"],
    answer: 2,
    why: "In space, bones and muscles have little work to do, so they get weak. Exercise keeps them strong.",
    card: "bones",
  },
  {
    prompt: "What did Space Station astronauts grow and eat in 2015?",
    choices: ["Apples", "Lettuce", "Potatoes"],
    answer: 1,
    why: "It was the first time astronauts ate salad grown in space. You grew some too!",
    card: "veggie",
  },
  {
    prompt: "The Opportunity rover was built to work for 90 sols. How long did it keep going?",
    choices: ["Almost 15 years", "90 sols exactly", "About 1 year"],
    answer: 0,
    why: "It drove on Mars from 2004 to 2018. Good machines, well looked after, can last a very long time.",
    card: "rover",
  },
];

/** The map of the Sun, Earth and Mars. The numbers in it are worked out from real orbits for the day it is opened. */
export const SPACE = {
  title: "Where are we in space?",
  picture: "A map of the Sun in the middle, with Earth and Mars on their paths around it",
  sun: "The Sun",
  earth: "Earth",
  mars: "Mars: you are here",
  distance: (millionKm: number, minutes: number) => `Mars is ${millionKm} million km from Earth. A radio call takes about ${minutes} minutes to get there.`,
  today: "Today. Slide to move time forward and watch Earth race ahead.",
  later: (months: number) => `In ${months} ${months === 1 ? "month" : "months"}.`,
  launch: (month: string) => `A ship can only set off when Earth and Mars line up just right. That happens about every 26 months. The next good time is around ${month}.`,
  source: { label: "Orbits: NASA JPL", url: "https://ssd.jpl.nasa.gov/planets/approx_pos.html" },
} as const;

/** The hidden telescope behind the rover. Each thing in its sky has one short line. */
export const TELESCOPE = {
  title: "Through the telescope",
  hint: "Drag to look around. Can you find Earth? The clock stops while you look.",
  view: "Telescope view. Use the arrow keys or the arrow buttons to look around.",
  sky: "Night sky",
  system: "Solar system",
  zoomIn: "Zoom in",
  zoomOut: "Zoom out",
  look: { up: "Look up", down: "Look down", left: "Look left", right: "Look right" },
  nothing: "Just stars here. Keep looking!",
  things: {
    earth: {
      name: "Earth",
      text: "Hi, home! That blue dot is Earth. Somewhere down there, someone is eating your snacks. Zoom in to see our Moon beside it.",
    },
    phobos: {
      name: "Phobos",
      text: "Phobos, the bigger moon of Mars. It flies around Mars so fast that it rises in the west and sets in the east.",
    },
    deimos: {
      name: "Deimos",
      text: "Deimos, the little moon of Mars. It is only about 15 km long. You could walk across it in an afternoon!",
    },
    jupiter: {
      name: "Jupiter",
      text: "Jupiter, the biggest planet. About 1,000 Earths could fit inside it. Zoom in: the 4 tiny dots are its biggest moons. Galileo first saw them in 1610.",
    },
  },
} as const;

/** The panel at the weather station, once it has been read. The numbers are real, from engine/weather.ts. */
export const WEATHER = {
  title: "Real Mars weather",
  from: (sol: number, date: string) => `The Curiosity rover measured this on Mars. It was its sol ${sol} there (${date}).`,
  day: "Warmest, in the day",
  night: "Coldest, at night",
  pressure: "Air pressure",
  thin: "On Earth the air presses more than 100 times as hard.",
  source: { label: "NASA: the weather station on Curiosity", url: "https://science.nasa.gov/mission/msl-curiosity/science-instruments/" },
} as const;

/** The words on the certificate a player can print after the final check. */
export const CERTIFICATE = {
  title: "Junior Astronaut",
  goesTo: "This certificate goes to",
  line: "who finished astronaut training on Mars and kept the base alive for 5 sols.",
  sign: "Write your name here",
  seal: (rank: string) => `${rank} seal`,
  wings: (wings: number) => `${wings} of 5 wings`,
  secrets: (found: number, of: number) => `${found} of ${of} secrets`,
  where: "Mars Base, sol 5",
  signed: "Base computer",
} as const;

/**
 * The postcard a player makes after the win, to keep and show their family.
 * The distance and the radio time are worked out from real orbits for the day it is made.
 */
export const POSTCARD = {
  title: "Your postcard from Mars",
  name: "Your first name (you can skip this)",
  privacy: "Your name stays on this computer. It is not saved or sent anywhere.",
  greetings: "Greetings from",
  mars: "MARS",
  hello: "Hello from Mars!",
  kept: "I kept the base alive for 5 sols.",
  to: "To: Earth",
  from: (name: string) => `From: ${name || "a Junior Astronaut"}`,
  where: "Mars Base, sol 5",
  away: (millionKm: number) => `${millionKm} million km from home`,
  radio: (minutes: number) => `A radio call takes ${minutes} minutes to get there today.`,
  arrive: (time: string) => `If you sent it by radio now, it would reach Earth at ${time}.`,
  picture: (name: string, rank: string) => `Your postcard. It says Greetings from Mars, from ${name || "a Junior Astronaut"}, ${rank}.`,
  save: "Save my postcard",
  saved: "Saved! Look in your downloads, then show your family.",
  toCertificate: "Get my certificate",
} as const;

/**
 * The "?" window: short answers to the big ideas behind the game, for a player
 * who is curious or stuck. Each topic can show one fact card's text. Never
 * mention the hidden telescope here.
 */
export const LEARN = {
  open: "Learn about Mars",
  title: "Learn about Mars",
  intro: "Tap a question to read the answer. The game waits while you read.",
  didYouKnow: "Did you know?",
  close: "Back to the game",
  topics: [
    {
      icon: "sunset",
      question: "What is a sol?",
      answer: ["A sol is one day on Mars.", "Your job is to keep the base alive for 5 sols. Then the big air system is ready."],
      fact: "sol",
    },
    {
      icon: "wind",
      question: "Air: oxygen and CO₂",
      answer: [
        "You breathe in a gas called oxygen. You breathe out a gas called CO₂.",
        "The oxygen maker makes oxygen. The air cleaner takes CO₂ out of the air.",
        "Watch the CO₂ most. It gets dangerous long before the oxygen runs out.",
      ],
      fact: "co2",
    },
    {
      icon: "bolt",
      question: "Power and heat",
      answer: [
        "Every machine needs power. At the power box, you choose which ones get it.",
        "Solar panels turn sunlight into power. At night they stop. Dust stops them too.",
        "Mars is very cold. When the sun is gone, give 1 power to the heater.",
      ],
      fact: "cold",
    },
    {
      icon: "leaf",
      question: "Food and water",
      answer: ["There are no shops on Mars! Astronauts bring food, and grow some too.", "Salad needs water and light to grow. When it is big, pick it and eat."],
      fact: "water",
    },
    {
      icon: "radiation",
      question: "Radiation",
      answer: [
        "The Sun sends out radiation. It is made of tiny, fast bits you cannot see.",
        "Too much of it can make you very sick.",
        "In a solar flare, go inside. Stack the supply bags into a shelter, and wait for ARIA to say all clear.",
      ],
      fact: "flare",
    },
    {
      icon: "dish",
      question: "Talking to Earth",
      answer: ["Radio is as fast as light. But Mars is very far away, so every message takes minutes to arrive.", "Here is where Earth and Mars are today:"],
      fact: "delay",
      map: true,
    },
    {
      icon: "gamepad",
      question: "How to play",
      answer: [
        "Walk with the arrow keys or W A S D. On a phone, tap the ground.",
        "Press E, or tap a machine, to use it.",
        "Follow the yellow dots to your next job. Yellow jobs keep you alive.",
        "Blue jobs are extra. They give you parts for the 3D printer.",
        "Press P to pause.",
      ],
    },
  ],
} as const satisfies {
  readonly topics: readonly { readonly icon: IconName; readonly question: string; readonly answer: readonly string[]; readonly fact?: FactId; readonly map?: boolean }[];
} & Record<string, unknown>;
