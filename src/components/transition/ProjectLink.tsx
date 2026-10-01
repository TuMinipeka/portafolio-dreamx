"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import type { StationId } from "@/content/flight";
import { PROJECT_NOTE, sound } from "@/lib/sound";
import { goToProject } from "./orchestrator";

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string; station: StationId };

/**
 * A link to a project's case study that travels there through the re-ordering
 * transition. Hovering previews the destination: it prefetches the page and,
 * with sound on, plays that station's note very softly.
 * Modified clicks (new tab, etc.) behave like a normal link.
 */
export function ProjectLink({ href, station, onClick, onPointerEnter, ...rest }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Link
      href={href}
      onPointerEnter={(e) => {
        router.prefetch(href);
        sound.engine?.note(PROJECT_NOTE[station], 0.015);
        onPointerEnter?.(e);
      }}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        if (pathname === href) return;
        goToProject(router, href, station);
      }}
      {...rest}
    />
  );
}
