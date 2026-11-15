// Tiny synth for game sounds, made with the Web Audio API. No audio files to
// load or licence. Short tunes play on events; a quiet background of wind, the
// base's hum and, in the solar flare, a radiation counter plays underneath.

const TUNES = {
  tap: [660],
  talk: [520, 700],
  done: [523, 659, 784],
  buy: [392, 523, 784, 1047],
  alert: [440, 330, 440, 330],
  fail: [330, 262, 196],
  win: [523, 659, 784, 1047, 1319],
  secret: [1047, 1319, 1568, 2093, 1568, 2093],
} as const;
export type Sfx = keyof typeof TUNES;

let ctx: AudioContext | undefined;

/** Play a short tune. Safe to call before the first click: the browser keeps it silent until then. */
export function sfx(name: Sfx) {
  ctx ??= new AudioContext();
  void ctx.resume();
  TUNES[name].forEach((hz, i) => {
    const at = ctx!.currentTime + i * 0.09;
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "triangle";
    osc.frequency.value = hz;
    gain.gain.setValueAtTime(0.1, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.2);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(at);
    osc.stop(at + 0.22);
  });
}

/** A loop of sound made from numbers: `sample(i, rate)` gives each sample, -1 to 1. */
function buffer(c: AudioContext, seconds: number, sample: (i: number, rate: number) => number) {
  const b = c.createBuffer(1, Math.round(c.sampleRate * seconds), c.sampleRate);
  const data = b.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = sample(i, c.sampleRate);
  return b;
}

/** Brown noise: white noise with the hiss smoothed away, so it rumbles like wind. */
function brown() {
  let last = 0;
  return () => (last = Math.max(-1, Math.min(1, last + (Math.random() * 2 - 1) * 0.04))) * 2.5;
}

/** How loud each background sound should be, 0 to 1. `outside` lets the wind through unmuffled. */
export type Ambience = { readonly wind: number; readonly outside: boolean; readonly hum: number; readonly clicks: number };

type Bed = { master: GainNode; wind: GainNode; tone: BiquadFilterNode; hum: GainNode; clicks: GainNode; counter: AudioBufferSourceNode };
let bed: Bed | undefined;
let wanted: Ambience | null = null;
let applied: Ambience | null | undefined;

/** Peak volumes, all well under the 0.1 of a tune, so the background never drowns out what matters. */
const LOUD = { wind: 0.05, hum: 0.012, clicks: 0.06 } as const;

/** Build every background node once. Volumes change later; nodes are never made per frame. */
function build(c: AudioContext): Bed {
  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  const loop = (b: AudioBuffer) => {
    const src = c.createBufferSource();
    src.buffer = b;
    src.loop = true;
    src.start();
    return src;
  };

  // Wind: rumbling noise through a filter, swelling in slow gusts.
  const tone = c.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 300;
  const gusts = c.createGain();
  gusts.gain.value = 0.7;
  const lfo = c.createOscillator();
  lfo.frequency.value = 0.13;
  const depth = c.createGain();
  depth.gain.value = 0.3;
  lfo.connect(depth).connect(gusts.gain);
  lfo.start();
  const wind = c.createGain();
  wind.gain.value = 0;
  loop(buffer(c, 6, brown()))
    .connect(tone)
    .connect(gusts)
    .connect(wind)
    .connect(master);

  // The hum of the machines: two notes a hair apart, so it slowly throbs.
  const hum = c.createGain();
  hum.gain.value = 0;
  for (const hz of [110, 110.6, 220]) {
    const osc = c.createOscillator();
    osc.frequency.value = hz;
    osc.connect(hum);
    osc.start();
  }
  hum.connect(master);

  // A radiation counter: random clicks. Playing the loop faster packs the clicks closer.
  const clickAt = new Set(Array.from({ length: 14 }, () => Math.floor(Math.random() * 2 * c.sampleRate)));
  let ring = 0;
  const counter = loop(
    buffer(c, 2, (i) => {
      if (clickAt.has(i)) ring = 1;
      ring *= 0.93;
      return ring * (Math.random() * 2 - 1);
    }),
  );
  const clicks = c.createGain();
  clicks.gain.value = 0;
  counter.connect(clicks).connect(master);

  return { master, wind, tone, hum, clicks, counter };
}

function apply() {
  if (!ctx || !bed || wanted === applied) return;
  const at = ctx.currentTime;
  const glide = (param: AudioParam, to: number, seconds = 0.6) => param.setTargetAtTime(to, at, seconds / 3);
  glide(bed.master.gain, wanted ? 1 : 0, 0.4);
  if (wanted) {
    glide(bed.wind.gain, wanted.wind * LOUD.wind, 1.5);
    // Indoors the walls take the hiss out of the wind.
    glide(bed.tone.frequency, wanted.outside ? 900 : 260, 0.8);
    glide(bed.hum.gain, wanted.hum * LOUD.hum, 1.2);
    glide(bed.clicks.gain, wanted.clicks * LOUD.clicks, 0.3);
    glide(bed.counter.playbackRate, 0.4 + wanted.clicks * 1.8, 0.3);
  }
  applied = wanted;
}

/** Start the sound after the first click or key press, as browsers require. */
export function wake() {
  ctx ??= new AudioContext();
  void ctx.resume();
  bed ??= build(ctx);
  applied = undefined;
  apply();
}

/** Set the background sounds, or `null` for silence. Cheap to call every frame: only a change touches the audio. */
export function ambience(a: Ambience | null) {
  if (a?.wind === wanted?.wind && a?.outside === wanted?.outside && a?.hum === wanted?.hum && a?.clicks === wanted?.clicks) return;
  wanted = a;
  apply();
}

/** Earth answers: the beep that opened old mission radio calls, then a burst of crackle. */
export function radio() {
  if (!ctx) return;
  const at = ctx.currentTime;
  const beep = ctx.createOscillator();
  const level = ctx.createGain();
  beep.frequency.value = 2525;
  level.gain.setValueAtTime(0.03, at);
  level.gain.setValueAtTime(0, at + 0.25);
  beep.connect(level).connect(ctx.destination);
  beep.start(at);
  beep.stop(at + 0.3);

  const crackle = ctx.createBufferSource();
  crackle.buffer = buffer(ctx, 1.2, (i, rate) => (Math.random() * 2 - 1) * (Math.random() < 0.002 ? 1 : 0.25) * Math.min(1, (1.2 - i / rate) * 2));
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1800;
  const quiet = ctx.createGain();
  quiet.gain.value = 0.08;
  crackle.connect(band).connect(quiet).connect(ctx.destination);
  crackle.start(at + 0.3);
}
