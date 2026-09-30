import { ImageResponse } from "next/og";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

export const alt = "Daniel Santiago Mayorga Tellez, software developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social preview: the ground-level sky, the manifesto standing on a hairline, the D mark. */
export default async function OpenGraphImage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(hasLocale(lang) ? lang : "es");
  const [ground, sky] = dict.hero.manifesto;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#d5d9d8",
          color: "#16181b",
          padding: "64px 72px",
        }}
      >
        <svg width="96" height="73" viewBox="400 345 452 345" fill="#16181b">
          <path d="M412 350 L705 350 C790 350 848 420 848 515 C848 575 822 615 787 640 L735 590 C760 572 773 545 773 515 C773 462 738 425 690 425 L522 425 Z" />
          <path d="M573 465 L630 450 L600 492 L405 645 Z" />
          <path d="M428 683 L628 522 L795 683 L705 685 L630 588 L535 685 Z" />
        </svg>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{ground}</div>
          <div style={{ fontSize: 60, fontWeight: 300, letterSpacing: 6, marginTop: 14 }}>{sky}</div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "2px solid rgba(22,24,27,0.5)",
              marginTop: 40,
              paddingTop: 20,
              fontSize: 28,
            }}
          >
            <span>{dict.hero.name}</span>
            <span style={{ opacity: 0.75 }}>{dict.hero.role}</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
