"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, X } from "lucide-react";
import { WelcomeLetter } from "@/components/ui/welcome-letter";

/**
 * THE BELL. A notification control on the top edge of the landing page, and
 * the only way into the organizers' welcome letter.
 *
 * The letter lived on the fold itself for one evening — a card beside the
 * copy on desktop and a second screen under it on a phone (SPEC D15, 14 Sep).
 * The user's verdict on 15 Sep: on a phone it "looks completely ass", nobody
 * will read a wall of text on a page whose job is routing to two branches,
 * and the fold should go back to one unscrollable screen. The letter becomes
 * a MESSAGE instead: a bell with a badge, tap to open, tap to close. This
 * file is phase one — the bell, and the letter in a plain modal sheet so the
 * control is never a dead button. How the letter ARRIVES (envelope, morph,
 * notification banner, bottom sheet) is phase two and is not designed here.
 *
 * What is decided:
 *  - A native <dialog>, opened with showModal(). That buys the focus trap,
 *    Esc to close, `inert` everything else and a ::backdrop for free — the
 *    APG dialog pattern without a library. Backdrop tap closes too: a click
 *    on the dialog element itself whose point lies outside the sheet's box
 *    can only have landed on the backdrop, which is what the `rect` test
 *    below checks.
 *  - Scroll happens INSIDE the sheet (`overscroll-contain`, vercel MUST for
 *    drawers), never on the page: the page is one screen again and stays
 *    that way with the letter open.
 *  - The badge is READ STATE, not decoration: "1" until the letter has been
 *    opened once, then gone, remembered per device in localStorage so the
 *    bell does not nag on every visit. Storage can throw (private mode,
 *    blocked site data), so every access is guarded and the page renders
 *    correctly with no stored value. First paint is always "unread" and the
 *    stored value is applied after mount, so server and client HTML agree.
 *  - Top-right, `fixed`, under the notch (`safe-area-inset-top`). The fold's
 *    copy is bottom-anchored, so the corner is free at every phone height;
 *    on a desktop it sits over the photographs, where a white circle with a
 *    halo reads at once. 56px — over the 44 floor with room to spare.
 *  - Last in the DOM, after the branch panels, so a keyboard reaches the two
 *    calls to action before a secondary control.
 *  - The badge is `--destructive`: the one red in the palette. A notification
 *    count is the single place a red is the honest choice — every phone the
 *    audience owns says "unread" in red — and it is a 20px dot, not an accent
 *    moment. If the user wants it on-palette, `bg-contrast text-contrast-text`
 *    is one class away.
 */
const READ_KEY = "blaj2026:letter-read";

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

export function LetterBell() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [read, setRead] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (readStored()) setRead(true);
  }, []);

  const show = useCallback(() => {
    const d = dialogRef.current;
    if (!d || d.open) return;
    d.showModal();
    setOpen(true);
    setRead(true);
    storeRead();
  }, []);

  const hide = useCallback(() => {
    dialogRef.current?.close();
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          read ? "Mesajul de bun venit" : "Mesajul de bun venit, necitit"
        }
        className="bg-card text-foreground shadow-sheet focus-visible:ring-ring focus-visible:ring-offset-background hover:bg-muted fixed top-[max(1rem,env(safe-area-inset-top))] right-4 z-30 flex size-14 items-center justify-center rounded-full transition-[background-color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 motion-reduce:transition-none"
      >
        <Bell aria-hidden="true" className="size-6" strokeWidth={2} />
        {read ? null : (
          <span
            aria-hidden="true"
            /* 13px digits — nothing on this site renders under 12 — in a
               20px pill with a 2px card-coloured ring, so it separates from
               the circle instead of bleeding into its edge. */
            className="bg-destructive text-background font-ui text-ui ring-card absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 leading-none font-semibold ring-2"
          >
            1
          </span>
        )}
      </button>

      {/* The sheet. `bg-transparent` and no padding: the letter card is its
          own surface, and the dialog is only the frame that centres it and
          owns the backdrop. Height is capped so the card scrolls inside
          itself on a short phone; the page behind never moves. */}
      <dialog
        ref={dialogRef}
        aria-labelledby="scrisoare-salut"
        onClose={() => setOpen(false)}
        onClick={(e) => {
          const d = e.currentTarget;
          const r = d.getBoundingClientRect();
          const outside =
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom;
          if (outside) d.close();
        }}
        className="backdrop:bg-foreground/40 m-auto w-[calc(100vw-2rem)] max-w-[32rem] bg-transparent p-0 outline-none backdrop:backdrop-blur-[2px]"
      >
        <div className="relative max-h-[85svh] overflow-y-auto overscroll-contain rounded-2xl">
          <WelcomeLetter />
          <button
            type="button"
            onClick={hide}
            aria-label="Închide mesajul"
            className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring focus-visible:ring-offset-card active:bg-muted absolute top-2 right-2 flex size-11 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
      </dialog>
    </>
  );
}
