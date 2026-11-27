// All sound in Tilly's Great Thanksgiving Escape is synthesised live with
// the Web Audio API — no audio files ship with the game. A gobble is two
// quick square-wave honks, a coin is a bright sine ping, the farmer yells
// in a low sawtooth, and the background is a cheerful plucked banjo-ish
// loop built from short triangle-wave notes.

const MELODY = [
  // [midi note, beats] — an original autumn-morning tune, looped.
  [72, 1], [76, 1], [79, 1], [76, 1], [74, 1], [71, 1],
  [72, 2], [67, 1], [72, 1], [74, 1], [76, 2], [79, 1],
  [81, 1], [79, 1], [76, 1], [74, 1], [72, 2], [67, 2],
];
const BEAT_SECONDS = 0.22;

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
    this.musicOn = false;
  }

  // Browsers only let audio start after a user gesture; unlock() is called
  // from the first key press or click, and every play() after that works.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    this.ctx = new AudioCtx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  tone(freq, dur, type = 'sine', volume = 0.25, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Two quick honks: Tilly's gobble when she jumps or flaps.
  gobble() {
    this.tone(320, 0.09, 'square', 0.16, 0, 240);
    this.tone(380, 0.09, 'square', 0.16, 0.1, 300);
  }

  flap() {
    this.tone(500, 0.07, 'triangle', 0.14, 0, 700);
  }

  // Bright two-note ping for corn and pie.
  pickup() {
    this.tone(880, 0.1, 'sine', 0.22);
    this.tone(1318, 0.16, 'sine', 0.2, 0.08);
  }

  goldenFeather() {
    this.tone(660, 0.12, 'sine', 0.2);
    this.tone(880, 0.12, 'sine', 0.2, 0.09);
    this.tone(1108, 0.2, 'sine', 0.2, 0.18);
  }

  // A dull thud when Tilly stumbles into something.
  thud() {
    this.tone(140, 0.18, 'sawtooth', 0.28, 0, 70);
    this.tone(90, 0.22, 'triangle', 0.3, 0.02, 50);
  }

  // The farmer's "HEY! GET BACK HERE!" — a low sawtooth growl.
  farmerYell() {
    this.tone(180, 0.28, 'sawtooth', 0.22, 0, 120);
    this.tone(220, 0.22, 'sawtooth', 0.18, 0.16, 150);
  }

  // A whoosh as a carving knife whistles past.
  knifeWhistle() {
    this.tone(1400, 0.22, 'sine', 0.12, 0, 500);
  }

  // The happy escape fanfare: four rising notes.
  fanfare() {
    [72, 76, 79, 84].forEach((n, i) => {
      this.tone(midiToFreq(n), 0.28, 'triangle', 0.24, i * 0.14);
    });
    this.tone(midiToFreq(84), 0.5, 'triangle', 0.2, 0.6);
  }

  // The sad trombone-ish sting when the farmer catches Tilly.
  caughtSting() {
    [58, 57, 56, 53].forEach((n, i) => {
      this.tone(midiToFreq(n), 0.32, 'sawtooth', 0.16, i * 0.26);
    });
  }

  startMusic() {
    if (!this.ctx || this.musicOn) return;
    this.musicOn = true;
    this.musicStep = 0;
    const tick = () => {
      if (!this.musicOn) return;
      const [note, beats] = MELODY[this.musicStep % MELODY.length];
      // A soft pluck on the beat, plus a quiet bass root every four steps.
      this.tone(midiToFreq(note), BEAT_SECONDS * beats * 0.9, 'triangle', 0.1);
      if (this.musicStep % 4 === 0) {
        this.tone(midiToFreq(note - 24), BEAT_SECONDS * 2, 'sine', 0.1);
      }
      this.musicStep++;
      this.musicTimer = setTimeout(tick, BEAT_SECONDS * beats * 1000);
    };
    tick();
  }

  stopMusic() {
    this.musicOn = false;
    if (this.musicTimer) clearTimeout(this.musicTimer);
    this.musicTimer = null;
  }
}
