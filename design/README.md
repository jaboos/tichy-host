# design/ — visual reference. Read it, do not build on it.

## What is here

| File | Status |
|---|---|
| `tokens.css` | **Canon.** Single source of truth for the visual language. Copy verbatim to `src/styles/tokens.css`. |
| `*.dc.html` | **Canon for look only.** The seven winning mockups (visual direction V1, "Vytištěný podnik"). |
| `support.js` | **Vendored third-party runtime.** Reference only — see below. |
| `archive/` | **Ignore.** Rejected directions V2 (steel) and V3 (light paper). Do not read, do not implement. |

## How to view the mockups

**Double-clicking a `.dc.html` will not work.** The runtime calls `fetch(location.href)` to re-parse its own source, and browsers block `fetch` on `file://` URLs. Serve the folder over HTTP instead:

```bash
npx serve design          # then open http://localhost:3000/Pas.dc.html
# or
python3 -m http.server 8000 --directory design
```

**An internet connection is required.** `support.js` pulls React 18.3.1, ReactDOM 18.3.1 and Babel Standalone 7.29.0 from `unpkg.com` at runtime (with SRI hashes, so integrity is verified). Babel Standalone is a few megabytes — the first load is slow, then it caches.

## About `support.js`

It is the Claude Design runtime the mockups were exported against (69 kB, generated from `dc-runtime`). It is committed **solely so the `.dc.html` files can be watched in a browser**, which is the fastest way to understand the docket cascade, the drag interactions and the pulse timings.

**Licence: unknown.** The file carries no licence header, no copyright notice and no SPDX identifier. Treat it as all-rights-reserved third-party code: fine to keep in a private repository, but **resolve the licence before this repository is ever made public** — or delete it and re-export the mockups from Claude Design as standalone HTML, which needs no runtime at all.

**Hard rules:**

1. **Nothing under `src/` may import, reference, or bundle `support.js`.** It is not a dependency of the application.
2. **Do not copy its patterns into the app.** `DCLogic`, `renderVals()`, `<x-dc>`, `<sc-for>` and `<sc-if>` are that runtime's conventions. The app uses plain React function components with hooks (§2.1 of `PRD.md`).
3. **Do not maintain, refactor, lint or type it.** Exclude it from `tsconfig`, ESLint and any build input.
4. **Do not treat it as a licensed dependency of this project.** If this repository is ever made public, confirm its licence terms first, or delete it and re-export the mockups from Claude Design as standalone HTML instead.

Add to `.eslintignore` and `.prettierignore`:

```
design/
```

And to `tsconfig.json`:

```json
{ "exclude": ["design", "docs"] }
```

## How to use these files

**Do:** open a mockup in a browser to see motion and interaction · lift exact colour, spacing and radius values · copy keyframes (already extracted into `tokens.css`) · match the typographic hierarchy.

**Don't:** port the markup structure · reuse the state-management approach · assume every screen the game needs is here — six are not, and `PRD.md` §6.7 says which ones you design yourself · treat any mockup as authoritative over `PRD.md` when they disagree (§6.6 lists every known divergence).
