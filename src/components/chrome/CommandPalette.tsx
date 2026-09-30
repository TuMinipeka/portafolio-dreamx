"use client";

import { Command } from "cmdk";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { social, stations } from "@/content/flight";
import { useFlight } from "@/store/flight";

type Props = { lang: Locale; dict: Dictionary };

/**
 * Ctrl/Cmd + K: jump anywhere without flying the whole route. Also the menu on
 * touch screens, via the "Navigate" button in the header.
 */
export function CommandPalette({ lang, dict }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<{ question: string; text: string; status: "loading" | "done" | "error" } | null>(
    null,
  );
  const router = useRouter();
  const pathname = usePathname();
  const copy = dict.palette;
  const home = `/${lang}`;
  const otherLang: Locale = lang === "es" ? "en" : "es";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Pause smooth scroll while the dialog is open so the list can scroll.
  useEffect(() => {
    const lenis = useFlight.getState().lenis;
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open]);

  const closeAndReset = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setAnswer(null);
      setQuery("");
    }
  };

  const ask = async (question: string) => {
    setAnswer({ question, text: "", status: "loading" });
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, locale: lang }),
      });
      if (!res.ok || !res.body) {
        const message =
          res.status === 503 ? copy.ask.unavailable : res.status === 429 ? copy.ask.limited : copy.ask.failed;
        setAnswer({ question, text: message, status: "error" });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAnswer({ question, text, status: "loading" });
      }
      setAnswer({ question, text, status: "done" });
    } catch {
      setAnswer({ question, text: copy.ask.failed, status: "error" });
    }
  };

  const run = (action: () => void) => {
    closeAndReset(false);
    action();
  };

  const goToSection = (id: string) => {
    if (pathname === home) {
      const lenis = useFlight.getState().lenis;
      const target = document.getElementById(id);
      if (lenis && target) lenis.scrollTo(target, { duration: 1.8 });
      else target?.scrollIntoView();
    } else {
      router.push(`${home}#${id}`);
    }
  };

  const copyEmail = async () => {
    await navigator.clipboard.writeText(social.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sections = [
    { id: "hero", name: dict.hero.name },
    { id: "log", name: dict.log.name },
    ...stations.map((s) => ({ id: s.id, name: dict.stations[s.id].name })),
    { id: "contact", name: dict.hero.contact },
  ];

  const item =
    "flex cursor-pointer items-center justify-between gap-4 border-l-2 border-transparent px-4 py-2.5 text-step-0 data-[selected=true]:border-(--color-runway) data-[selected=true]:bg-(--color-graphite)/6";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-step--1 underline decoration-1 underline-offset-4 hover:decoration-2"
      >
        {copy.open}
        <kbd className="hidden rounded-sm border border-current/40 px-1.5 font-sans text-[0.7rem] no-underline md:inline">
          Ctrl K
        </kbd>
      </button>

      <p role="status" className="sr-only">
        {copied ? copy.actions.copied : ""}
      </p>

      <Command.Dialog
        open={open}
        onOpenChange={closeAndReset}
        label={copy.label}
        overlayClassName="fixed inset-0 z-50 bg-(--color-graphite)/30 backdrop-blur-[2px]"
        contentClassName="fixed top-[14vh] left-1/2 z-50 w-[min(36rem,calc(100%-2rem))] -translate-x-1/2 border border-(--color-graphite)/20 bg-(--color-cloud) text-(--color-graphite) shadow-[0_24px_60px_-20px_rgb(0_0_0/0.45)]"
      >
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder={copy.placeholder}
          className="w-full border-b border-(--color-graphite)/15 bg-transparent px-4 py-4 text-step-1 outline-none placeholder:text-(--color-graphite)/50"
        />
        {answer ? (
          <div
            className="grid max-h-[min(60vh,28rem)] gap-3 overflow-y-auto px-4 py-4"
            aria-live="polite"
            data-lenis-prevent
          >
            <p className="text-step--1 opacity-60">{answer.question}</p>
            <p className="text-step-0 leading-relaxed whitespace-pre-wrap">{answer.text || copy.ask.thinking}</p>
            {answer.status === "done" ? <p className="text-step--1 opacity-60">{copy.ask.disclaimer}</p> : null}
            <button
              type="button"
              onClick={() => {
                setAnswer(null);
                setQuery("");
              }}
              className="justify-self-start text-step-0 underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {copy.ask.back}
            </button>
          </div>
        ) : (
          <Command.List className="max-h-[min(60vh,28rem)] overflow-y-auto py-2" data-lenis-prevent>
            <Command.Empty className="px-4 py-6 text-step-0">{copy.empty}</Command.Empty>

            {query.trim().length > 3 ? (
              <Command.Group
                heading={copy.ask.group}
                forceMount
                className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-step--1 [&_[cmdk-group-heading]]:opacity-60"
              >
                <Command.Item value="ask-the-portfolio" keywords={[query]} forceMount onSelect={() => ask(query.trim())} className={item}>
                  <span>{copy.ask.item}</span>
                  <span className="truncate text-step--1 opacity-60">{query.trim()}</span>
                </Command.Item>
              </Command.Group>
            ) : null}

            <Command.Group
              heading={copy.groups.sections}
              className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-step--1 [&_[cmdk-group-heading]]:opacity-60"
            >
              {sections.map((s) => (
                <Command.Item
                  key={s.id}
                  value={`section ${s.name}`}
                  onSelect={() => run(() => goToSection(s.id))}
                  className={item}
                >
                  {s.name}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading={copy.groups.work}
              className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-step--1 [&_[cmdk-group-heading]]:opacity-60"
            >
              {stations.map((s) => (
                <Command.Item
                  key={s.id}
                  value={`work ${dict.stations[s.id].name} ${dict.stations[s.id].kind}`}
                  onSelect={() => run(() => router.push(`${home}/work/${s.id}`))}
                  className={item}
                >
                  <span>{dict.stations[s.id].name}</span>
                  <span className="truncate text-step--1 opacity-60">{dict.stations[s.id].kind}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group
              heading={copy.groups.actions}
              className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-step--1 [&_[cmdk-group-heading]]:opacity-60"
            >
              <Command.Item
                value="quick recruiter"
                onSelect={() => run(() => router.push(`${home}/quick`))}
                className={item}
              >
                {copy.actions.quick}
              </Command.Item>
              <Command.Item value="email copy" onSelect={() => run(copyEmail)} className={item}>
                <span>{copy.actions.email}</span>
                <span className="text-step--1 opacity-60">{social.email}</span>
              </Command.Item>
              <Command.Item
                value="cv resume"
                onSelect={() => run(() => window.open(social.cv, "_blank", "noopener"))}
                className={item}
              >
                {copy.actions.cv}
              </Command.Item>
              <Command.Item
                value="linkedin"
                onSelect={() => run(() => window.open(social.linkedin, "_blank", "noopener"))}
                className={item}
              >
                {copy.actions.linkedin}
              </Command.Item>
              <Command.Item
                value="github"
                onSelect={() => run(() => window.open(social.github, "_blank", "noopener"))}
                className={item}
              >
                {copy.actions.github}
              </Command.Item>
              <Command.Item
                value="language idioma english español"
                onSelect={() => run(() => router.push(pathname.replace(/^\/(es|en)(?=\/|$)/, `/${otherLang}`)))}
                className={item}
              >
                {copy.actions.locale}
              </Command.Item>
            </Command.Group>
          </Command.List>
        )}
      </Command.Dialog>
    </>
  );
}
