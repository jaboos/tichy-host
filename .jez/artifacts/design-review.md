# Design & UX review: Tichý host

**Date**: 2026-08-11 · **URL**: http://localhost:5177/ · **Viewport**: 390 × 844

Driven in Chrome: onboarding → Pas → cook picker → intervention row.

## Overall impression

The visual language is genuinely good — palette, serif/mono pairing and the station
disks read as designed rather than defaulted. The problem is not taste. It is that
**two fixed elements collide, several chips overflow their boxes, and the two most
important decisions in the game have no interface at all.**

The controls feel unintuitive for three specific reasons, not a vague mood: the push
has no target and no offer, the picker is mostly dead options with no way to swap,
and the bottom of the screen has three things fighting over it.

## High

- **The CTA and the tab bar occupy the same space.** `.cta` is `position: fixed;
  bottom: 18px`, `TabBar` is `position: fixed; bottom: 0`. The CTA sits on top of the
  nav on every gameplay screen, so the nav cannot be reached while the CTA is visible.
  → One bottom region: CTA stacked above the tab bar, or the tab bar hidden on
  decision screens.

- **The CTA covers content.** `--pad-bottom: 128px` assumes a one-line CTA, but the
  status note makes it two lines, so it overlaps the last cook row. On onboarding it
  lands squarely on a brigade card.
  → Pad by the CTA's real height, or move the status line above the button.

- **"Zahájit servis" wraps to two lines.** Label and status share one row, so the
  label gets ~40 % of the width and breaks mid-phrase. The primary action of the
  screen reads as broken.
  → Label on its own line, status underneath at `--fs-small`.

- **Přitlačit has no target and no offer.** Selecting it silently pushes whichever
  station is most overloaded. The player is never told which, never chooses, never
  sees the trade. PRD §3.5 requires both sides before confirming —
  `Hvězdný talíř 18 % → 34 %. Vada 4 % → 19 %` — and none of it exists. This is the
  decision the game is built around and it currently has no interface.
  → Target picker, then a confirm panel carrying both numbers.

- **All six interventions do the same silent thing.** Pochvala, Seřvání, Přesun,
  Škrtnout chod and Odložit volno each pick a target in code — first cook, worst
  station, last course — that the player never sees. Four of the six are not
  functioning as decisions at all.
  → Each needs a target step, or should be disabled until it has one.

- **Picker chips overflow their boxes.** `Oheň · POST JE OBSAZENÝ` runs past the right
  edge of the card. `.chip` sets `white-space: nowrap` and label-plus-reason cannot fit
  a half-width column at 390 px.
  → Reason on a second line inside the chip, or shorten to `obsazeno` / `dva`.

## Medium

- **The picker is mostly dead options with no way to act on them.** Ilona's picker
  offers five options, three disabled: the kitchen starts fully staffed, so nobody
  moves until somebody else moves first. The rules are right; the interface gives no
  path through them.
  → Add swap: tapping an occupied station proposes exchanging the two cooks. Three
  dead rows become three real choices and the two-step dance disappears.

- **`ODOLNOST` and `CHTĚNÍ` still touch on some rows.** Fixed in `CookRow` (150 px,
  10 px gutter) but the triptych is squeezed when a name is long — Petr Vaňous and
  Jana Hrubá still collide, Dita Kesslerová does not. Onboarding was never fixed; it
  still uses the 132 px column.
  → Fixed min-width on the triptych; let the name truncate, not the labels.

- **The wear bar reads as broken.** A full-width empty rail with `0,0` beside it and
  no label. At wear 0 on evening 1 it looks like a bar that failed to load.
  → Label it, or hide the rail until wear is above zero.

- **`zátěž 10 / kapacita 8,8` wraps to two lines** in the narrow station cards, making
  the 2×2 rows uneven.
  → `10 / 8,8` with the words as a `--fs-micro` label above.

- **The language switch is the most prominent control on the first screen.** Top-right,
  above the title, first thing the eye lands on.
  → Move it to a settings/house screen or the foot of onboarding.

- **The trait chip looks like a button and does something unrelated.** `Nožířka` sits
  beside the wear number and opens the cook card. Nothing suggests that.
  → Make the name area the link to the card; render the trait as static text.

## Low

- The bar chevron renders as a faint dot at `--fs-small` beside a 20 px number.
- Suspicion dial and label are cramped into the corner against the language button.
- The seed placeholder `7K3-MAREN` looks pre-filled rather than a hint.
- One console 404 (favicon).

## What looks good

- Palette, noise texture, serif/mono pairing — it reads as a designed object.
- Station disks: colour ramp, red glow and `PŘETÍŽENO` do exactly what §8.4 asks —
  the overloaded station is the first thing you see.
- The placement chip on every cook row (`Omáčky · vedoucí`). The FR-1a fix landed.
- Lead and helper named on the station card. That fix landed too.

## Top 3 fixes

1. **Fix the bottom of the screen.** CTA/tab-bar collision, CTA covering content, CTA
   label wrapping — one layout change fixes all three, and it is the most visible
   damage on every screen.
2. **Give Přitlačit a target and an offer**, then the other five interventions too, or
   disable them until they have one.
3. **Add swap to the picker**, so the assignment rules become playable rather than a
   wall of greyed-out options.
