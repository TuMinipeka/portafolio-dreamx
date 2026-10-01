/**
 * Generative sound for the flight, built entirely with the Web Audio API.
 * Nothing is created until the visitor turns sound on (see SoundToggle), and
 * every cue below is silent while it's off: `sound.engine` is null.
 *
 * Ambient:   wind (noise through a rising band-pass) + a drone that climbs an octave.
 * Feedback:  hover ticks, compile-stage clicks.
 * Projects:  each station has its own note (APEX, Hub, TENANT form a rising A-major
 *            triad, like the altitudes), plus a short texture that tells what it is:
 *            an engine revving, a crowd, data packets.
 */

const smoothstep = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export type ProjectSound = "apex" | "hub" | "tenant";

/** One note per station, rising with altitude: A3, C#4, E4. The ground is E3. */
export const PROJECT_NOTE: Record<ProjectSound | "ground", number> = {
  ground: 164.81,
  apex: 220,
  hub: 277.18,
  tenant: 329.63,
};

export function createEngine() {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // White noise, shared by the wind, the sweep and the crowd.
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // Wind: looped noise shaped by a band-pass filter.
  const wind = ctx.createBufferSource();
  wind.buffer = noise;
  wind.loop = true;
  const windFilter = ctx.createBiquadFilter();
  windFilter.type = "bandpass";
  windFilter.Q.value = 0.8;
  const windGain = ctx.createGain();
  wind.connect(windFilter).connect(windGain).connect(master);
  wind.start();

  // Drone: root and fifth, softened by a low-pass.
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 600;
  const droneGain = ctx.createGain();
  droneFilter.connect(droneGain).connect(master);
  const root = ctx.createOscillator();
  const fifth = ctx.createOscillator();
  root.type = fifth.type = "sine";
  root.connect(droneFilter);
  fifth.connect(droneFilter);
  root.start();
  fifth.start();

  // Shimmer: what's left at the edge of space.
  const shimmer = ctx.createOscillator();
  shimmer.frequency.value = 880;
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.value = 0;
  shimmer.connect(shimmerGain).connect(master);
  shimmer.start();

  const now = () => ctx.currentTime;
  const glide = (param: AudioParam, value: number, time = 0.4) => param.setTargetAtTime(value, now(), time);

  /** A short enveloped tone. */
  const blip = (frequency: number, duration: number, level: number, type: OscillatorType = "sine", delay = 0) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now() + delay;
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  };

  /** A burst of filtered noise. */
  const hiss = (from: number, to: number, duration: number, level: number, q = 1.2, delay = 0) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = q;
    const gain = ctx.createGain();
    const t = now() + delay;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(gain).connect(master);
    src.start(t, Math.random());
    src.stop(t + duration + 0.05);
  };

  // Bus for the per-station soundscapes (see soundscape.ts), under the master fader.
  const ambience = ctx.createGain();
  ambience.gain.value = 0.9;
  ambience.connect(master);

  return {
    /** Low-level access for the soundscapes. */
    ctx,
    ambience,
    noise,
    resume() {
      ctx.resume();
      glide(master.gain, 0.7, 0.6);
    },
    suspend() {
      glide(master.gain, 0, 0.2);
      setTimeout(() => ctx.suspend(), 600);
    },
    /** progress: 0 on the ground, 1 at the Kármán line. */
    fly(progress: number) {
      const air = 1 - smoothstep(progress, 0.85, 1);
      glide(windFilter.frequency, 180 * 2 ** (progress * 3.5));
      glide(windGain.gain, 0.09 * air);
      glide(root.frequency, 55 * 2 ** progress);
      glide(fifth.frequency, 82.5 * 2 ** progress);
      glide(droneGain.gain, 0.05 * air);
      glide(shimmerGain.gain, 0.012 * smoothstep(progress, 0.85, 1), 0.8);
    },
    tick() {
      blip(1600, 0.05, 0.025);
    },
    click() {
      blip(320, 0.12, 0.06, "triangle");
    },

    /* ---------- Project transitions ---------- */

    /** A station's note, with a soft octave above for body. */
    note(frequency: number, level = 0.07, delay = 0) {
      blip(frequency, 0.9, level, "sine", delay);
      blip(frequency * 2, 0.6, level * 0.25, "sine", delay);
    },
    /** The scaffold columns drawing in: twelve dry clicks. */
    scaffold() {
      for (let i = 0; i < 12; i++) blip(2400 + i * 40, 0.018, 0.02, "square", i * 0.015);
    },
    /** Air rushing past during the climb (or the descent). */
    sweep(up: boolean) {
      hiss(up ? 300 : 2400, up ? 2400 : 300, 0.55, 0.12, 0.9);
    },
    /** The new layout landing in place. */
    thud() {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now();
      osc.frequency.setValueAtTime(90, t);
      osc.frequency.exponentialRampToValueAtTime(42, t + 0.18);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      osc.connect(gain).connect(master);
      osc.start(t);
      osc.stop(t + 0.25);
    },
    /** Each project's signature, under a second long. */
    texture(project: ProjectSound) {
      const t = now();
      if (project === "apex") {
        // An F1 engine revving: FM synthesis, carrier and modulator rising together.
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const depth = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        carrier.type = "sawtooth";
        modulator.frequency.setValueAtTime(60, t);
        modulator.frequency.exponentialRampToValueAtTime(240, t + 0.7);
        depth.gain.value = 120;
        carrier.frequency.setValueAtTime(90, t);
        carrier.frequency.exponentialRampToValueAtTime(330, t + 0.7);
        filter.type = "lowpass";
        filter.frequency.value = 1400;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.05, t + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
        modulator.connect(depth).connect(carrier.frequency);
        carrier.connect(filter).connect(gain).connect(master);
        carrier.start(t);
        modulator.start(t);
        carrier.stop(t + 0.9);
        modulator.stop(t + 0.9);
      } else if (project === "hub") {
        // A crowd: overlapping bursts of voice-band noise.
        for (let i = 0; i < 9; i++) {
          const f = 500 + Math.random() * 900;
          hiss(f, f * (0.85 + Math.random() * 0.3), 0.18 + Math.random() * 0.2, 0.05, 6, i * 0.07);
        }
      } else {
        // Data packets: a rhythmic run of tiny high clicks.
        for (let i = 0; i < 12; i++) {
          blip(i % 3 === 0 ? 3200 : 2400, 0.015, i % 3 === 0 ? 0.035 : 0.02, "square", i * 0.06);
        }
      }
    },
  };
}

export type SoundEngine = ReturnType<typeof createEngine>;

/** The single sound bus: the engine while sound is on, null otherwise. */
export const sound: { engine: SoundEngine | null } = { engine: null };
