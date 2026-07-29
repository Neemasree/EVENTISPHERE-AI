/**
 * Minimal Web Audio API sound effects — no external files needed.
 * All sounds are synthesised on-the-fly.
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.15) {
  try {
    const ac  = getCtx();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g);
    g.connect(ac.destination);
    osc.type      = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    g.gain.setValueAtTime(gain, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch (_) { /* audio not supported */ }
}

export const Sounds = {
  /** Soft notification ping */
  notify: () => { tone(880, 0.18, 'sine', 0.12); setTimeout(() => tone(1100, 0.14, 'sine', 0.08), 120); },

  /** Success / recommendation applied */
  success: () => {
    tone(660, 0.12, 'sine', 0.12);
    setTimeout(() => tone(880, 0.12, 'sine', 0.12), 100);
    setTimeout(() => tone(1100, 0.18, 'sine', 0.10), 200);
  },

  /** Warning alert */
  warning: () => { tone(440, 0.25, 'square', 0.08); setTimeout(() => tone(360, 0.25, 'square', 0.08), 280); },

  /** Critical / emergency siren (2 pulses) */
  critical: () => {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => { tone(880, 0.18, 'sawtooth', 0.12); }, i * 280);
      setTimeout(() => { tone(660, 0.18, 'sawtooth', 0.10); }, i * 280 + 140);
    }
  },

  /** Scenario trigger blip */
  trigger: () => { tone(600, 0.1, 'triangle', 0.1); setTimeout(() => tone(900, 0.12, 'triangle', 0.08), 80); },
};
