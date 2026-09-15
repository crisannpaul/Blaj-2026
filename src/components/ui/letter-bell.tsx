"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useDragControls,
  useReducedMotion,
} from "framer-motion";
import { Bell, Heart, X } from "lucide-react";
import { LETTER, WelcomeLetter } from "@/components/ui/welcome-letter";

/**
 * THE BELL AND THE NOTIFICATION. The organizers' welcome letter, delivered
 * the way a phone delivers a message.
 *
 * The letter lived on the fold for one evening (a card — SPEC D15, 14 Sep)
 * and the user reverted it on 15 Sep: nobody reads a wall of text on a page
 * whose job is routing to two branches, and on a phone it wrecked the fold.
 * Phase one was a bell that opened the letter in a plain modal sheet. This is
 * phase two, the user's pick from four directions: **an iOS-style
 * notification** — a banner drops in from the top edge (sender, a two-line
 * preview, „acum”), a tap expands it IN PLACE into the whole letter, a tap on
 * the ✕, Esc or a swipe up puts it away and the fold is back. The page never
 * scrolls; the open letter scrolls inside its own box.
 *
 * Three stages, one state: `closed` → `banner` → `open`.
 *
 *  - FIRST VISIT, the banner arrives on its own, 900ms after load — long
 *    enough for the fold to have painted and the marquee to be moving, so
 *    it reads as something happening TO the page rather than part of it —
 *    and leaves on its own 8s later if nobody touches it. The bell keeps the
 *    badge, so the message is not lost; it is just not nagging. This is the
 *    one autoplay motion on the page besides the marquee, it runs once and
 *    lasts under a second each way, and `prefers-reduced-motion` turns the
 *    drop, the growth and the drag into plain appear/disappear.
 *  - THE BELL toggles the banner (tap: arrive; ✕/Esc/swipe: leave) and
 *    LEAVES THE DOM while the notification is up — on a phone both want the
 *    same top-right corner, and a control under a banner is one you can see
 *    and cannot reach (an opacity-0 bell still measured as "covered" in the
 *    hit-test, and still existed for assistive tech). AnimatePresence fades
 *    it both ways. Focus follows — but ONLY for keyboard interactions (a
 *    click with `detail === 0` is Enter/Space; Esc is a key): the banner's
 *    button when it arrives from the bell, the sheet when it opens, the
 *    bell when the notification closes. Never after a tap: iOS Safari paints
 *    the `:focus-visible` ring on programmatic focus regardless, and the
 *    user saw our ink ring as a black outline around the banner and the
 *    bell.
 *  - THE BANNER is one button: the whole strip opens the letter. Sender is
 *    „Arhieparhia de Alba Iulia și Făgăraș” (SENDER, AC-15 — the user's call
 *    over the Biroul's full name, which truncated on a phone), the preview
 *    is the salutation plus the first paragraph, read straight from LETTER
 *    so the copy round (AC-07, AC-08) reaches it; „acum” is chrome (AC-14).
 *  - OPEN IS THE SAME BOX, GROWN — as a MASK, not a scale. The content is
 *    laid out at its final size the moment the stage flips, and the box's
 *    HEIGHT animates over it, revealing the letter from the top the way iOS
 *    unfolds a notification. The first cut used framer's `layout` projection
 *    instead, which grows a box by scaling it with transforms and
 *    counter-scaling the children; with a scrolling letter inside, the text
 *    visibly jumped up and settled back — the user called it a hiccup, most
 *    obvious on a phone. Animating `height` is a layout property (vercel says
 *    never), but it is one element, ~400ms, once per open, and it is the
 *    only way the text stays put; the branch panels animate `flexGrow` for
 *    the same reason. Width on a desktop (24rem → 32rem) rides a CSS
 *    transition of the same length. The paper itself is `WelcomeLetter`
 *    with `frame={false}`, because the box is the frame now. `role="dialog"`
 *    but NOT modal — like a notification, it sits over the page without
 *    locking it; `aria-modal` would claim otherwise.
 *  - SWIPE UP dismisses, from the banner or from the open sheet's header —
 *    the header only, because a drag listener on a scrolling body fights the
 *    scroll. `dragConstraints` pin the box in place; the gesture is the
 *    `offset`/`velocity` at release, and the box springs back if it was not
 *    a swipe. A swipe that ends over the banner is followed by a native
 *    `click` — pointerdown and pointerup on the same element, which followed
 *    the pointer — and without the `dragged` guard that click OPENED the
 *    letter (found by the harness, not by eye). Drag is off under reduced
 *    motion.
 *  - READ STATE: the badge shows until the letter has been OPENED once —
 *    arriving as a banner does not count as reading — remembered in
 *    localStorage, every access guarded (private mode throws), first paint
 *    always unread so server and client HTML agree.
 *
 * Sizes: on a phone the banner spans the width minus 8px a side, 8px under
 * the notch, exactly where iOS puts one; from `sm` it is a 24rem card at the
 * top-right and grows to 32rem when open, the letter's own width. The open
 * sheet is capped at 85svh, header included.
 */
type Stage = "closed" | "banner" | "open";

const READ_KEY = "blaj2026:letter-read";
/** First visit: the banner drops in after this. */
const ARRIVE_MS = 900;
/** …and leaves on its own after this, if untouched. */
const LINGER_MS = 8000;
/** The same spring for the drop, the growth and the leave. */
const SPRING = { type: "spring", visualDuration: 0.36, bounce: 0.18 } as const;
/** Swipe-up threshold: distance OR speed, either counts. */
const SWIPE_PX = -48;
const SWIPE_VPS = -500;

const readStored = () => {
  try {
    return window.localStorage.getItem(READ_KEY) === "1";
  } catch {
    return false;
  }
};

const storeRead = () => {
  try {
    window.localStorage.setItem(READ_KEY, "1");
  } catch {
    /* no storage — the badge simply comes back next visit */
  }
};

/** Salutation plus the first paragraph — what a lock screen would show. */
const PREVIEW = `${LETTER.salutation} ${LETTER.paragraphs[0]!
  .map((seg) => (typeof seg === "string" ? seg : seg.text))
  .join("")}`;

/** The sender line. The user's call over the signature's own first line —
 *  „Biroul pentru Pastorația Tinerilor și a Copiilor” truncated to „…și a
 *  C…” on a phone. Chrome, not the organizers' copy: AC-15. */
const SENDER = "Arhieparhia de Alba Iulia și Făgăraș";

/** The time label at the banner's corner, as a phone would show it. AC-14 —
 *  a constant rather than inline JSX so the inventory can pin it without
 *  depending on indentation, which already bit once. */
const NOW = "acum";

/** A click with `detail === 0` came from the keyboard (Enter / Space). Focus
 *  moves only then: iOS Safari paints the `:focus-visible` ring — our
 *  near-black ink — on PROGRAMMATIC focus even after a tap, and the user saw
 *  a black outline around the banner and around the bell. Keyboard users
 *  keep the focus management; nobody who tapped gets a ring. */
const fromKeyboard = (e: { detail: number }) => e.detail === 0;

export function LetterBell() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState<Stage>("closed");
  const [read, setRead] = useState(false);
  /* The box's animated height: the inner content's natural height, measured
     after every stage change, before paint. "auto" only before the first
     measurement — framer reads the computed pixels from there. */
  const [height, setHeight] = useState<number | "auto">("auto");
  const bellRef = useRef<HTMLButtonElement>(null);
  const bannerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const dragged = useRef(false);
  const drag = useDragControls();

  /* First visit: deliver, then withdraw if ignored. */
  useEffect(() => {
    if (readStored()) {
      setRead(true);
      return;
    }
    const arrive = window.setTimeout(
      () => setStage((s) => (s === "closed" && !touched.current ? "banner" : s)),
      ARRIVE_MS,
    );
    const leave = window.setTimeout(() => {
      if (!touched.current) setStage((s) => (s === "banner" ? "closed" : s));
    }, ARRIVE_MS + LINGER_MS);
    return () => {
      window.clearTimeout(arrive);
      window.clearTimeout(leave);
    };
  }, []);

  /* Measure the content the box has to grow (or shrink) to. Layout effect,
     so the number is known before the frame paints and the animation starts
     from the right place. Re-measured on resize, because 85svh moves. */
  useLayoutEffect(() => {
    if (stage === "closed") return;
    const measure = () => {
      const el = innerRef.current;
      if (el) setHeight(el.getBoundingClientRect().height);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [stage]);

  const close = useCallback((returnFocus = false) => {
    touched.current = true;
    setStage("closed");
    if (returnFocus) window.setTimeout(() => bellRef.current?.focus(), 0);
  }, []);

  const open = useCallback((viaKeyboard: boolean) => {
    touched.current = true;
    setStage("open");
    setRead(true);
    storeRead();
    /* `preventScroll` is the whole fix for "the text scrolls up for a second
       then comes back": focusing the scroll region while the box is still
       growing made the browser scroll the overflow-hidden box to bring the
       focused element into view — by exactly the header's 16px — and the
       offset collapsed to 0 the frame the box reached full height, so the
       letter dropped back into place. Measured frame by frame: grabber at
       y=-8 until 312ms, then 8. */
    if (viaKeyboard)
      window.setTimeout(
        () => sheetRef.current?.focus({ preventScroll: true }),
        0,
      );
  }, []);

  const toggleFromBell = useCallback((viaKeyboard: boolean) => {
    touched.current = true;
    setStage((s) => (s === "closed" ? "banner" : "closed"));
    if (viaKeyboard)
      window.setTimeout(() => bannerRef.current?.focus(), 0);
  }, []);

  /* Esc puts it away, from anywhere on the page — it is not modal. */
  useEffect(() => {
    if (stage === "closed") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, close]);

  const showing = stage !== "closed";
  const move = reduced ? { duration: 0 } : SPRING;

  return (
    <>
      <AnimatePresence initial={false}>
        {showing ? null : (
          <motion.button
            key="bell"
            ref={bellRef}
            type="button"
            onClick={(e) => toggleFromBell(fromKeyboard(e))}
            aria-haspopup="dialog"
            aria-expanded={false}
            aria-label={
              read ? "Mesajul de bun venit" : "Mesajul de bun venit, necitit"
            }
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={move}
            className="bg-card text-foreground shadow-sheet focus-visible:ring-ring focus-visible:ring-offset-background hover:bg-muted fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-30 flex size-14 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95"
          >
            <Bell aria-hidden="true" className="size-6" strokeWidth={2} />
            {read ? null : (
              <span
                aria-hidden="true"
                /* 13px digits — nothing on this site renders under 12 — in a
                   20px pill with a 2px card-coloured ring, so it separates
                   from the circle instead of bleeding into its edge. */
                className="bg-destructive text-background font-ui text-ui ring-card absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 leading-none font-semibold ring-2"
              >
                1
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showing ? (
          <motion.div
            key="notification"
            role={stage === "open" ? "dialog" : "status"}
            aria-labelledby={stage === "open" ? "scrisoare-salut" : undefined}
            aria-label={stage === "open" ? undefined : "Mesaj nou"}
            initial={reduced ? { opacity: 0 } : { y: -160, opacity: 0 }}
            animate={{ y: 0, opacity: 1, height }}
            exit={reduced ? { opacity: 0 } : { y: -160, opacity: 0 }}
            transition={move}
            drag={reduced ? false : "y"}
            dragControls={drag}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.5, bottom: 0.05 }}
            onDragStart={() => {
              dragged.current = true;
            }}
            onDragEnd={(_, info) => {
              if (info.offset.y < SWIPE_PX || info.velocity.y < SWIPE_VPS)
                close();
              /* The click that follows pointerup is dispatched in the same
                 task; this reset runs after it. */
              window.setTimeout(() => {
                dragged.current = false;
              }, 0);
            }}
            className={`bg-card shadow-sheet fixed inset-x-2 top-[max(0.5rem,env(safe-area-inset-top))] z-40 overflow-hidden rounded-2xl sm:inset-x-auto sm:right-4 sm:transition-[width] sm:duration-300 sm:ease-out motion-reduce:transition-none ${stage === "open" ? "sm:w-[32rem]" : "sm:w-[24rem]"}`}
          >
            {/* The content, laid out at its own height AND at its final
                width from the first frame; the box above grows to it and
                reveals it. Not height-constrained here — the cap lives on the
                scroll region, so the measurement is the real one — and the
                width is pinned to the open/banner width on purpose: the box's
                own width still rides its 300ms transition, but if the content
                reflowed with it, the height measured at 24rem (the letter
                wrapped longer) was 100px more than the letter needs at 32rem,
                and the box kept that 100px as blank paper under the
                signature. The user saw it at once. */}
            <div
              ref={innerRef}
              className={stage === "open" ? "sm:w-[32rem]" : "sm:w-[24rem]"}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {stage === "banner" ? (
                  <motion.button
                    key="banner"
                    ref={bannerRef}
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.16 }}
                    onClick={(e) => {
                      if (dragged.current) return;
                      open(fromKeyboard(e));
                    }}
                    onPointerDown={(e) => drag.start(e)}
                    aria-label={`Mesaj nou de la ${SENDER}. Deschide`}
                    className="focus-visible:ring-ring hover:bg-muted active:bg-muted flex w-full cursor-pointer touch-none items-center gap-3 p-3 text-left focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none"
                  >
                    {/* The "app icon": a pale-red squircle with the red heart —
                        the same heart that signs the letter. Centred against
                        the three-line text block (`items-center` on the row),
                        as iOS centres an app icon in a banner; top-aligned it
                        floated above the text's middle and the user read it
                        as "the heart is not aligned". */}
                    <span
                      aria-hidden="true"
                      className="bg-heart/12 text-heart grid size-10 shrink-0 place-items-center rounded-xl"
                    >
                      <Heart
                        className="block size-5 fill-current"
                        strokeWidth={2}
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-ui text-ui truncate font-semibold">
                          {SENDER}
                        </span>
                        <span className="font-ui text-ui text-muted-foreground shrink-0">
                          {NOW}
                        </span>
                      </span>
                      <span className="font-ui text-ui mt-0.5 line-clamp-2 block">
                        {PREVIEW}
                      </span>
                    </span>
                  </motion.button>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                    className="flex flex-col"
                  >
                    {/* The header: grabber for the swipe, ✕ for the tap. */}
                    <div className="relative shrink-0">
                      <div
                        onPointerDown={(e) => drag.start(e)}
                        className="flex cursor-grab touch-none justify-center pt-2 pb-1 active:cursor-grabbing"
                        aria-hidden="true"
                      >
                        <span className="bg-border-strong/50 h-1 w-10 rounded-full" />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => close(fromKeyboard(e))}
                        aria-label="Închide mesajul"
                        className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-card active:bg-muted absolute top-1 right-2 flex size-11 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        <X aria-hidden="true" className="size-5" />
                      </button>
                    </div>
                    {/* 85svh for the whole box, minus the header's 2.75rem. */}
                    <div
                      ref={sheetRef}
                      tabIndex={-1}
                      className="max-h-[calc(85svh-2.75rem)] overflow-y-auto overscroll-contain outline-none"
                    >
                      <WelcomeLetter frame={false} className="pt-1" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
