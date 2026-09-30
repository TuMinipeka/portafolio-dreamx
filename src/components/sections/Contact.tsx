import type { Dictionary } from "@/i18n/dictionaries";
import { social } from "@/content/flight";
import { LogoMark } from "@/components/chrome/LogoMark";

/** The edge of space: pure black, the only place the logo is shown large. */
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
      className="flex min-h-svh flex-col justify-center gap-12 px-5 py-28 md:px-8 md:pr-40"
    >
      <LogoMark className="h-16 w-auto self-start md:h-24" />

      <div>
        <h2
          id="contact-title"
          className="font-display text-step-4 leading-tight font-extralight [font-variation-settings:'wdth'_150]"
        >
          {copy.heading}
        </h2>
        <p className="mt-6 max-w-[40ch] text-step-1 leading-snug">{copy.body}</p>
        <p className="mt-10 text-step-0 opacity-70">{copy.email}</p>
        <a
          href={`mailto:${social.email}`}
          className="mt-1 inline-block text-step-2 break-all underline decoration-1 underline-offset-8 hover:decoration-2 md:text-step-3"
        >
          {social.email}
        </a>
      </div>

      <ul className="flex flex-col gap-3 md:flex-row md:gap-10">
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
    </section>
  );
}
