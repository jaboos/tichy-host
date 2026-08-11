# PRD — Tichý host (The Silent Guest)

> Product Requirements Document for autonomous implementation by Claude Code.
> **Version 1.0 · derived from design spec v4 (all constants verified by simulation over 500+ seasons).**
### Repository layout

```
CLAUDE.md                  ← working rules: commands, invariants, glossary. Read every session.
PRD.md                     ← this file. The build spec.
TICHY-HOST-v4-FINAL.md     ← game design. Authoritative for mechanics and rationale.
sim-final.js               ← RNG oracle + historical balance reference. Superseded on harmony (§3.6).
tichy-host-vizual-brief.md ← art direction rationale.
design/
  tokens.css               ← SINGLE SOURCE OF TRUTH for the visual language. Copy verbatim.
  *.dc.html                ← the 7 winning mockups. Canon for look only (see §6.6).
  archive/                 ← rejected visual directions. IGNORE — do not read, do not implement.
docs/                      ← design history. Context only, superseded by the two files above.
```

Where any document disagrees with `PRD.md`, this file wins. Where `PRD.md` is silent on mechanics, `TICHY-HOST-v4-FINAL.md` wins. Where either disagrees with `sim-final.js` on a number, **the simulation wins** — it is the only artefact that was measured.

---

## 1. Overview & Goals

### 1.1 What this is

A browser-based text management game about running a fine-dining restaurant. The player is chef-owner and **never cooks**. They assign six cooks to four stations, compose a six-course tasting menu, and try to earn a star from the fictional **Průvodce Lambert**, whose inspector visits anonymously three times per season.

One season = 8 weeks × 5 evenings = **40 evenings ≈ 45 minutes**. Definitive ending. Career = 3 seasons.

### 1.2 The single mechanical thesis

Every evening matters because the player never knows which one is being judged. Skill lies in reading probabilistic signals ("a guest sat alone by the window and asked about the tap water" → **Suspicion 38 %**) and deciding what to spend on that information — who rests, and when to burn one of five *Přitlačit* tokens.

This is verified, not asserted. Measured over 500 seasons per policy:

| Policy | ★ | ★★ |
|---|---|---|
| Nobody ever rests, fixed menu | 18.0 % | 0.8 % |
| Rest when worn | 36.8 % | 4.4 % |
| + weekly menu revision | 46.8 % | 10.8 % |
| **+ reading the signals** | **60.6 %** | **26.4 %** |
| Oracle (knows visit dates) | 97.6 % | 91.4 % |

**79 % of seeds resolve differently depending on how they are played.** The gap between good and perfect play is 37 points — the game is information-bound, not variance-bound.

### 1.3 MVP goals — what must work in v1

1. A full 40-evening season is playable start to finish without a crash or dead end.
2. Monday planning → evening decision → service reveal → consequence loop, at 40–60 s per evening.
3. The scoring engine reproduces the measured skill ladder of `sim-final.js` within ±3 pp (golden tests, §8.2). Note: **only the RNG stream is bit-exact** — see §8.2 for what "match the simulation" does and does not mean.
4. Hidden inspector with correctly calibrated Bayesian suspicion, three mid-season verdicts, final Lambert letter.
5. Save/resume via `localStorage` after every evening, including RNG state.
6. Full CZ + EN localisation, switchable at runtime.
7. Randomised brigade draft and course-catalogue rotation per run (this is the replayability engine — see §3.9).
8. Shareable season chronicle as text and PNG.

**Explicit non-goals for MVP:** no backend, no accounts, no cloud saves, no leaderboards, no analytics, no sound, no special evenings, no staff market, no rule-changing venues, no difficulty ladder. See §7.5.

### 1.4 Audience & use case

Players of Football Manager and roguelites (Balatro, Slay the Spire), 25–45, playing an evening session on a phone or laptop. Market verified as of August 2026: a "Football Manager for chefs" does not exist.

Session shape: one season is one sitting. The game offers an exit **only at week boundaries** (diegetic button *Zamknout kuchyni*), eight times per season — but autosaves every evening.

---

## 2. Tech Stack & Architecture

### 2.1 Stack

| Layer | Choice | Rationale |
|---|---|---|
| Build | **Vite 5** | fast, `vite-plugin-singlefile` can emit a single distributable HTML |
| Language | **TypeScript 5**, `strict: true` | the game is a numeric simulation; types prevent silent balance drift |
| UI | **React 18** | mockups are already React-shaped (`DCLogic` = component with `state` + `renderVals`) |
| Styling | **CSS custom properties + CSS Modules** | mockups use inline styles; port them to tokens (§6.1) |
| State | **Zustand** | single game-state store, trivially serialisable to `localStorage` |
| i18n | hand-rolled `t(key, params)` over a typed dictionary | 2 languages, ~600 UI keys — a library is overkill |
| Tests | **Vitest** | golden tests on the engine are mandatory |
| Persistence | `localStorage` | no backend in MVP |
| Icons | inline SVG only | no icon library; the design uses typographic marks (✦ ! ⇄ ✕ ❧) |
| Fonts | Cormorant Garamond 600, Inter 400/500/600, IBM Plex Mono 400/500/600 | **self-hosted via `@fontsource`**, not Google CDN (offline + PNG export, §5.2) |

Node 20+. Package manager: `pnpm`.

### 2.2 Hard architectural rule

**The engine is pure and has zero React imports.** Everything in `src/engine/` is a pure function of `(state, action, rng) → newState`. No `Date.now()`, no `Math.random()`, no DOM. This is what makes the game replayable from a seed, testable against `sim-final.js`, and safe to rebalance.

Data flow is one-directional:

```
UI event → store action → engine.reduce(state, action) → new state → React re-render
                                     ↓
                            persistence.save(state)
```

### 2.3 Folder structure

```
tichy-host/
├─ PRD.md
├─ TICHY-HOST-v4-FINAL.md
├─ index.html
├─ vite.config.ts
├─ package.json
├─ tsconfig.json
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ engine/                    # PURE — no React, no side effects
   │  ├─ types.ts                # all game types (§4)
   │  ├─ constants.ts            # every tunable number, one file (§3.4)
   │  ├─ rng.ts                  # mulberry32, serialisable state
   │  ├─ bar.ts                  # computeBar()  — the Lambert bar
   │  ├─ plate.ts                # computePlateQuality()
   │  ├─ service.ts              # runService() → ServiceResult
   │  ├─ inspector.ts            # signal draw + Bayesian posterior
   │  ├─ wear.ts                 # wear, rest, growth
   │  ├─ economy.ts              # cash, reputation, covers
   │  ├─ season.ts               # advanceEvening, advanceWeek, judge
   │  ├─ draft.ts                # brigade + catalogue generation from seed
   │  └─ narrator.ts             # facts → at most 3 lines
   ├─ data/
   │  ├─ cooks.ts                # 24 cook archetypes
   │  ├─ courses.ts              # 30 courses
   │  ├─ traits.ts               # 12 traits
   │  └─ signals.ts              # 9 inspector signals
   ├─ store/
   │  ├─ gameStore.ts            # Zustand store
   │  └─ persistence.ts          # save/load/migrate
   ├─ i18n/
   │  ├─ index.ts                # t(), language switch
   │  ├─ cs.ts
   │  └─ en.ts
   ├─ screens/
   │  ├─ Onboarding.tsx
   │  ├─ MondayPlan.tsx
   │  ├─ Pas.tsx
   │  ├─ Service.tsx
   │  ├─ Menu.tsx
   │  ├─ Calendar.tsx
   │  ├─ CookCard.tsx
   │  ├─ Verdict.tsx
   │  └─ Chronicle.tsx
   ├─ components/
   │  ├─ BarIndicator.tsx        # the bar, present on every screen
   │  ├─ Docket.tsx
   │  ├─ StationDisk.tsx
   │  ├─ CookTriptych.tsx        # the three slots (§6.5)
   │  ├─ CookRow.tsx
   │  ├─ SuspicionDial.tsx
   │  ├─ BrassDivider.tsx
   │  └─ TabBar.tsx
   ├─ styles/
   │  ├─ tokens.css
   │  └─ global.css
   └─ tests/
      ├─ golden.test.ts          # MUST reproduce sim-final.js
      ├─ bayes.test.ts
      ├─ i18n.test.ts            # no hardcoded strings, cs/en key parity
      └─ edge.test.ts
```

---

## 3. Core Features & Requirements

### 3.1 The evening loop

The atomic unit. Target 40–60 s.

**Screen order:** Pas (assignment + one intervention) → Service (reveal) → Consequence → next evening.

#### FR-1 Pas screen

**Inputs:** current `GameState`.
**Outputs:** updated `assignment`, chosen `intervention`, then `START_SERVICE` action.

Displays, top to bottom:
1. Header: venue name, `Evening 14/40 · Thursday · 34 covers`, **SuspicionDial** (circular, 0–100 %).
2. Maître line (italic serif): the drawn signals rendered as one sentence.
3. **BarIndicator** — today's bar with tap-to-expand breakdown (§3.3). **Mandatory on this screen.**
4. Four **StationDisk** components in a 2×2 grid: load %, colour ramp green → amber → red, pulsing radial glow + `PŘETÍŽENO` badge when `overload > 0`.
5. Six **CookRow** components: name (serif), station, the **three-slot triptych** (§6.5), home-station marker, wear bar, trait chip, optional warning line.
6. **One intervention of six** (§3.5), mutually exclusive, selection is required-optional (may choose none).
7. Fixed bottom CTA `Zahájit servis` + status line summarising overloaded stations and whether an intervention is set.

Assignment interaction: tap a cook to select, tap a station to assign; drag-and-drop also supported on pointer devices. Tap an assigned cook chip on a station to unassign.

**Edge cases:**
- Fewer available cooks than stations → station may stay empty; UI must show it red *before* service with the text "no hands" and every course on that station resolves as a defect without computing Q.
- Max **2 helpers** in the brigade, each on a different station; a station may have at most 1 lead + 1 helper. The UI must refuse a third helper with an inline message, not a silent no-op.
- A cook with `wear >= 9` shows a red pre-warning two evenings running before hitting the cap.

#### FR-2 Service screen

**Inputs:** `ServiceResult` — fully computed **before** any animation.
**Outputs:** none; it is a replay.

Dockets slide in from the right, 80 ms apart, on a metal pass rail. Per docket: time, table, course name (serif), station · cook, and **deviation from the bar** (`+1.4` / `−0.6 POD`) — never the absolute Q. Running total counts up with a 520 ms cubic ease.

States: **passed** → soft click, green tick. **Star plate** → gold embossed ★, brief flash. **Defect** → struck through in red, rotates ~3° and drops off the rail.

The most consequential docket is revealed **last** regardless of menu order. Reveal order affects display only; it must never touch the computed data.

Tapping anywhere skips to the final result.

**Edge case:** closing the tab mid-reveal must lose nothing — the result was persisted before the animation started; on reload the game shows the finished result.

`prefers-reduced-motion` → no cascade, show final state immediately.

#### FR-3 Consequence

One line of narrator text (§3.8) plus deltas: reputation, cash, wear changes. Then `Další večer`.

### 3.2 Monday planning

**FR-4.** At the start of each week the player receives **six rest tickets** and distributes them across the five evenings. Not a 5×6 grid — six physical cards, 5–7 taps total.

While planning, a live forecast updates under the finger for the evening being edited: `Fri · Sauces without Marek → capacity 3.4 / load 6.0 → OVERLOADED`.

Also on this screen: menu revision (§3.6) and the premium-ingredients toggle (§3.7).

**Week 1 has planning locked** — copy: *"Rozpis ti nechal odcházející sous."* It unlocks Monday of week 2. Deciding about rest before knowing what wear does is not a decision.

**Constraints:** at most one rest ticket per cook per evening; a cook may receive at most 2 tickets per week; the deferred-rest queue (from the *odložit volno* intervention) is capped at 2 and unpaid rest expires at season end.

### 3.3 The bar (laťka) — the most important number in the game

**FR-5.** The bar is a **persistent UI element on every gameplay screen**, rendered as a line across the dockets and as a value in the header. Tapping expands the full breakdown.

```ts
bar = 12.0
    + clamp(1.4 * (3.33 - avgCourseDifficulty), -1.0, 2.5)
    + 0.20 * weekIndex          // 0-based
    + 0.03 * (reputation - 15)
    + 0.4  * (seasonNumber - 1)
    + 0.5  * meanHarmony(menu)  // ← the bar prices harmony too
```

**Why harmony is priced.** Any player-chosen quality the bar does *not* claw back becomes a dominant strategy — this is the same failure the moving bar was introduced to fix for ambition. Measured: an optimised menu reaches mean harmony 0.90 while a thoughtless one sits at 0.12, i.e. ~1.5 free quality on every plate. At coefficient `0.5` the ladder is monotone on both ★ and ★★ and harmony is still worth pursuing; at `1.1` optimisers stop chasing it entirely (mean harmony falls to 0.0) and menu composition becomes pointless. Evidence: `docs/sim-harmony.js`.

Breakdown UI: `base 12.0 · week +1.4 · reputation +0.9 · season +0.0 · menu ambition −1.1 = 13.2`

Derivative of the bar with respect to the player's own quality is 0.48 — success raises the bar but does not erase progress.

Thresholds are **relative to the bar**, never absolute:

| Outcome | Condition |
|---|---|
| defect | `Q < bar` |
| passed | `Q >= bar` |
| star plate | `Q >= bar + 7.5` |

*(Verified: at 8.5 the two-star ladder inverts — weekly menu revision scores **worse** than no revision, 4.2 % vs 4.6 %. At 7.5 it is monotone: 0.8 → 4.4 → 10.8 → 26.4. `sim-final.js` default is 7.5 and it wins.)*

The star-plate ceiling is **unreachable by menu construction alone**. The game must state this in week 1 through a character line: *"Bez rizika se hvězdný talíř neuvaří. Nikdy."*

### 3.4 Scoring engine

**FR-6.** Two waves per evening — 18:30 (weight `0.7`) and 20:30 (weight `1.3`). Six courses × 2 waves = 12 plates per evening.

```ts
effectiveHand(cook, station) = cook.hand + (cook.homeStation === station ? 1 : -1)

capacity(station)  = 2.0 * (effHand(lead) + 0.4 * effHand(helper ?? 0))
load(station)      = Σ difficulty of courses on that station
overload(station)  = max(0, load / capacity - 1)
crowding(station)  = 1.5 * max(0, countCourses(difficulty >= 4) - (helper ? 2 : 1))

Q = 9.5
  + 1.6 * effHand(lead)
  + 0.6 * effHand(helper)
  + 0.9 * course.difficulty
  - 2.2 * max(0, course.difficulty - effHand(lead))
  + seasonality(course, week)          // 0.8 * sin(2π * (week + course.phase) / 8)
  + course.harmony                     // §3.6, range -2.0 … +2.0
  - 5.0 * overload²
  - crowding
  - lead.wear * lead.enduranceCoef * waveWeight
  + (pushedStation === station ? 2.5 : 0)
  + (premiumIngredients ? 0.8 : 0)
  + rng.uniform(-1, 1) * (1 + 0.25 * max(0, difficulty - 2)) * (pushed ? 2.2 : 1)
```

Endurance coefficients: `vydrží 0.30 · normál 0.40 · rychle hoří 0.50`.

**This is the only output randomness in the game.** Everything else — draft, catalogue, visit dates, signals, seasonality — is input randomness, resolved before the player decides.

**Wear:** lead `+0.3 + 0.18 * stationLoad` · helper `+1.0` · push `+2.0` extra to that lead · rest `−5` · Monday `−2` to everyone · clamp `[0, 10]`.

**Growth:** a cook's clean-evening counter increments when **both** hold — no defect occurred on their station **and** `max difficulty on their station >= their effective hand` (the work stretches them). Thresholds **14 / 30 / 60** clean evenings → `+1 hand`, cap 5.

All numbers above live in `src/engine/constants.ts` as a single exported frozen object. **No magic numbers anywhere else in the codebase.**

### 3.5 Interventions

**FR-7.** Exactly one per evening, mutually exclusive, chosen before service. Six options:

| Id | Label (cs) | Effect |
|---|---|---|
| `praise` | Pochvala | `−1.5` wear to one cook, this evening only |
| `scold` | Seřvání | `+0.5` Q on one station this evening, `+1.5` wear to its lead |
| `swap` | Přesun | move one cook against the Monday plan |
| `cutCourse` | Škrtnout chod | remove one course tonight; it **counts as a defect** |
| `deferRest` | Odložit volno | cancel tonight's rest ticket, return it later (queue cap 2) |
| `push` | **Přitlačit** | `+2.5` Q on one station, variance `×2.2`, `+2.0` wear to its lead |

**Přitlačit costs one of five brass tokens per season.** Token count is displayed permanently. Exhaustibility is what turns a threshold rule into a decision: the right answer depends on how many tokens and how many evenings remain.

The push UI must show **both sides** of the offer before confirming:
`Star plate 18 % → 34 %. Defect 4 % → 19 %.`

### 3.6 Menu

**FR-8.** Six courses selected from the 18 available this run (drawn from a catalogue of 30). At least one course per station.

Course fields: `station`, `difficulty (1–5)`, `seasonPhase (0–7)`, `flavour`.

**Harmony is computed from neighbours**, taken from the mockup (it is far more legible than a static per-course value):

| Relation between adjacent courses | Value |
|---|---|
| same station | `−2.0` |
| same flavour | `−2.0` |
| opposing flavours (meaty↔sour, earthy↔sour, anything→sweet) | `+2.0` |
| otherwise | `0` |

Each course sums its contribution from its left and right neighbour, then clamps to `[-2.0, +2.0]`. First and last courses have one neighbour and are **not** penalised for it.

> Design note: v4 specified harmony as a static course property with coefficient 0.75, which measured **0.0 impact**. Simulation showed the coefficient must reach ~2.0 to matter. The neighbour rule from the mockup at strength 2.0 is therefore adopted here and supersedes v4 §6.

UI: a printed menu card. Course names in Cormorant Garamond, numbers in mono. Green/red arcs drawn between adjacent rows showing `+2` / `−2`. Footer shows food cost %, four mini station-load discs, and menu ambition's effect on the bar.

**Menu changes are allowed on Monday only** and cost **two trial evenings at `−1.0` Q**. If an inspection lands in those evenings, that is the risk of revising.

**No price bands.** The mockup's 2400/2800/3400 selector is cut — measured at 0.0 impact on stars.

### 3.7 Economy

**FR-9.** Deliberately minimal. Simulation proved a larger economy has zero effect on outcomes (±20 % on rent, price, covers = 0.0 points).

- **Cash** — single number. Below `−150 000 CZK` = season lost, an investor takes over.
- **Premium ingredients** — weekly yes/no. `+0.8 Q to every plate`, `food cost +8 pp`. **The only channel through which money touches quality.**
- Covers `= clamp(round(14 + reputation / 3.5 + (weekend ? 6 : 0)), 12, 40)`; weekend = evening index 3 and 4.
- Price fixed at `2 800 CZK`. Food cost `= 26 % + 2 % × average difficulty`. Wages `16 000` + operations `18 000` per evening, rent `40 000` per week.
- **Reputation** `0–100`, starts at `15`:
  `rep += 0.45 * (avgQ - bar) - 0.35 * defects + 0.5 * starPlates`, clamped.
  Drives covers and raises the bar. Cannot be spent.

Start: cash `250 000`, reputation `15`.

### 3.8 Inspector

**FR-10.** Three visits per season, one per third of the season, random within the third. The last visit must not fall on evening 40.

**The inspector eats six plates in one wave** (the wave is drawn and revealed retroactively). Three visits = 18 plates.

Each evening, four independent signals are drawn. Four correlate with the inspector:

| Signal | LR |
|---|---|
| Sat alone by the window, no phone | 2.4 |
| Ordered tap water and asked about it | 3.1 |
| Declined the pairing, chose wine from the list | 1.9 |
| Stayed for coffee, wrote in a paper notebook | 2.8 |

Base incidence `p(signal | no inspector) = 0.18`; `p(signal | inspector) = min(0.85, 0.18 × LR)`.

```ts
// CRITICAL: absent signals contribute too. Omitting them overstates the posterior by 5.5×.
let lr = 1;
for (const s of signals) {
  lr *= s.present ? (s.pH / s.pNotH) : ((1 - s.pH) / (1 - s.pNotH));
}
// Prior must be computed against the CURRENT THIRD, not the rest of the season —
// visits are one per third (below), so a season-wide prior understates risk late in
// a third by up to 4 pp. Use only information the player actually has:
//   thirds        = evenings [0..12], [13..26], [27..38]   (evening 39 never hosts a visit)
//   lastReported  = final evening of the last completed week (-1 before the first Sunday)
//   if a report card already confirmed a visit in this third → prior = 0
//   else prior = 1 / (evenings in this third with index > lastReported)
// The count only shrinks at week boundaries, which is correct: until Sunday the player
// genuinely cannot tell whether Tuesday was the visit.
const prior = visitConfirmedInThisThird ? 0 : 1 / unknownEveningsInThisThird;
const odds  = (prior / (1 - prior)) * lr;
const suspicion = odds / (1 + odds);
```

The player is shown **one number** plus the maître's words. The LR table belongs in a tooltip, not on screen.

#### FR-11 Three mid-season report cards

**A visit is confirmed by the end of the same week**, on Sunday: *"Ten pán ve čtvrtek. Volali z redakce průvodce, chtěli jméno šéfkuchaře."*

The report card lists **exactly those six plates against that day's bar**, plus the retroactive anchor:

```
Visit 2 · evening 21 · second wave:
11.4 · 13.0 · 9.8 POD · 14.1 · 12.2 · 15.0
Your suspicion at the time: 62 %. You pushed Sauces. Short by 0.2.
```

Without this the learning loop for the only outcome that matters is 45 minutes long. This is a **must-have**, not polish.

#### FR-12 Stars

| | Condition |
|---|---|
| ★ | at most **1** of the 18 plates below the bar |
| ★★ | **zero** plates below the bar **and** at least one star plate in **each** visit |
| retention | next season's bar `+0.4` |

Final verdict = a letter on cream paper (the only light screen in the game), citing three concrete evenings, sealed with wax, then the star.

### 3.9 Draft & catalogue rotation — the replayability engine

**FR-13.** This is in MVP because simulation showed it is the strongest source of run-to-run variety: playing a menu tailored to a different brigade costs **51.6 percentage points**, and one brigade's optimum played by another dropped to **0.1 %**. Different cooks are not cosmetics — they are a different puzzle.

- **First run:** curated fixed brigade (onboarding) — the six cooks in §4.2.
- **Every run after:** six cooks drawn from a pool of **24 archetypes**, seeded. Constraint: hand values must sum to `14 ± 2`, all four stations must be someone's home station, at least one `rychle hoří`.
- **Catalogue:** 18 of 30 courses drawn per run, with at least 4 per station and at least one course of difficulty 5.

### 3.10 Save, seed, localisation

**FR-14 Persistence.** Key `tichy-host-v4`, one active-game slot plus a chronicle list. Autosave after every evening, **including RNG state**. Schema carries `version: number`; on mismatch attempt migration, else archive the old save under `tichy-host-v4-backup` and start fresh — never crash, never silently wipe.

**FR-15 Seed.** Format `7K3-MAREN` (3 chars, dash, 5 chars, from `[A-Z0-9]` minus ambiguous `O/0/I/1`). Determines brigade, catalogue, visit evenings, signals and every roll. A weekly seed derives from the ISO week in UTC.

**FR-16 i18n.** Every string in a typed dictionary; switchable at runtime without losing state. Czech cook names need nominative and accusative forms stored explicitly (`Ilona` / `Ilonu`). Numbers formatted per locale (`12,3` vs `12.3`). Chronicles store the language they were generated in.

### 3.11 Narrator

**FR-17.** The simulation logs structured facts; it never writes prose. The narrator receives 30–60 facts per evening and **may tell three**.

Ranking = `|deviation from expectation| × player attention to the actor × novelty`. A course that went fine is not commented on — **silence is information**.

Hard limits: service ≤ 3 lines · no paragraph over 40 words · event 60 words + options of 8 · the number is visible immediately, the story is behind a tap · every text either changes state or is at most two sentences.

A repetition budget in `localStorage` prevents the same template twice within a season.

---

## 4. Data Model

No database. All state is one serialisable object.

### 4.1 Core types

```ts
type Station = 'cold' | 'fire' | 'sauce' | 'dessert';
type Flavour = 'earthy' | 'sour' | 'meaty' | 'dairy' | 'sweet';
type Endurance = 'lasts' | 'normal' | 'burns';       // 0.30 | 0.40 | 0.50
type Lang = 'cs' | 'en';

interface Cook {
  id: string;
  firstName: string;
  lastName: string;
  lastNameAcc: string;          // Czech accusative, for narrator templates
  age: number;
  hand: number;                 // 1–5, the only skill number
  homeStation: Station;
  endurance: Endurance;
  traitId: string;
  wear: number;                 // 0–10, one decimal
  cleanEvenings: number;
  growthThreshold: 14 | 30 | 60;
  desire: Desire;
  paradox: string;              // i18n key, one sentence shown on the card
}

interface Trait {
  id: string;
  nameKey: string;
  descKey: string;
  // pure modifier applied inside computePlateQuality
  apply: (ctx: PlateContext, q: number) => number;
}

interface Desire {                 // two-step personal arc
  step: 0 | 1 | 2;
  progress: number;                // e.g. 2 of 3
  target: number;
  rewardTraitId: string | null;
  refusals: number;                // 2 refusals → outside offer
}

interface Course {
  id: string;
  nameKey: string;
  station: Station;
  difficulty: number;              // 1–5
  seasonPhase: number;             // 0–7
  flavour: Flavour;
  isSignature: boolean;
}

interface Assignment {
  leads:   Record<Station, string | null>;   // cookId
  helpers: Record<Station, string | null>;   // max 2 non-null overall
  resting: string[];                          // cookIds
}

interface WeekPlan {
  restTickets: Array<{ cookId: string; eveningIndex: number }>;  // 6 per week
  deferredRest: string[];                                        // queue, cap 2
  menuChangedThisWeek: boolean;
  trialEveningsLeft: number;                                     // 0–2, −1.0 Q each
  premiumIngredients: boolean;
}

interface Signal { id: string; lr: number; present: boolean; }

interface Plate {
  courseId: string; station: Station; wave: 0 | 1;
  q: number; bar: number; outcome: 'defect' | 'passed' | 'star';
}

interface ServiceResult {
  eveningIndex: number; bar: number; covers: number;
  plates: Plate[];                       // 12
  avgQ: number; defects: number; starPlates: number;
  wasInspected: boolean; inspectedWave: 0 | 1 | null;
  revenue: number; costs: number;
  facts: NarratorFact[];
}

interface Visit {
  eveningIndex: number; wave: 0 | 1;
  plates: Plate[];                       // 6
  suspicionAtTime: number;
  pushedStation: Station | null;
  confirmed: boolean;                    // revealed the following Sunday
}

interface GameState {
  version: number;
  seed: string;
  rngState: number;
  lang: Lang;
  venueName: string;
  seasonNumber: 1 | 2 | 3;
  eveningIndex: number;                  // 0–39
  cooks: Cook[];                         // 6
  catalogue: Course[];                   // 18 available this run
  menu: string[];                        // 6 courseIds, ordered
  assignment: Assignment;
  weekPlan: WeekPlan;
  cash: number;
  reputation: number;                    // 0–100
  pushTokens: number;                    // starts at 5
  visitEvenings: number[];               // 3, hidden from UI
  visits: Visit[];
  history: ServiceResult[];
  stars: 0 | 1 | 2;
  narratorUsed: string[];                // repetition budget
}
```

### 4.2 Starting brigade (first run, fixed)

| Name | Hand | Home | Endurance | Trait |
|---|---|---|---|---|
| Ilona Bartáková | 3 | Sauces | lasts | Nožířka — alone on a station `+2`, with a helper `−2` |
| Marek Ryba | 4 | Fire | burns | Šampión — courses 1–2 `+3`, courses 5–6 `−3` |
| Petr Vaňous | 3 | Cold | normal | Klidná ruka — variance `×0.7` |
| Dita Kesslerová | 2 | Dessert | lasts | Učednice — growth thresholds halved |
| Jana Hrubá | 2 | Sauces | lasts | Čte lístky — `+0.5` on the second wave |
| Ela Brichtová | 2 | Fire | lasts | Vydrží žár — immune to the first `2.0` of wear |

Total hand = 16. Two cooks share Sauces on purpose — competition for a home station is a real cost.

### 4.3 localStorage schema

```ts
'tichy-host-v4'         → { version: 1, game: GameState | null }
'tichy-host-v4-chron'   → ChronicleEntry[]     // completed seasons
'tichy-host-v4-prefs'   → { lang: Lang, reducedMotion: boolean }
'tichy-host-v4-backup'  → string               // raw JSON of an unmigratable save
```

---

## 5. APIs & Integrations

**None.** No network calls at runtime. No telemetry. No external APIs. Fonts are bundled.

Two browser APIs are used:

### 5.1 Clipboard
`navigator.clipboard.writeText()` for the text chronicle, with a `document.execCommand('copy')` fallback via a hidden textarea, and a visible failure message if both fail.

### 5.2 PNG export — do not use `foreignObject`

The mockup `Ucet.dc.html` serialises the DOM into `<svg><foreignObject>` and draws it to canvas. **This will not work in production**: web fonts do not render inside `foreignObject` unless embedded as base64 in the SVG, Safari's support is unreliable, and the canvas may end up tainted.

Implementation must instead **draw the chronicle directly onto a `<canvas>`** with the Canvas 2D API at 1080 × 1350: fill background `#14100D`, draw text with `ctx.font` after `document.fonts.ready`, draw the seed barcode as rectangles, `canvas.toBlob()` → download. Deterministic, no dependency, no tainting.

---

## 6. UI/UX Specification

### 6.1 Design tokens

```css
:root {
  --bg:        #14100D;   --card:     #1F1915;   --card-hi:  #2A221C;
  --ink:       #F5EFE7;   --ink-muted:#A89A88;
  --brass:     #D4A24C;   --brass-hi: #E0B25E;
  --ok:        #6FA36B;   --warn:     #D9922E;   --bad:      #C9503F;
  --line:      #3A2F26;   --seal:     #8C3B2E;
  --paper:     #E8DFCB;                          /* verdict letter only */
  --radius-card: 10px;    --radius-docket: 4px;
  --shadow-card: 0 12px 28px -16px rgba(0,0,0,.9);
}
```

Background carries a 2.2 % fractal-noise SVG overlay (already in the mockups — copy verbatim). Mobile frame `max-width: 390px`, centred; on desktop the same column stays centred with generous margins.

### 6.2 Typography

- **Cormorant Garamond 600** — headings, dish names, cook names, maître quotes (italic).
- **Inter 400/500/600** — UI text.
- **IBM Plex Mono 400/500/600** with `font-variant-numeric: tabular-nums` — every number, all dockets, all metadata rows.

Scale (mobile): 29 / 20 / 17 / 14 / 11.5 / 9. Line-height 1.35–1.45. Minimum text 9 px only for uppercase letterspaced labels; body never below 11.5 px.

### 6.3 Motion

150–250 ms, ease-out. Numbers count up over 520 ms with cubic ease. Dockets stagger 80 ms. Emboss = `scale(1.15) → 1` with 2° rotation. Overloaded station disk pulses (`opacity .35→.85`, `scale 1→1.12`, 1.9 s). Defect docket translates `+16px` and rotates `−3.2°` over 450 ms.

All motion respects `prefers-reduced-motion`.

### 6.4 Screens

| Screen | Purpose | Source mockup |
|---|---|---|
| Onboarding | name the venue, meet the brigade, week-1 locked plan | — |
| MondayPlan | six rest tickets, live forecast, menu revision, premium toggle | `Kalendar.dc.html` |
| Pas | assignment + one intervention | `Pas.dc.html` ✅ primary reference |
| Service | docket reveal | `Servis.dc.html` ✅ primary reference |
| Menu | course selection with harmony arcs | `Menu.dc.html` |
| Calendar | two weeks ahead, covers, taped notes | `Kalendar.dc.html` |
| CookCard | profile, desire arc, evening history | `Kuchar.dc.html` |
| Verdict | Lambert letter, wax seal, star | `Verdikt.dc.html` |
| Chronicle | receipt, copy text / download PNG | `Ucet.dc.html` |

Tab bar: `Pas · Menu · Kalendář · Kádr · Podnik`. (The v2 tab bar omitted Pas and Calendar — corrected here.)

### 6.5 Cook triptych — the three slots

The mockup's dense three-number block (RUKA / HLAVA / OHEŇ) is the strongest visual element on the Pas screen and is **kept**. But only the first slot is a number; the other two carry categorical information as glyphs. The card stays dense without reintroducing attributes that never entered a formula.

Layout is unchanged from `Pas.dc.html`: three columns, value at 13 px mono (30 px on CookCard), uppercase label at 7.5 px with `.1em` letterspacing beneath.

**Slot 1 — RUKA (a number)**
- Large digit = base hand `1–5`, colour `--ink`.
- When the cook is assigned, a small chip to the right shows the home-station modifier: `+1` in `--brass` at home, `−1` in `--ink-muted` away. Unassigned → no chip.
- This is the **only** value that enters `computePlateQuality`.

**Slot 2 — ODOLNOST (a glyph)** — deliberately echoes the StationDisk shape, so the visual language stays consistent.

| Endurance | Glyph | Colour | Reads as |
|---|---|---|---|
| `lasts` (0.30) | `●` | `--ok` | full tank |
| `normal` (0.40) | `◐` | `--brass` | half |
| `burns` (0.50) | `○` | `--warn` | empties fast |

**Slot 3 — CHTĚNÍ (a glyph)** — the drama slot.

| State | Glyph | Colour |
|---|---|---|
| no active desire | `—` | `--ink-muted` |
| step in progress | `●●○` at 9 px | filled `--brass`, empty `--line` |
| step complete, reward ready | `✦` pulsing | `--brass` |
| two refusals, outside offer incoming | `!` | `--bad` |

**Rules**
- Glyphs are never the sole carrier of meaning: the label beneath always names the slot, the CookCard spells the value out in words (`Vydrží` · `Krok 1 · 2 ze 3`), and a first-run tooltip explains each slot once.
- No emoji anywhere — only the typographic marks listed above, which render reliably across platforms.
- Slots 2 and 3 are **display-only projections** of `Cook.endurance` and `Cook.desire`. No new fields in the data model and no new concepts — still twelve (§11.7).
- Implement as one `CookTriptych` component used by both `CookRow` (compact, 13 px) and `CookCard` (large, 30 px, words beneath).

### 6.6 Where mockups diverge from the verified spec

**Mockups are authoritative for visual language only.** Where they conflict with §3, §3 wins. Known divergences, all already resolved above:

| Mockup shows | Correct per spec |
|---|---|
| RUKA / HLAVA / OHEŇ as three numbers; scale 1–20 in Pas, 1–5 in CookCard | Keep the **three-slot triptych** (§6.5), but only slot 1 is a number, scale **1–5**. Slots 2 and 3 become endurance and desire glyphs. |
| FORMA arrow on the cook card | Cut — never entered any formula. Its position is now the desire glyph. |
| Courses have `cas` (minutes) and `naklad` (CZK) | Merged into `difficulty`; cost is a global % formula |
| Price bands 2400 / 2800 / 3400 | Cut — measured 0.0 impact. Price fixed at 2 800 |
| Five interventions | **Six** — add `Přitlačit` with five brass tokens |
| Dockets show absolute points (+6, +14, −9) | Show **deviation from the bar** (`+1.4`, `−0.6 POD`) |
| No bar anywhere on screen | **BarIndicator is mandatory on every gameplay screen** |
| Six dockets per evening | **Twelve** (6 courses × 2 waves); the reveal may group by wave |
| Calendar has 6 open evenings (Tue–Sun) | **5** open (Tue–Sat); Sun = report card, Mon = closed/planning |
| PNG export via `foreignObject` | Direct Canvas 2D rendering (§5.2) |

### 6.7 Design workflow — what is frozen, what you design yourself

**Frozen. Do not reinvent, do not re-derive.**
The visual language is settled: `design/tokens.css` is the single source of truth for colours, type, radii, shadows, motion durations and every keyframe. Copy it to `src/styles/tokens.css` in Phase 3 and treat it as canon. The seven mockups in `design/` are canon for layout and component appearance. Rejected variants live in `design/archive/` — **ignore them entirely**; the steel and light-paper directions were evaluated and dropped.

`design/support.js` is a **vendored third-party runtime** (69 kB, no licence header) committed only so the mockups can be watched in a browser — the fastest way to understand the docket cascade and the pulse timings. It is **not a dependency of this application**. Nothing under `src/` may import it, no pattern from it (`DCLogic`, `renderVals()`, `<x-dc>`, `<sc-for>`, `<sc-if>`) may be copied into the app, and it must be excluded from `tsconfig`, ESLint and Prettier.

To view a mockup you must serve the folder over HTTP (`npx serve design`) — opening it via `file://` fails, because the runtime calls `fetch(location.href)`. It also loads React and Babel Standalone from `unpkg.com`, so it needs a network connection. See `design/README.md`.

**You design these yourself, directly in React.** No mockup exists and none is needed — every one of them is assembled from components that already exist:

| Screen | Build from |
|---|---|
| Consequence (after service) | one narrator line + delta row, same card as Pas |
| Bar breakdown (tap on BarIndicator) | list of addends, mono, brass divider |
| Push confirmation | two-number panel, same chips as the intervention row |
| Report card (Sunday) | six dockets from `Servis.dc.html` + a bar line |
| Onboarding | title in `--font-display`, one input, the brigade as `CookRow`s |
| Empty / error / week-1-locked states | existing card with `--ink-muted` and a red border where relevant |

Work in the running app, not in a mockup tool. Once the game runs, live iteration beats static comps and avoids two sources of truth.

**The one exception: Monday planning (§6.8).** It has no precedent in the mockups, and playtesting flagged it as the highest-risk mechanic in the game. Follow that spec literally rather than inventing an interaction.

### 6.8 Monday planning screen — specified, because it has no mockup

The failure mode is a 5 × 6 grid of checkboxes. That is a shift roster in Excel; the player will click "same as last week" by week 3 and half the game switches off. Build it as **six physical tickets dealt onto five evenings**.

**Layout, top to bottom**
1. Header: `Týden 3 / 8`, cash, reputation. BarIndicator with the bar as it will stand on Tuesday.
2. **Ticket rail** — six cards in a horizontal row, each showing a cook's surname and their triptych at compact size. Undealt tickets sit here.
3. **Five evening rows** (Tue–Sat) — day, covers, and a drop area. A dealt ticket renders inside its evening row as a small card; tapping it returns it to the rail.
4. **Live forecast** under the evening currently being edited, recomputed on every change:
   `Pá · Omáčky bez Marka → kapacita 3,4 / zátěž 6,0 → PŘETÍŽENO`
   Colour follows the station ramp (`--ok` → `--warn` → `--bad`).
5. Menu revision entry point and the premium-ingredients toggle for the week.
6. CTA `Zamknout kuchyni` — this is also the game's exit point (§1.3).

**Interaction**
- Tap a ticket, then tap an evening. Drag-and-drop additionally on pointer devices. Never require drag.
- Target: **5–7 taps to plan a whole week.** If a design needs more, it is wrong.
- Tickets may be left undealt; unused rest is not forced.

**Rules to enforce in UI, not just in the reducer**
- At most 1 ticket per cook per evening; at most 2 per cook per week. A refused drop shows an inline reason, never a silent no-op.
- Week 1 is locked: rail and rows are visible but non-interactive, with the line *"Rozpis ti nechal odcházející sous."* and a note that it unlocks next Monday.
- The deferred-rest queue (from the `deferRest` intervention) shows as pending tickets marked `dlužné`, cap 2.

**Acceptance:** a player who has planned once must be able to plan a week in under 30 seconds, and must be able to see — without starting service — which evening is going to be overloaded.

### 6.9 Accessibility

Contrast `--ink` on `--bg` ≈ 14:1. Colour is never the only signal — defects are struck through, star plates embossed, and every triptych glyph differs in **shape** as well as colour (`● ◐ ○`), so it survives colour blindness and greyscale. Touch targets ≥ 44 px. Full keyboard path for assignment (tab to cook, arrow to station, enter to assign). `aria-live="polite"` on the running total. Each triptych slot carries an `aria-label` with the value spelled out.

---

## 7. Implementation Roadmap for Claude Code

Build in this order. **Do not start a phase before the previous one's exit criteria pass.**

### Phase 1 — Setup & engine skeleton
1. `pnpm create vite` (react-ts), add Zustand, Vitest, `@fontsource` packages, `vite-plugin-singlefile`. Create exactly the `package.json` scripts listed in `CLAUDE.md` — do not rename them. Exclude `design` and `docs` in `tsconfig.json`, in the ESLint flat config (`eslint.config.js` — ESLint 9 no longer reads `.eslintignore`) and in `.prettierignore`.
2. `tsconfig` with `strict`, `noUncheckedIndexedAccess`.
3. Create the full folder structure from §2.3 with stub files.
4. Implement `rng.ts` (mulberry32 with serialisable state), `constants.ts` (every number from §3, frozen), `types.ts` (all of §4).
5. Port `data/cooks.ts` (24 archetypes), `data/courses.ts` (30), `data/traits.ts` (12), `data/signals.ts` (9).
6. **Build the i18n mechanism now, not later.** `src/i18n/index.ts` with a typed `t(key, params)`, `cs.ts` as the source dictionary and `en.ts` as a same-shaped stub. Keys typed so a missing key is a compile error:
   ```ts
   export type TKey = keyof typeof cs;
   export const t = (k: TKey, p?: Record<string, string | number>): string => …
   ```
   From this point on **no component may contain a literal UI string**, even during Phases 2–3. Writing screens in hardcoded Czech and extracting them in Phase 4 means retrofitting ~600 strings across every file, and things get missed.
7. Add `tests/i18n.test.ts` — it must fail if any `.tsx` outside `src/i18n/` contains a string literal with Czech diacritics (`ěščřžýáíéúůďťňó`), and if `en.ts` and `cs.ts` do not have identical key sets.

**Exit:** `pnpm test` runs, RNG produces an identical sequence to `sim-final.js` for the same seed, `t()` works and `tests/i18n.test.ts` passes.

### Phase 2 — Engine
1. `bar.ts`, `plate.ts`, `wear.ts`, `economy.ts`, `inspector.ts` (Bayes **with absent-signal terms**), `service.ts`, `season.ts`, `draft.ts`.
2. Write `tests/golden.test.ts` **before** the UI: simulate 500 seasons with the four bot policies from §1.2 and assert star rates within ±3 pp of the table.
3. `tests/bayes.test.ts`: over 100 000 evenings, displayed suspicion must match observed frequency within ±1 pp across buckets.
4. `tests/edge.test.ts`: every case in §9.

**Exit:** all three test files green. **This is the single most important gate in the project — the engine is the game.**

### Phase 3 — Core UI
1. **Copy `design/tokens.css` to `src/styles/tokens.css` verbatim.** It already contains every token, the noise overlay and all keyframes, extracted from the winning mockups. Do not re-derive them from the HTML.
2. Port components: `BarIndicator` first, then `StationDisk`, `CookRow`, `Docket`, `SuspicionDial`, `BrassDivider`, `TabBar`.
3. Screens in this order: Pas → Service → Consequence → MondayPlan (**follow §6.8 literally**) → Menu → CookCard → Calendar.
4. Wire the Zustand store and `persistence.ts` with autosave and migration.

**Exit:** a full 40-evening season is playable without console errors; a reload mid-season restores exactly, including RNG.

### Phase 4 — Inspector, verdict, polish
1. Report cards on Sundays (FR-11) — the plate list against that day's bar.
2. Verdict letter with wax seal and star.
3. Chronicle: text + Canvas PNG (§5.2).
4. `narrator.ts` with salience ranking and repetition budget.
5. **Fill in `en.ts`** (the mechanism and `cs.ts` already exist from Phase 1) and verify Czech grammar throughout: declension of cook names in narrator templates, number formatting per locale (`12,3` vs `12.3`), no string concatenation that assumes English word order. Add the language switch to the UI.
6. `prefers-reduced-motion`, keyboard path, ARIA.
7. Onboarding, venue naming, week-1 locked plan.

**Exit:** §8 satisfied.

---

## 8. Definition of Done

### 8.1 Functional
- [ ] A 40-evening season is completable from onboarding to Lambert verdict without errors.
- [ ] Every evening resolves in 40–60 s of interaction for an experienced player.
- [ ] Reloading at any point restores identical state, including RNG; replaying the same seed with the same inputs yields identical results.
- [ ] Three report cards appear on the Sundays following each visit, listing the exact six plates against that day's bar.
- [ ] The bar is visible on every gameplay screen and its breakdown expands on tap.
- [ ] Push tokens are limited to five, both sides of the offer are shown before confirming.
- [ ] CZ and EN both complete; switching mid-game preserves state; `tests/i18n.test.ts` green (no hardcoded strings anywhere, identical key sets).
- [ ] Chronicle exports as text (clipboard) and PNG (1080 × 1350).
- [ ] Second run has a different brigade and catalogue from the first.

### 8.2 Engine correctness — hard gate

**What "matching `sim-final.js`" means.** The simulation is a *balance reference*, not a bit-for-bit oracle. Three deliberate divergences already exist, all introduced by this PRD and all expected:

| Divergence | Spec | `sim-final.js` |
|---|---|---|
| harmony | neighbour rule, ±2.0 (§3.6) | static per-course value |
| inspector visits | one per third of the season, never evening 40 (§3.8) | uniform over all 40 |
| signals | 4 correlating + 5 decoys at LR 1.0 (§3.8) | 4 correlating only |

Therefore:

- **Bit-exact:** the RNG stream only. Same seed → identical sequence. Non-negotiable.
- **Statistical (±3 pp over 500 seasons):** the star rates below. This is the real gate.

If a divergence pushes a rate outside the band, **report it — do not tune constants to force a fit.** A shifted ladder is a finding about the design, not a bug in the test.

- [ ] **The gate is the SHAPE of the ladder, not fixed numbers.** The old band
      (`NAIVE ★18.0 · ROTA ★36.8 · REVISE ★46.8 · SMART ★60.6`) was measured with *static*
      harmony. §3.6 replaced that with the neighbour rule and §3.3 now prices harmony in the
      bar, so the whole distribution has shifted by design. Re-derive the band from this
      engine and this course data, then assert the shape, over 500 seasons per policy:

      | Criterion | Requirement |
      |---|---|
      | rest pays | `ROTA ★ > NAIVE ★` by ≥ 15 pp |
      | signals pay on ★ | `SMART ★ ≥ max(ROTA, REVISE) ★ + 8 pp` |
      | signals pay on ★★ | `SMART ★★ ≥ 1.7 × max(ROTA, REVISE) ★★` |
      | floor | `NAIVE ★ ≤ 20 %` |
      | ceiling | `SMART ★` between 55 % and 70 % |
      | two-star chase | `SMART ★★` between 20 % and 35 % |
      | career | ★ declines mildly (season 3 below season 1, each step ≤ 10 pp); `Σhand ≤ 23` |

      **`ROTA` vs `REVISE` is deliberately NOT a criterion.** `REVISE` re-rolls 200 random menus
      every Monday and keeps the best by a myopic score — that is a bot heuristic, not a human
      skill, and whether it beats a single well-chosen menu says nothing about whether the game
      rewards skill. Report which is higher as an observation; do not gate on it.

      **Bot hygiene — the reference bot may not be dumber than the screen.** It must use only
      information the real UI shows the player, but it must use *all* of it:
      `push` targets the station with the lowest predicted margin (never a hardcoded station),
      and menu scoring accounts for station overload and crowding, which the Pas screen displays
      as glowing disks. Fixing the instrument this way is legitimate; searching bot weights until
      the ladder comes out right is not.

      Reference measurement with the neighbour rule and bar coefficient 0.5, 1200 seasons
      (`docs/sim-harmony.js`, arbitrary flavour data — indicative shape only, not a target):
      `★ 12.7 → 43.4 → 47.4 → 62.8 · ★★ 1.0 → 8.2 → 11.8 → 25.3 · career 65 / 64 / 60`.
- [ ] Once the shape holds, **freeze the measured numbers into the test as a regression band
      (±3 pp)** and record them in this section, so later changes cannot drift silently.
- [ ] **No `it.todo` in `golden.test.ts`, `bayes.test.ts` or `edge.test.ts`.** A green-but-empty gate is worse than a red one. `pnpm test:golden` must report passing assertions, not skipped ones.
- [ ] `bayes.test.ts`: suspicion calibration within ±1 pp; AUC ≥ 0.87.
- [ ] Career over 3 seasons shows a mild decline, not a runaway (`★ ≈ 57 / 57 / 53`, `★★ ≈ 22 / 30 / 28`, `Σhand 14 → ~22`).
- [ ] No `Math.random()`, no `Date.now()`, no DOM access anywhere under `src/engine/`.

### 8.3 Quality
- [ ] `tsc --noEmit` clean, `strict` on. No `any` in `src/engine/`.
- [ ] Works on iOS Safari and Chrome Android at 390 px, and on desktop Chrome/Firefox/Safari.
- [ ] Lighthouse Performance ≥ 90; no layout shift during docket reveal.
- [ ] Production build under 500 kB gzipped including fonts.
- [ ] No unhandled promise rejections; corrupt `localStorage` never crashes the app.

### 8.4 Playtest gate (human, not automated)
- [ ] Show the Pas screen to 10 people outside the industry for 10 seconds and ask *"What's going to go wrong tonight?"* — **more than half must point at the overloaded station.**
- [ ] Monday planning must feel like a decision, not homework. If testers click "same as last week" twice in a row, escalate — this is the highest-risk mechanic in the game.

---

## 9. Edge Cases — all must be handled and tested

| # | Situation | Required behaviour |
|---|---|---|
| 1 | Fewer cooks than stations | Station stays empty; its courses resolve as defects without computing Q; UI warns in red before service |
| 2 | Empty station capacity = 0 | No division by zero — short-circuit to defect |
| 3 | Station with no course | Cook still accrues helper-rate wear (`+1.0`), no clean evening |
| 4 | Third helper attempted | Refused with an inline message |
| 5 | Cook leaves mid-week | Remaining evenings free up; player gets one free re-plan outside Monday |
| 6 | Tab closed mid-reveal | Result persisted before animation; reload shows the finished result |
| 7 | Visit lands on evening 40 | Prevented at generation — one visit per third, last not on the final evening |
| 8 | `cutCourse` on an inspection evening | Allowed; the cut course counts as a defect. Not an exploit |
| 9 | Menu change with an inspection in the trial evenings | Allowed; that is the risk of revising |
| 10 | Deferred-rest queue overflow | Cap 2; further deferrals refused. Unpaid rest expires at season end |
| 11 | Crowding and overload together | **Both apply** — different things: crowding counts ambitious courses, overload measures volume |
| 12 | Wear hits the 10 cap | Clamp; red warning two evenings ahead |
| 13 | Corrupt/old `localStorage` | Migrate if possible, else archive to `-backup` and start fresh. Never crash, never silently wipe |
| 14 | Clipboard API unavailable | `execCommand` fallback, then a visible message |
| 15 | PNG export fails | Show "take a screenshot" message; never throw |
| 16 | Language switched mid-season | State preserved; already-generated chronicle text keeps its original language |
| 17 | All six rest tickets on one evening | Refused — max 1 per cook per evening, max 2 per cook per week |
| 18 | Reputation at 0 or 100 | Clamp; covers stay within `[12, 40]` |
| 19 | Cash below −150 000 | Season ends immediately with the investor ending, chronicle still generated |
| 20 | Cook reaches hand 5 | Growth stops; clean-evening counter no longer accumulates |

---

## 10. Later Phases (roadmap only — do not build in MVP)

**Layer 2** — special evenings (wedding, visible critic Průcha, supply failure), personal-arc step 2, Sunday staff market with fog-of-war interns, signature dish naming, sound (4 WebAudio samples), clipboard ghost duels on the weekly seed.

**Layer 3** — venues that change the rules (12-seat pop-up with two stations, hotel restaurant at 90 covers, taken-over brigade at low morale), the *Ročník 0–8* difficulty ladder, full 3-season career with alumni rivals, the city scene table.

Nothing in Layer 2 or 3 changes the constants in §3. They are additions on top.

---

## 11. Design Principles — apply when the spec is silent

1. **The engine is pure.** If it needs the clock or the DOM, it belongs in the store, not the engine.
2. **No magic numbers outside `constants.ts`.**
3. **Never lie to the player with numbers.** No hidden mercy adjustments. If the game helps, it says so diegetically.
4. **Silence is information.** A course that went fine gets no comment.
5. **The number is immediate, the story is one tap away.** Never block a player who doesn't want to read.
6. **Input randomness before the decision, output randomness only in the plate roll.**
7. **Twelve concepts, no more.** If a feature needs a thirteenth, it belongs in Layer 2.
