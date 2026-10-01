"use client";

import { useEffect, useRef, useState } from "react";
import { useFlight } from "@/store/flight";
import { createEngine, sound, type SoundEngine } from "@/lib/sound";
import { startSoundscape } from "@/lib/soundscape";
import { sonic } from "@/lib/sonic";

type Copy = { enable: string; disable: string };

/**
 * Turns the generative sound on and off (see src/lib/sound.ts). While on, the
 * engine is published on the `sound` bus so other parts (project transitions) can play cues.
 * Off by default; nothing is created until the visitor turns it on.
 */
export function SoundToggle({ copy }: { copy: Copy }) {
  const [on, setOn] = useState(false);
  const engine = useRef<SoundEngine | null>(null);

  useEffect(() => {
    if (!on) return;
    engine.current ??= createEngine();
    const audio = engine.current;
    audio.resume();
    sound.engine = audio;
    const stopSoundscape = startSoundscape(audio);
    // Handle for browser automation in dev: lets tests read what the 3D world tells the sound.
    if (process.env.NODE_ENV === "development") Object.assign(window, { __sonic: sonic, __audio: audio });

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
      sound.engine = null;
      stopSoundscape();
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
