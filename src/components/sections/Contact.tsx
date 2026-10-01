import type { Dictionary } from "@/i18n/dictionaries";
import { social } from "@/content/flight";

/** The edge of space: pure black. The DREAMX mark floats on the right as a lit 3D object. */
export function Contact({ copy }: { copy: Dictionary["contact"] }) {
  const links = [
    { href: social.linkedin, label: copy.linkedin },
    { href: social.github, label: copy.github },
    { href: social.cv, label: copy.cv },
  ];

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="grid min-h-svh content-center gap-12 px-5 py-28 md:grid-cols-12 md:px-8 md:pr-40"
    >
      <div className="flex flex-col gap-12 md:col-span-6">
        <div>
          <h2
            id="contact-title"
            className="font-display text-step-4 leading-tight font-extralight [font-variation-settings:'wdth'_150]"
          >
            {copy.heading}
          </h2>
          <p className="mt-6 max-w-[40ch] text-step-1 leading-snug">{copy.body}</p>
          <p className="mt-10 text-step-0 opacity-80">{copy.email}</p>
          <a
            href={`mailto:${social.email}`}
            className="mt-1 inline-block text-step-1 break-all underline decoration-1 underline-offset-8 hover:decoration-2 sm:text-step-2 xl:text-step-3"
          >
            {social.email}
          </a>
        </div>

        <ul className="flex flex-col gap-3 lg:flex-row lg:gap-10">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="text-step-1 underline decoration-1 underline-offset-8 hover:decoration-2"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* The 3D DREAMX mark stands in this column. */}
      <div aria-hidden className="hidden md:col-span-6 md:block" />
    </section>
  );
}
