import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `SINGLEFILE=1 pnpm build` emits one distributable HTML (PRD §2.1).
// The default build stays a normal multi-asset build so the 500 kB gzipped
// budget in PRD §8.3 remains measurable.
const singleFile = process.env['SINGLEFILE'] === '1';

export default defineConfig({
  plugins: [react(), ...(singleFile ? [viteSingleFile()] : [])],
  test: {
    include: ['src/tests/**/*.test.ts'],
    // The engine is pure; no test needs a DOM until Phase 3.
    environment: 'node',
  },
});
