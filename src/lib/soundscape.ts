import { sonic, type SonicEvent } from "./sonic";
import type { SoundEngine } from "./sound";

/**
 * Per-station soundscapes. Each scene is generated from the state its 3D object
 * publishes on `sonic`, so what you see is what you hear:
 *
 *   log      robotics workshop: a servo that whines with the arm's speed, grip clacks, radio chirps
 *   about    constellation: a breathing A-major pad; stars ring pentatonic notes, projects arpeggiate their tools
 *   apex     the track: an engine synced to the car (revs on straights, drops in corners), panned and Doppler-shifted
 *   hub      the event: crowd murmur that opens up around the cursor, a soft scanner beep per check-in
 *   tenant   the data center: server hum and fans, a click per packet; hovering a tenant muffles the others
 *   contact  the edge of space: near silence, the metal logo rings like a bell when turned, rare star glints
 *
 * Scenes are created lazily the first time they become audible, and each one's level
 * follows `sonic.level` (the same proximity × presence as the visuals), so scrolling
 * crossfades them and project transitions duck them. Everything stays in A major.
 */

const A_PENTATONIC = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37, 659.25, 739.99];

type Scene = { update(level: number, dt: number): void; event?(e: SonicEvent): void };
type Scenes = Partial<Record<keyof typeof sonic.level, Scene>>;

// Scenes outlive a mute/unmute: the audio graph stays built for the engine's lifetime.
const built = new WeakMap<SoundEngine, Scenes>();

export function startSoundscape(engine: SoundEngine) {
  const { ctx, ambience, noise } = engine;
  const set = (param: AudioParam, value: number, time = 0.08) => param.setTargetAtTime(value, ctx.currentTime, time);

  /* ---------- small building blocks ---------- */

  const channel = (pan = 0) => {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const panner = ctx.createStereoPanner();
    panner.pan.value = pan;
    gain.connect(panner).connect(ambience);
    return { gain, panner };
  };

  const noiseSource = () => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    src.start(0, Math.random() * 1.9);
    return src;
  };

  /** One enveloped tone into a destination node. */
  const tone = (
    to: AudioNode,
    frequency: number,
    duration: number,
    level: number,
    { type = "sine" as OscillatorType, delay = 0, pan = 0, attack = 0.005 } = {},
  ) => {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();
    osc.type = type;
    osc.frequency.value = frequency;
    panner.pan.value = pan;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(level, 0.0002), t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain).connect(panner).connect(to);
    osc.start(t);
    osc.stop(t + duration + 0.05);
  };

  /** A filtered noise burst. */
  const burst = (to: AudioNode, frequency: number, q: number, duration: number, level: number, delay = 0) => {
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter).connect(gain).connect(to);
    src.start(t, Math.random() * 1.5);
    src.stop(t + duration + 0.05);
  };

  /* ---------- scenes ---------- */

  const scenes: Record<keyof typeof sonic.level, () => Scene> = {
    log() {
      const out = channel(0.25);
      // Servo: a narrow band of a sawtooth, pitched by how fast the joints move.
      const servo = ctx.createOscillator();
      servo.type = "sawtooth";
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 9;
      const servoGain = ctx.createGain();
      servoGain.gain.value = 0;
      servo.connect(band).connect(servoGain).connect(out.gain);
      servo.start();
      let nextChirp = ctx.currentTime + 3;

      return {
        update(level) {
          set(out.gain.gain, level);
          const speed = Math.min(sonic.armSpeed, 3);
          set(servo.frequency, 140 + speed * 420, 0.05);
          set(band.frequency, 600 + speed * 1400, 0.05);
          set(servoGain.gain, Math.min(speed * 0.05, 0.07), 0.06);
          // Radio link between the glove and the arm: three quick FM-ish bleeps now and then.
          if (level > 0.2 && ctx.currentTime > nextChirp) {
            nextChirp = ctx.currentTime + 4 + Math.random() * 6;
            for (let i = 0; i < 3; i++)
              tone(out.gain, 1400 + Math.random() * 1200, 0.04, 0.02, { type: "square", delay: i * 0.07 });
          }
        },
        event(e) {
          if (e.type !== "grip") return;
          // Gripper: a dry mechanical clack, lower when it opens.
          burst(out.gain, e.closed ? 2600 : 1700, 3, 0.05, 0.12);
          tone(out.gain, e.closed ? 110 : 85, 0.09, 0.08, { type: "triangle" });
        },
      };
    },

    about() {
      const out = channel(0.2);
      // Pad: A major, through a soft low-pass, breathing on a slow LFO.
      const pad = ctx.createGain();
      pad.gain.value = 0.5;
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 900;
      pad.connect(lowpass).connect(out.gain);
      for (const [f, type] of [
        [110, "sine"],
        [220, "triangle"],
        [277.18, "sine"],
        [329.63, "sine"],
      ] as const) {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.value = f;
        osc.detune.value = (Math.random() - 0.5) * 8;
        const g = ctx.createGain();
        g.gain.value = 0.06;
        osc.connect(g).connect(pad);
        osc.start();
      }
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.08;
      const depth = ctx.createGain();
      depth.gain.value = 0.25;
      lfo.connect(depth).connect(pad.gain);
      lfo.start();

      const bell = (f: number, delay = 0) => {
        tone(out.gain, f, 1.2, 0.05, { delay });
        tone(out.gain, f * 2, 0.6, 0.012, { delay });
      };
      return {
        update(level) {
          set(out.gain.gain, level * 0.8, 0.3);
        },
        event(e) {
          if (e.type === "star") bell(A_PENTATONIC[e.note % A_PENTATONIC.length]);
          if (e.type === "arpeggio") e.notes.forEach((n, i) => bell(A_PENTATONIC[n % A_PENTATONIC.length], i * 0.09));
        },
      };
    },

    apex() {
      const out = channel(0);
      // Engine: FM-modulated sawtooth through a low-pass; revs follow the car on the 3D track.
      const carrier = ctx.createOscillator();
      carrier.type = "sawtooth";
      const modulator = ctx.createOscillator();
      const depth = ctx.createGain();
      depth.gain.value = 60;
      modulator.connect(depth).connect(carrier.frequency);
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.Q.value = 3;
      const engineGain = ctx.createGain();
      engineGain.gain.value = 0.05;
      carrier.connect(lowpass).connect(engineGain).connect(out.gain);
      carrier.start();
      modulator.start();
      // Tyres: a band of noise that grows with speed.
      const tyres = noiseSource();
      const tyreBand = ctx.createBiquadFilter();
      tyreBand.type = "bandpass";
      tyreBand.frequency.value = 900;
      tyreBand.Q.value = 0.7;
      const tyreGain = ctx.createGain();
      tyreGain.gain.value = 0;
      tyres.connect(tyreBand).connect(tyreGain).connect(out.gain);
      let nextRadio = ctx.currentTime + 6;

      return {
        update(level) {
          set(out.gain.gain, level * 0.9);
          const rpm = 70 + sonic.carSpeed * 170;
          const doppler = 1 + sonic.carApproach * 0.06;
          set(carrier.frequency, rpm * doppler, 0.04);
          set(modulator.frequency, rpm * 0.5, 0.04);
          set(lowpass.frequency, 500 + sonic.carSpeed * 1600, 0.05);
          set(tyreGain.gain, 0.006 + sonic.carSpeed * 0.02, 0.1);
          set(out.panner.pan, Math.max(-1, Math.min(1, sonic.carPan)), 0.05);
          // Team radio: a squelchy chop of band-limited noise every so often.
          if (level > 0.2 && ctx.currentTime > nextRadio) {
            nextRadio = ctx.currentTime + 10 + Math.random() * 8;
            for (let i = 0; i < 4; i++) burst(out.gain, 1800, 4, 0.06, 0.05, i * 0.09);
          }
        },
        event(e) {
          if (e.type !== "shift") return;
          // Upshift on corner exit: revs drop for an instant.
          carrier.frequency.setValueAtTime(carrier.frequency.value * 0.72, ctx.currentTime);
          tone(out.gain, 95, 0.05, 0.05, { type: "square" });
        },
      };
    },

    hub() {
      const out = channel(0.15);
      // Crowd: five "voices" of band-passed noise, each drifting in level and pitch.
      const crowd = ctx.createGain();
      crowd.gain.value = 0.6;
      const presence = ctx.createBiquadFilter();
      presence.type = "highshelf";
      presence.frequency.value = 1500;
      crowd.connect(presence).connect(out.gain);
      const voices = Array.from({ length: 5 }, () => {
        const src = noiseSource();
        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.Q.value = 4;
        band.frequency.value = 350 + Math.random() * 900;
        const g = ctx.createGain();
        g.gain.value = 0;
        src.connect(band).connect(g).connect(crowd);
        return { band, g, phase: Math.random() * 10, rate: 0.6 + Math.random() };
      });
      let lastBeep = 0;
      let clock = 0;

      return {
        update(level, dt) {
          clock += dt;
          // Walking through the crowd: louder and clearer near the cursor.
          const near = sonic.crowdCursor;
          set(out.gain.gain, level * (0.7 + near * 0.5), 0.15);
          set(presence.gain, -6 + near * 9, 0.2);
          for (const v of voices) {
            const wobble = (Math.sin(clock * v.rate + v.phase) + 1) / 2;
            set(v.g.gain, 0.02 + wobble * 0.05, 0.2);
            set(v.band.frequency, 350 + wobble * 900, 0.4);
          }
        },
        event(e) {
          if (e.type !== "checkin" || ctx.currentTime - lastBeep < 0.28) return;
          lastBeep = ctx.currentTime;
          // Badge scanner: a soft two-tone beep (E6, then A6).
          tone(out.gain, 1318.5, 0.07, 0.025);
          tone(out.gain, 1760, 0.09, 0.02, { delay: 0.07 });
        },
      };
    },

    tenant() {
      const out = channel(0.1);
      // Server room: mains hum (A1 and its octave) and fans.
      const hum = ctx.createGain();
      hum.gain.value = 0.05;
      const humFilter = ctx.createBiquadFilter();
      humFilter.type = "lowpass";
      humFilter.frequency.value = 2000;
      hum.connect(humFilter).connect(out.gain);
      for (const f of [55, 110, 165]) {
        const osc = ctx.createOscillator();
        osc.frequency.value = f;
        const g = ctx.createGain();
        g.gain.value = f === 55 ? 0.6 : 0.25;
        osc.connect(g).connect(hum);
        osc.start();
      }
      const fans = noiseSource();
      const fanFilter = ctx.createBiquadFilter();
      fanFilter.type = "lowpass";
      fanFilter.frequency.value = 450;
      const fanGain = ctx.createGain();
      fanGain.gain.value = 0.05;
      fans.connect(fanFilter).connect(fanGain).connect(out.gain);
      // Packets go through a filter that closes when one tenant is isolated.
      const packets = ctx.createBiquadFilter();
      packets.type = "lowpass";
      packets.frequency.value = 8000;
      packets.connect(out.gain);

      return {
        update(level) {
          set(out.gain.gain, level * 0.9, 0.2);
          set(humFilter.frequency, sonic.tenantFocus >= 0 ? 700 : 2000, 0.2);
        },
        event(e) {
          if (e.type !== "packet") return;
          const focus = sonic.tenantFocus;
          const isolated = focus >= 0 && e.tenant !== focus;
          // Everyone else's data sounds far away and muffled; the focused tenant's is crisp.
          const level = focus === -1 ? 0.03 : isolated ? 0.008 : 0.05;
          const freq = isolated ? 900 : 2400 + e.tenant * 180;
          tone(packets, freq, isolated ? 0.05 : 0.025, level, { type: "square", pan: e.pan });
        },
      };
    },

    contact() {
      const out = channel(0.2);
      let nextGlint = ctx.currentTime + 2;
      let lastBell = 0;
      let spinning = false;
      // Inharmonic partials of a small bell, rooted on A3.
      const bell = () => {
        [1, 2.76, 5.4, 8.93].forEach((ratio, i) =>
          tone(out.gain, 220 * ratio, 2.6 / (i + 1), 0.05 / (i + 1), { attack: 0.002 }),
        );
      };
      return {
        update(level) {
          set(out.gain.gain, level);
          // The bell rings when the logo starts turning after resting.
          const turning = sonic.logoSpin > 0.6;
          if (turning && !spinning && level > 0.3 && ctx.currentTime - lastBell > 1.4) {
            lastBell = ctx.currentTime;
            bell();
          }
          spinning = turning;
          if (level > 0.3 && ctx.currentTime > nextGlint) {
            nextGlint = ctx.currentTime + 1.5 + Math.random() * 3;
            tone(out.gain, Math.random() > 0.5 ? 2637 : 3520, 0.4, 0.008, { pan: Math.random() * 2 - 1 });
          }
        },
      };
    },
  };

  /* ---------- the loop ---------- */

  const live: Scenes = built.get(engine) ?? {};
  built.set(engine, live);
  let frame = 0;
  let last = performance.now();

  const loop = () => {
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;

    for (const key of Object.keys(sonic.level) as (keyof typeof sonic.level)[]) {
      const level = sonic.level[key];
      if (!live[key] && level > 0.01) live[key] = scenes[key]();
      live[key]?.update(level, dt);
    }

    const events = sonic.queue.splice(0);
    for (const e of events) for (const scene of Object.values(live)) scene?.event?.(e);

    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frame);
    for (const key of Object.keys(sonic.level) as (keyof typeof sonic.level)[]) {
      live[key]?.update(0, 0);
    }
    sonic.queue.length = 0;
  };
}
