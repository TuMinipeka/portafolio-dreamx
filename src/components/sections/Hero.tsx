import type { Dictionary } from "@/i18n/dictionaries";
import { flight } from "@/content/flight";
import { Compiler } from "./Compiler";

// Each word is its own box so the type stage can set them one by one.
function Words({ text }: { text: string }) {
  const words = text.split(" ");
  return words.map((word, i) => (
    <span key={i}>
      <span data-word className="inline-block">
        {word}
      </span>
      {i < words.length - 1 ? " " : null}
    </span>
  ));
}

const formatAltitude = (m: number) => (m < 1000 ? `${m} m` : `${m / 1000} km`);

/**
 * Ground level, and the compile track. The section is four screens tall with a
 * sticky viewport; scrolling through it builds the page one stage at a time.
 * Every style here sits behind a b-* variant, so with no build tokens the markup
 * renders as a plain HTML document (see the compile rules in globals.css).
 */
export function Hero({ dict }: { dict: Dictionary }) {
  const copy = dict.hero;
  const [ground, sky] = copy.manifesto;

  const index = [
    { id: "log", name: dict.log.name },
    { id: "about", name: dict.about.name },
    { id: "apex", name: dict.stations.apex.name },
    { id: "hub", name: dict.stations.hub.name },
    { id: "tenant", name: dict.stations.tenant.name },
    { id: "contact", name: copy.contact },
  ].map((item) => ({
    ...item,
    altitude: formatAltitude(flight.find((w) => w.id === item.id)?.altitude ?? 0),
  }));

  return (
    <section id="hero" aria-labelledby="hero-title" className="compile-track relative h-[400svh]">
      <div className="compile-stage sticky top-0 h-svh overflow-hidden">
        <div
          aria-hidden
          className="grid-guides pointer-events-none absolute inset-0 grid grid-cols-4 gap-4 px-5 md:grid-cols-12 md:px-8 md:pr-40"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              style={{ "--i": i } as React.CSSProperties}
              className={`bg-[rgb(255_0_0/0.07)] ${i >= 4 ? "max-md:hidden" : ""}`}
            />
          ))}
        </div>

        <div className="compile relative b-layout:flex b-layout:h-full b-layout:flex-col b-layout:justify-end b-layout:px-5 b-layout:pt-24 b-layout:pb-8 md:b-layout:px-8 md:b-layout:pr-40">
          <div data-flip className="b-layout:mb-auto b-layout:max-w-[34ch]">
            <p className="b-type:text-step-1 b-type:font-medium">{copy.name}</p>
            <p className="transition-opacity duration-700 b-type:text-step-0 b-color:opacity-70">{copy.role}</p>
          </div>

          <h1 data-flip id="hero-title" className="b-layout:mt-12">
            <span className="manifesto-ground b-layout:block b-type:text-step-5 md:b-type:text-step-6">
              <Words text={ground} />
            </span>{" "}
            <span className="manifesto-sky b-layout:mt-3 b-layout:block b-type:text-step-3 md:b-type:text-step-5">
              <Words text={sky} />
            </span>
          </h1>

          <div
            data-flip
            className="b-layout:mt-8 b-layout:grid b-layout:gap-6 b-layout:border-t b-layout:border-current/40 b-layout:pt-5 md:b-layout:grid-cols-12"
          >
            <p className="b-layout:max-w-[46ch] b-type:text-step-0 b-type:leading-relaxed md:b-layout:col-span-6">
              {copy.intro}
            </p>

            <nav aria-labelledby="hero-index" className="max-md:b-layout:hidden md:b-layout:col-span-4 md:b-layout:col-start-9">
              <p id="hero-index" className="transition-opacity duration-700 b-type:text-step--1 b-color:opacity-70">
                {copy.index}
              </p>
              <ul className="b-layout:mt-2">
                {index.map((item) => (
                  <li key={item.id} data-flip>
                    <a
                      href={`#${item.id}`}
                      className="b-layout:flex b-layout:justify-between b-layout:gap-4 b-layout:py-0.5 b-type:text-step-0"
                    >
                      <span>{item.name}</span>{" "}
                      <span className="tabular transition-opacity duration-700 b-color:opacity-70">{item.altitude}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        <Compiler copy={dict.compile} />
      </div>
    </section>
  );
}
