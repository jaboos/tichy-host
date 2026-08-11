# CLAUDE.md

Working rules for this repository. Kept deliberately short — this file is injected into every context.
**What to build lives in `PRD.md`. This file is only how to work.**

## Project

`Tichý host` (The Silent Guest) — a browser text management game about a fine-dining kitchen.
Vite + React 18 + TypeScript (strict) + Zustand. No backend. State in `localStorage`. CZ/EN.

## Commands

```bash
pnpm dev              # dev server
pnpm build            # tsc -b && vite build
pnpm preview          # serve the production build
pnpm test             # vitest run — ALL tests
pnpm test:watch       # vitest
pnpm test:golden      # vitest run src/tests/golden.test.ts — the balance gate
pnpm typecheck        # tsc --noEmit
pnpm lint             # eslint src

node sim-final.js 500   # RNG oracle + historical reference (superseded on harmony)
node docs/sim-harmony.js 1200   # KH sweep behind the bar's harmony term; KH=0.5 node …
npx serve design      # view mockups at localhost:3000 (file:// will NOT work)
```

Phase 1 must create exactly these scripts in `package.json`. Do not rename them.

## Source of truth, in order

1. `PRD.md` — the build spec. Wins over everything else.
2. `TICHY-HOST-v4-FINAL.md` — game design, for anything PRD does not cover.
3. `sim-final.js` — the **RNG oracle**: same seed must give the same stream, bit-exact. It is also the historical balance reference, but it is **superseded on harmony** (PRD §3.6 replaced static harmony with the neighbour rule, and §3.3 prices it in the bar). For balance, the gate is the *shape* of the skill ladder in PRD §8.2, re-derived from this engine — not the old numbers.
4. `design/tokens.css` + `design/*.dc.html` — visual language only. See `design/README.md`.
5. `docs/` — history. Context only, superseded.

`design/archive/` contains rejected visual directions. **Never read or implement them.**

## Hard rules

1. **The engine is pure.** Nothing under `src/engine/` may use `Math.random()`, `Date.now()`, `window`, or any DOM/React API. It is `(state, action, rng) → newState` and nothing else. This is what makes the game seed-reproducible and testable.
2. **No magic numbers.** Every tunable lives in `src/engine/constants.ts` as one frozen object. If a number appears anywhere else, it is a bug.
3. **Never change a constant to make a test pass.** Re-run the ladder over 500 seasons per policy, check it against the shape criteria in PRD §8.2, and update `constants.ts` and the frozen regression band together in one commit. If a rate moves out of band, that is a **finding to report**, not a number to fix.
4. **Golden tests are a gate, not a formality.** `pnpm test:golden` must stay green **and non-empty** — `it.todo` counts as failure, a green-but-empty gate is worse than a red one. Do not start UI work in Phase 3 until Phase 2 tests pass. Only the RNG stream is bit-exact; star rates are statistical (PRD §8.2).
5. **Never touch `design/support.js`.** Vendored third-party runtime, no licence, excluded from tsconfig/eslint/prettier. Nothing in `src/` may import it, and none of its patterns (`DCLogic`, `renderVals()`, `<x-dc>`, `<sc-for>`, `<sc-if>`) may be copied into the app.
6. **Never lie to the player with numbers.** No hidden difficulty adjustment. If the game helps, it says so on screen.
7. **Compute before you animate.** Service results are calculated and persisted first; the reveal is a replay. Closing the tab mid-animation must lose nothing.
8. **Twelve gameplay concepts, no more.** Listed in `TICHY-HOST-v4-FINAL.md` §14. A thirteenth belongs in a later phase.
9. **Bilingual from the first screen.** The game ships CZ **and** EN. Every user-visible string goes through `t()` from day one — never write a literal into a component and plan to extract it later. `tests/i18n.test.ts` enforces this and must stay green.

## Code conventions

- TypeScript `strict`, `noUncheckedIndexedAccess`. **No `any` in `src/engine/`.**
- Identifiers in **English**. UI strings never hardcoded — always `t('key')` from `src/i18n/`.
- React: function components + hooks. No class components. No `useEffect` for derived state.
- Files: components `PascalCase.tsx`, engine modules `camelCase.ts`.
- Prefer pure helpers over hooks when the logic has no React dependency — it makes it testable.
- No comments restating the code. Comment only the *why*, especially for tuned constants.

## Domain glossary — use these exact names

Czech in the UI, English in the code. Do not invent alternatives.

| Czech (UI) | Code | Meaning |
|---|---|---|
| laťka | `bar` | the moving Lambert threshold — the most important number |
| kvalita talíře | `plateQuality` / `q` | per-course, per-wave score |
| vada | `defect` | `q < bar` |
| hvězdný talíř | `starPlate` | `q >= bar + 7.5` |
| ruka | `hand` | 1–5, the only skill number |
| domovský post | `homeStation` | `+1` hand at home, `−1` away |
| post | `station` | `cold` · `fire` · `sauce` · `dessert` |
| vedoucí / pomocník | `lead` / `helper` | per station |
| pas | `pas` (screen) | the assignment screen — keep the Czech name, it is a real kitchen term |
| opotřebení | `wear` | 0–10 |
| odolnost | `endurance` | `lasts` · `normal` · `burns` |
| přetížení | `overload` | `load / capacity − 1` |
| tlačenice | `crowding` | too many difficult courses on one station |
| náročnost | `difficulty` | 1–5 per course |
| souhra | `harmony` | neighbour-based flavour bonus |
| podezření | `suspicion` | Bayesian posterior, 0–1 |
| znak | `signal` | inspector tell, has a likelihood ratio |
| přitlačit | `push` | the intervention; five brass tokens per season |
| vysvědčení | `reportCard` | mid-season inspection result |
| bon | `docket` | one plate on the service screen |
| kryty | `covers` | guests per evening |
| pověst | `reputation` | 0–100 |
| chtění | `desire` | a cook's two-step personal arc |
| brigáda | `brigade` | the six cooks |
| kronika | `chronicle` | shareable season summary |
| kód kuchyně | `seed` | **never write "seed" in the UI** — it is developer vocabulary and not one of the twelve concepts |

## Definition of done for any task

`pnpm typecheck` clean · `pnpm test` green · no new `any` in the engine · no new magic numbers · no console errors in the browser.

If a change affects balance, re-run the ladder and check it against the shape criteria in PRD §8.2. Never tune a constant to make a test pass — a shifted ladder is a finding, report it.
