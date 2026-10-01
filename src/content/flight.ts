// Language-neutral data for the flight: where each station sits in the sky,
// the sky color at that altitude, and outbound links. Copy lives in the dictionaries.

export type LayerKey = "ground" | "runway" | "climb" | "boundary" | "troposphere" | "stratosphere" | "karman";
export type StationId = "apex" | "hub" | "tenant";

export type Waypoint = {
  id: "hero" | "log" | "about" | StationId | "contact";
  layer: LayerKey;
  /** Altitude in meters shown by the altimeter when this section is centered. */
  altitude: number;
  /** Sky color behind this section. */
  sky: string;
  /** Whether text on this sky should be light. */
  dark: boolean;
};

export const flight: Waypoint[] = [
  { id: "hero", layer: "ground", altitude: 0, sky: "#D5D9D8", dark: false },
  { id: "log", layer: "runway", altitude: 120, sky: "#C6D0D4", dark: false },
  { id: "about", layer: "climb", altitude: 350, sky: "#BAC8D1", dark: false },
  { id: "apex", layer: "boundary", altitude: 800, sky: "#AFC2CF", dark: false },
  { id: "hub", layer: "troposphere", altitude: 6_000, sky: "#3B5C80", dark: true },
  { id: "tenant", layer: "stratosphere", altitude: 20_000, sky: "#1B2F5A", dark: true },
  { id: "contact", layer: "karman", altitude: 100_000, sky: "#000000", dark: true },
];

export const stations: {
  id: StationId;
  stack: string[];
  href: string;
}[] = [
  {
    id: "apex",
    stack: ["Java 17", "JavaFX", "MySQL", "Maven", "JUnit"],
    href: "https://github.com/CondezPancake/Formula1Simulator",
  },
  {
    id: "hub",
    stack: ["TypeScript", "JavaScript", "HTML", "CSS", "Docker", "PL/pgSQL"],
    href: "https://www.linkedin.com/feed/update/urn:li:activity:7473423268155256832/",
  },
  {
    id: "tenant",
    stack: ["PostgreSQL 16", "PL/pgSQL", "Docker"],
    href: "https://github.com/TuMinipeka/Plataforma_multi-tenant_de_gesti-n_SST-PESV",
  },
];

export const social = {
  email: "danielsantiagomayorga03@gmail.com",
  linkedin: "https://www.linkedin.com/in/daniel-santiago-mayorga-tellez-5bb0463a0/",
  github: "https://github.com/TuMinipeka",
  cv: "https://drive.google.com/file/d/1MUlF1F-fKDHF0-4GGfoEvKH0I8rn1xa-/view?usp=sharing",
};

export const tools = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "HTML",
  "CSS",
  "SQL",
  "PostgreSQL",
  "Docker",
  "Git",
  "n8n",
  "Scrum",
];
