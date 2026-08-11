/**
 * Seeded, serialisable randomness. PRD §2.2, FR-14, FR-15.
 *
 * The generator is mulberry32, transcribed bit-for-bit from `sim-final.js` line 3.
 * `tests/rng.test.ts` extracts that line from disk and asserts the two streams are
 * identical — if this file ever drifts from the reference simulation, that test fails.
 *
 * Purity (CLAUDE.md rule 1): no clock, no `Math.random`, no DOM. The whole generator
 * state is one int32, so an in-flight season round-trips through `localStorage`.
 */

import { C } from './constants';

/** The entire generator state. Serialised into `GameState.rngState`. */
export type RngState = number;

export interface Rng {
  /** Uniform in [0, 1). Advances the stream. */
  next(): number;
  /** Uniform in [min, max). */
  uniform(min: number, max: number): number;
  /** Uniform integer in [0, maxExclusive). */
  int(maxExclusive: number): number;
  /** True with probability p. `p <= 0` never, `p >= 1` always. */
  chance(p: number): boolean;
  /** Uniform element. Throws on an empty array rather than returning undefined. */
  pick<T>(items: readonly T[]): T;
  /** Current state, for persistence. */
  state(): RngState;
  /** Independent generator continuing from the same point. Does not advance this one. */
  clone(): Rng;
}

export function createRng(state: RngState): Rng {
  let a = state | 0;

  const next = (): number => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    // Written as `min + next() * (max - min)`; for the plate noise (-1, 1) this is
    // bit-identical to sim-final.js's `rnd() * 2 - 1`.
    uniform: (min, max) => min + next() * (max - min),
    int: (maxExclusive) => Math.floor(next() * maxExclusive),
    chance: (p) => next() < p,
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) throw new Error('rng.pick: empty array');
      const item = items[Math.floor(next() * items.length)];
      if (item === undefined) throw new Error('rng.pick: index out of range');
      return item;
    },
    state: () => a,
    clone: () => createRng(a),
  };

  return rng;
}

// ---------------------------------------------------------------------------
// Seed strings — FR-15. Format `7K3-MAREN`: 3 chars, dash, 5 chars.
// ---------------------------------------------------------------------------

/** Ambiguous glyphs O/0/I/1 are excluded, so a seed survives being read aloud. */
export const SEED_ALPHABET = C.seed.alphabet;

/** `7K3-MAREN` → `7K3MAREN`, uppercased, or null if it is not a valid seed. */
export function normalizeSeed(input: string): string | null {
  const raw = input.trim().toUpperCase().replace(/-/g, '');
  if (raw.length !== C.seed.headLength + C.seed.tailLength) return null;
  for (const ch of raw) {
    if (!SEED_ALPHABET.includes(ch)) return null;
  }
  return raw;
}

/** `7K3MAREN` → `7K3-MAREN`. Returns null if the seed is not valid. */
export function formatSeed(input: string): string | null {
  const raw = normalizeSeed(input);
  if (raw === null) return null;
  return `${raw.slice(0, C.seed.headLength)}-${raw.slice(C.seed.headLength)}`;
}

/**
 * FNV-1a over the normalised seed. Deterministic across platforms — the same
 * seed string always opens the same season.
 */
export function seedToRngState(seed: string): RngState {
  const raw = normalizeSeed(seed) ?? seed.trim().toUpperCase();
  let h = C.seed.fnvOffsetBasis | 0;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, C.seed.fnvPrime);
  }
  return h | 0;
}

/** Draws a fresh `7K3-MAREN`. The caller owns the entropy — the engine stays pure. */
export function generateSeed(rng: Rng): string {
  const alphabet = [...SEED_ALPHABET];
  const length = C.seed.headLength + C.seed.tailLength;
  let out = '';
  for (let i = 0; i < length; i += 1) out += rng.pick(alphabet);
  return `${out.slice(0, C.seed.headLength)}-${out.slice(C.seed.headLength)}`;
}

/**
 * The weekly seed (FR-15). Pure: the caller resolves "which ISO week is it" from
 * the clock and passes the numbers in, because the engine may not read the clock.
 */
export function weeklySeed(isoYear: number, isoWeek: number): string {
  return generateSeed(createRng(seedToRngState(`${isoYear}W${isoWeek}`)));
}
