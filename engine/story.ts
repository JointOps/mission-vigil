import type { BadgeId } from "./scoring.ts";
import type { FactId, Failure, MessageId, Upgrade } from "./simulate.ts";

// Every word the player reads. Written for young readers: short sentences,
// common words, one idea at a time. A number is given with what it means.

export type Source = { readonly label: string; readonly url: string };
export type Fact = { readonly title: string; readonly text: string; readonly source: Source };
export type Debrief = { readonly title: string; readonly body: string; readonly lesson: string; readonly story: string; readonly source: Source };
export type Question = { readonly prompt: string; readonly choices: readonly string[]; readonly answer: number; readonly why: string };

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
  leak: ["This is sol 4. Warning! I hear air hissing.", "There is a hole by the outside door. Our air is leaking out!", "Take a patch from the shelf and fix the hole from outside. Be quick!"],
  flare: [
    "Alarm! The Sun just shot out a burst of radiation. It is called a solar flare.",
    "Radiation is made of tiny, fast bits you cannot see. Too much of it can make you very sick.",
    "It will hit us in a few seconds. The walls of the base keep you safe. Get inside, and stay inside until it is over!",
  ],
  allclear: [
    "All clear! The flare is over. You can go out again.",
    "Look, the ground glows green! The sky high above us is shining. That is called an aurora.",
  ],
  lastsol: [
    "Good morning! This is sol 5, the last one. The big air system will be ready at sunset.",
    "Earth can send a ship for us. But first they must know we are alive.",
    "Make sure the radio dish points at Earth.",
  ],
  earth: [
    "The dish is pointing at Earth. Listen!",
    "“Mars Base, this is Earth. We hear you! Ships can only fly to Mars about every 26 months. The next one is coming for you. Keep the base alive.”",
    "They heard us! We can do this. Together.",
  ],
  restart: ["Good news! The big air system is ready.", "Go to the big desk and press the green button!"],
};

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
};
export const FACT_IDS = Object.keys(FACTS) as FactId[];

/** Things the 3D printer can make from parts. */
export const UPGRADES: Readonly<Record<Upgrade, { readonly name: string; readonly text: string }>> = {
  boots: { name: "Fast boots", text: "You walk faster." },
  tools: { name: "Power tools", text: "You finish jobs twice as fast." },
  tank: { name: "Big air tank", text: "Your suit air lasts longer outside." },
  walls: { name: "Thick walls", text: "The base stays warm for longer." },
  battery: { name: "Spare battery", text: "1 more power, day and night." },
};

/** The five sols of the chapter. Each one brings one new thing to look after. */
export const SOLS: readonly { readonly title: string; readonly focus: string }[] = [
  { title: "First Breath", focus: "Air" },
  { title: "Keep the Lights On", focus: "Power and heat" },
  { title: "Green Thumb", focus: "Food and water" },
  { title: "Storm Warning", focus: "Radiation" },
  { title: "Launch Window", focus: "The call home" },
];

/** Extra goals shown at the end of a won chapter. */
export const BADGES: Readonly<Record<BadgeId, { readonly name: string; readonly how: string }>> = {
  air: { name: "Fresh air", how: "Keep the CO₂ out of the red and the oxygen at 19.5% or more." },
  warm: { name: "Warm and cosy", how: "Never let the room get colder than 12 °C." },
  flare: { name: "Flare smart", how: "Be inside for the whole solar flare." },
  jobs: { name: "Busy bee", how: "Do every job, the blue ones too." },
  cards: { name: "Card collector", how: "Find every fact card." },
  maker: { name: "Maker", how: "Print every upgrade." },
};

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
    lesson: "When ARIA warns you, drop what you are doing and go inside. The walls keep you safe. Wait for the all clear.",
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

export const SUCCESS = {
  title: "The base is alive!",
  body: "You woke up a sleeping base and kept it alive for 5 sols: air, power, heat, food and a solar flare. The machines you used are real ideas. The Space Station cleans CO₂ from its air and recycles its water, and MOXIE has made oxygen on Mars.",
  next: "The big air system is running, and a ship is on its way. Can you do it again and win every badge?",
} as const;

/** The player's rank, by parts earned. */
export const RANKS = ["Cadet", "Astronaut", "Commander"] as const;

export const QUIZ: readonly Question[] = [
  {
    prompt: "You are in a closed room with no machines on. What goes wrong first?",
    choices: ["The oxygen runs out", "Too much CO₂ builds up", "Both at the same time"],
    answer: 1,
    why: "You breathe out 1 kg of CO₂ a day, and only a little is safe. It gets dangerous while there is still lots of oxygen.",
  },
  {
    prompt: "A storm takes half your power. Which machine do you keep on?",
    choices: ["The oxygen maker", "The air cleaner", "Turn both off"],
    answer: 1,
    why: "The room holds days of spare oxygen, but CO₂ gets dangerous fast. Let the oxygen dip and catch up later.",
  },
  {
    prompt: "Why does the base have less power at night?",
    choices: ["The machines get tired", "Solar panels need sunlight", "The cold breaks the wires"],
    answer: 1,
    why: "Solar panels turn sunlight into power. No sun, no power. That is why some rovers carry a nuclear battery.",
  },
  {
    prompt: "ARIA warns you of a solar flare. What do you do?",
    choices: ["Finish your job first", "Go inside and wait", "Hide behind a rock"],
    answer: 1,
    why: "Thick walls block the radiation. Real crews have a safe place to wait until a solar storm has passed.",
  },
  {
    prompt: "Why are dusty solar panels a problem?",
    choices: ["Dust makes them heavy", "Dust blocks the sunlight", "Dust makes them too hot"],
    answer: 1,
    why: "Solar panels turn sunlight into power. Dust blocks the light. That is how the InSight lander ran out of power.",
  },
];
