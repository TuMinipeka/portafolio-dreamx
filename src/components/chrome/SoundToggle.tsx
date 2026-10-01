"use client";

import { useEffect, useRef, useState } from "react";
import { useFlight } from "@/store/flight";

type Copy = { enable: string; disable: string };

const smoothstep = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Generative sound for the flight, built entirely with the Web Audio API:
 *  - wind: looped noise through a band-pass that rises and thins with altitude
 *  - drone: a low fifth that climbs an octave from the ground to space
 *  - shimmer: a faint high tone that only exists at the Kármán line
 *  - ticks: a short blip on hover and a soft click at each compile stage
 * Off by default; nothing is created until the visitor turns it on.
 */
export function SoundToggle({ copy }: { copy: Copy }) {
  const [on, setOn] = useState(false);
  const engine = useRef<ReturnType<typeof createEngine> | null>(null);

  useEffect(() => {
    if (!on) return;
    engine.current ??= createEngine();
    const audio = engine.current;
    audio.resume();

    const unsubscribeFlight = useFlight.subscribe((s) => audio.fly(s.progress));
    audio.fly(useFlight.getState().progress);

    const unsubscribeStage = useFlight.subscribe((s, prev) => {
      if (s.stage !== prev.stage) audio.click();
    });

    let last: Element | null = null;
    const onHover = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest("a, button, [cmdk-item]") ?? null;
      if (target && target !== last) audio.tick();
      last = target;
    };
    document.addEventListener("pointerover", onHover);

    return () => {
      unsubscribeFlight();
      unsubscribeStage();
      document.removeEventListener("pointerover", onHover);
      audio.suspend();
    };
  }, [on]);

  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setOn((v) => !v)}
      className="text-step--1 underline decoration-1 underline-offset-4 hover:decoration-2"
    >
      {on ? copy.disable : copy.enable}
    </button>
  );
}

function createEngine() {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);

  // Wind: two seconds of white noise, looped, shaped by a band-pass filter.
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
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

  const glide = (param: AudioParam, value: number, time = 0.4) =>
    param.setTargetAtTime(value, ctx.currentTime, time);

  const blip = (frequency: number, duration: number, level: number, type: OscillatorType = "sine") => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(level, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(master);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  };

  return {
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
  };
}
