# Design rubric

**Read `vercel-web-interface-guidelines.md` in this directory first.** That is the baseline —
Vercel Labs' MUST/SHOULD/NEVER checklist for interactions, keyboard, forms, animation, content
handling, performance, hydration and theming. It is vendored verbatim and it is not negotiable.

This file is the layer on top: composition, hierarchy, spacing and type rhythm, accent economy,
and the failure modes that make a page look generic. The two barely overlap — Vercel's covers
how it *behaves*, this covers how it *reads*.

Every rule here is written so a claim about it can be **checked and stated as a number** — that
is the point. "Feels cramped" is not a finding. "Gaps of 11/14/18/22/25px in one card" is.

> **Known tension:** Vercel's Design section prefers APCA over WCAG 2 for contrast. `audit.js`
> computes WCAG 2 ratios, because they are cheap to compute and are what accessibility law
> references. Treat a WCAG pass as the floor, not as proof it reads well — especially for light
> text on mid-tone backgrounds, where WCAG 2 is known to be over-permissive.

## 1. Spacing

- One scale, declared once as tokens. 4px-based (4 8 12 16 24 32 48 64 96) or a ratio.
- Every margin, padding and gap resolves to the scale. Off-scale values are a defect.
- **Section padding must NOT be uniform across the page.** Identical vertical rhythm in every
  section is the single strongest "generic template" tell. Vary it by content weight.
- Related things closer than unrelated things. If the gap above a heading equals the gap below
  it, the grouping is broken.

## 2. Type

- One ramp, consistent ratio. **Max 5 sizes on a page** — more means no hierarchy.
- Adjacent levels must differ enough to read as different: at least ~1.25x.
- Body text >= 16px on mobile. Nothing below 12px, ever. Uppercase + letterspacing needs
  MORE size, not less — 11px letterspaced caps is unreadable on a phone.
- Measure 45-75ch. Line-height falls as size rises: ~1.6 body, ~1.1 display.
- Long-form text left-aligned. Centred paragraphs beyond two lines are a defect.

## 3. Hierarchy

- **Exactly one primary action per screen.** Two buttons of equal visual weight = zero primary.
- First paint must have an obvious focal point. Name it. If you cannot, there isn't one.
- Count elements competing at the same weight. More than ~3 and the eye has nowhere to land.
- Rank by importance, not by source order.

## 4. Composition

- **No hollow folds.** A large empty band in the first screen reads as broken, not as elegant
  restraint. `audit.js` measures this: >30% empty band = investigate.
- Do not centre everything. Centred hero + centred sections + centred cards = template.
- Asymmetry, overlap and full-bleed edges are what make a layout look authored.
- Cards that are all identical weight give the eye nothing. Vary size, or lead with one.

## 5. Colour

- Accent is a scarce resource. **More than ~3 accent moments per screen and it stops meaning
  "important".**
- All colour from tokens. A raw hex outside the token block is a defect.
- Contrast floors: 4.5:1 body, 3:1 for >=24px or bold >=18.66px, 3:1 for UI borders.
- Text over photos or gradients needs a scrim, and cannot be checked from CSS — it needs eyes.

## 6. Imagery and placeholders

- If the design leans on photography, it fails without it. A placeholder must read as a
  **deliberate frame** — labelled, structured, obviously intentional.
- A bare gradient standing in for a photograph reads as a smear or a broken image. It is not
  a neutral placeholder; it actively looks cheap.
- Every img needs width/height (or aspect-ratio) or the page shifts as it loads.

## 7. States

Every interactive element needs: default, hover, **focus-visible**, active, disabled.
Every data surface needs: empty, loading, error. Missing states are defects, not omissions.
Never signal anything by hover alone — it does not exist on a phone.

## 8. Mobile

- 390px is the design target. 320px must not break.
- Tap targets >= 44x44 including padding. A 4px-tall dot is not a control.
- Primary actions within thumb reach — lower two-thirds.
- Respect `env(safe-area-inset-*)`, `prefers-reduced-motion`, and 200% zoom.
- Test with the on-screen keyboard open if there are inputs.

## 9. Dark mode

Not an inversion. Elevation, borders and shadows must still read; pure black rarely works;
accents usually need lifting for contrast. Check both schemes, and both palettes if themed.

## 10. Landing-page failure modes

Check these by name — they are the usual causes of "it looks like ass":

1. Hollow hero — most of the fold is empty
2. Everything centred
3. Uniform section rhythm — monotone
4. Two or more competing primary CTAs
5. A decorative gradient doing a photograph's job
6. Placeholder that reads as broken rather than pending
7. Too many type sizes, none clearly dominant
8. Uniform card grid with no lead element
9. No focal point on first paint
10. Desktop layout merely narrowed, not rethought, for mobile
