// Tiny synth for game sounds: a few notes each, made with the Web Audio API.
// No audio files to load or license.

const TUNES = {
  tap: [660],
  talk: [520, 700],
  done: [523, 659, 784],
  buy: [392, 523, 784, 1047],
  alert: [440, 330, 440, 330],
  fail: [330, 262, 196],
  win: [523, 659, 784, 1047, 1319],
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
