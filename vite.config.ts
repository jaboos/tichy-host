import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `SINGLEFILE=1 pnpm build` emits one distributable HTML (PRD §2.1).
// The default build stays a normal multi-asset build so the 500 kB gzipped
// budget in PRD §8.3 remains measurable.
const singleFile = process.env['SINGLEFILE'] === '1';

export default defineConfig({
  plugins: [react(), ...(singleFile ? [viteSingleFile()] : [])],
  // Two pages: the landing at `/` and the game at `/hra/`. The landing is plain
  // HTML that links `src/styles/tokens.css` directly, so the two share one set of
  // tokens rather than growing a second palette that drifts. The single-file build
  // keeps only the game — a distributable HTML has nothing to land on.
  build: {
    rollupOptions: {
      // The distributable is the GAME, not the landing page — the root entry is
      // now a page to read, and a one-file HTML of it would be a leaflet with
      // nothing to click. Caught by grepping the output rather than trusting it.
      input: singleFile
        ? { hra: resolve(__dirname, 'hra/index.html') }
        : {
            landing: resolve(__dirname, 'index.html'),
            hra: resolve(__dirname, 'hra/index.html'),
          },
    },
  },
  test: {
    include: ['src/tests/**/*.test.ts'],
    // The engine is pure; no test needs a DOM until Phase 3.
    environment: 'node',
  },
});
