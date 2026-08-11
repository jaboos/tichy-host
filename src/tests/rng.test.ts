/**
 * The Phase 1 exit criterion: the RNG must produce, for the same seed, a sequence
 * identical to `sim-final.js`.
 *
 * Rather than hardcode expected floats, this reads the reference implementation
 * off disk, extracts its `mul()` factory and runs both streams side by side. If
 * `rng.ts` ever drifts — or if someone edits `sim-final.js`, which they must not —
 * this fails immediately instead of quietly invalidating the golden tests.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { createRng, formatSeed, generateSeed, normalizeSeed, seedToRngState } from '../engine/rng';
import { C } from '../engine/constants';

const REPO_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');

/** Pulls the one-line `function mul(a){…}` out of sim-final.js and evaluates it. */
function referenceGenerator(): (seed: number) => () => number {
  const source = readFileSync(join(REPO_ROOT, 'sim-final.js'), 'utf8');
  const match = /^function mul\(a\)\{.*\}$/m.exec(source);
  if (match === null) throw new Error('sim-final.js: could not find `function mul(a){…}`');
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const factory = new Function(`${match[0]}; return mul;`) as () => unknown;
  const mul = factory();
  if (typeof mul !== 'function') throw new Error('sim-final.js: `mul` is not a function');
  return mul as (seed: number) => () => number;
}

describe('mulberry32 matches sim-final.js', () => {
  const mul = referenceGenerator();

  // 7000 and 9000 are the seed bases sim-final.js itself uses for its
  // season and career runs; 0 and a negative seed cover the int32 edges.
  it.each([0, 1, 7000, 7499, 9000, 123456789, -1, -2147483648])(
    'produces an identical stream for seed %i',
    (seed) => {
      const reference = mul(seed);
      const rng = createRng(seed);
      for (let i = 0; i < 10_000; i += 1) {
        expect(rng.next()).toBe(reference());
      }
    },
  );

  it('produces the plate noise identically to `rnd() * 2 - 1`', () => {
    const reference = mul(4242);
    const rng = createRng(4242);
    for (let i = 0; i < 1_000; i += 1) {
      expect(rng.uniform(C.plate.noiseMin, C.plate.noiseMax)).toBe(reference() * 2 - 1);
    }
  });

  it('picks indices identically to `Math.floor(rnd() * n)`', () => {
    const reference = mul(31337);
    const rng = createRng(31337);
    for (let i = 0; i < 1_000; i += 1) {
      expect(rng.int(40)).toBe(Math.floor(reference() * 40));
    }
  });
});

describe('serialisable state', () => {
  it('resumes exactly where it left off', () => {
    const original = createRng(seedToRngState('7K3-MAREN'));
    for (let i = 0; i < 137; i += 1) original.next();

    // This is what an autosave stores and a reload restores. PRD FR-14.
    const resumed = createRng(original.state());
    const expected = Array.from({ length: 50 }, () => original.next());
    const actual = Array.from({ length: 50 }, () => resumed.next());
    expect(actual).toEqual(expected);
  });

  it('clone() does not advance the original', () => {
    const rng = createRng(99);
    const clone = rng.clone();
    expect(clone.next()).toBe(rng.next());
  });

  it('the same seed string always opens the same season', () => {
    expect(seedToRngState('7K3-MAREN')).toBe(seedToRngState('7k3maren'));
    expect(seedToRngState('7K3-MAREN')).not.toBe(seedToRngState('7K3-MARFN'));
  });
});

describe('seed format — FR-15', () => {
  it('is 3 + 5 characters from an unambiguous alphabet', () => {
    expect(C.seed.alphabet).toHaveLength(32);
    for (const ambiguous of ['O', '0', 'I', '1']) {
      expect(C.seed.alphabet).not.toContain(ambiguous);
    }
  });

  it('generates well-formed seeds', () => {
    const rng = createRng(2024);
    for (let i = 0; i < 200; i += 1) {
      const seed = generateSeed(rng);
      expect(seed).toMatch(/^[23456789A-HJ-NP-Z]{3}-[23456789A-HJ-NP-Z]{5}$/);
      expect(normalizeSeed(seed)).toHaveLength(8);
    }
  });

  it('normalises loosely typed input and rejects invalid seeds', () => {
    expect(formatSeed(' 7k3maren ')).toBe('7K3-MAREN');
    expect(normalizeSeed('7K3-MARE')).toBeNull(); // too short
    expect(normalizeSeed('7K3-MAREN0')).toBeNull(); // too long
    expect(normalizeSeed('7K3-MARE0')).toBeNull(); // excluded glyph
  });
});
