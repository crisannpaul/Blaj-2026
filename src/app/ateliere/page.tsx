import { ViewTransition } from "react";
import {
  HeroCarousel,
  type HeroCarouselItem,
} from "@/components/ui/hero-carousel";

export const metadata = { title: "Ateliere" };

/**
 * PLACEHOLDER WORKSHOPS. Every name, leader, duration, capacity, description
 * and photograph here is invented to make the layout real — none of it is
 * confirmed (SPEC A3, and D4 for whether capacities exist at all). Photos are
 * Unsplash stand-ins in public/ateliere/.
 *
 * `accent` is the hue the whole backdrop grades to when a card takes focus.
 * These alternate sky and yellow — the site's two accents, straight from the
 * palette. They can be this bright because the stage is light and the ink is
 * dark: the grade washes toward --stage, so the backdrop's luminance floor does
 * not depend on the accent being dark. (It did when the stage was dark and the
 * type was white — yellow-400 put an 11px label at 1.63:1 back then.)
 * Verify any new accent with the glyph-mask pass in SPEC 6.2 regardless.
 */
const WORKSHOPS: HeroCarouselItem[] = [
  {
    id: "icoane",
    title: "Icoane pe\nsticlă",
    image: "/ateliere/1.jpg",
    credit: "ATELIER 01",
    meta: ["90 MIN", "20 LOCURI"],
    description:
      "Tehnica pe care Blajul o ține vie de două secole. Pleci cu icoana ta, pictată de la prima linie.",
    ctaLabel: "Înscrieri în curând",
    accent: "#00bcff",
  },
  {
    id: "cor",
    title: "Cor și\nmuzică",
    image: "/ateliere/2.jpg",
    credit: "ATELIER 02",
    meta: ["120 MIN", "30 LOCURI"],
    description:
      "Repetiție deschisă pentru cei care vor să cânte la Liturghia de seară. Nu ai nevoie de experiență.",
    ctaLabel: "Înscrieri în curând",
    accent: "#fdc700",
  },
  {
    id: "foto",
    title: "Foto și\npovestire",
    image: "/ateliere/3.jpg",
    credit: "ATELIER 03",
    meta: ["90 MIN", "15 LOCURI"],
    description:
      "Fotografiezi întâlnirea din interior, cu telefonul din buzunar. Cele mai bune cadre ajung în albumul zilei.",
    ctaLabel: "Înscrieri în curând",
    accent: "#0099d6",
  },
  {
    id: "teatru",
    title: "Teatru\nbiblic",
    image: "/ateliere/4.jpg",
    credit: "ATELIER 04",
    meta: ["120 MIN", "25 LOCURI"],
    description:
      "O pildă, repetată de dimineață și jucată seara în fața tuturor. Roluri pentru oricine vrea unul.",
    ctaLabel: "Înscrieri în curând",
    accent: "#ffdf20",
  },
  {
    id: "slujire",
    title: "Voluntariat\nși slujire",
    image: "/ateliere/5.jpg",
    credit: "ATELIER 05",
    meta: ["90 MIN", "40 LOCURI"],
    description:
      "Ieșim în oraș, la oamenii pe lângă care trecem în fiecare zi. Mai puțin discuție, mai mult făcut.",
    ctaLabel: "Înscrieri în curând",
    accent: "#7cd4fd",
  },
  {
    id: "rugaciune",
    title: "Rugăciune\nși tăcere",
    image: "/ateliere/6.jpg",
    credit: "ATELIER 06",
    meta: ["60 MIN", "20 LOCURI"],
    description:
      "O oră fără telefon, în catedrală. Ghidată, pentru cine nu a făcut asta niciodată singur.",
    ctaLabel: "Înscrieri în curând",
    accent: "#e8b400",
  },
];

export default function Ateliere() {
  return (
    <ViewTransition
      enter={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      exit={{
        "nav-forward": "nav-forward",
        "nav-back": "nav-back",
        default: "none",
      }}
      default="none"
    >
      <main className="h-[100svh]">
        <HeroCarousel
          items={WORKSHOPS}
          defaultIndex={2}
          brand="Blaj 2026"
          backHref="/"
          backLabel="Acasă"
          label="Atelierele întâlnirii"
        />
      </main>
    </ViewTransition>
  );
}
