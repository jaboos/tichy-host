/**
 * THE gate. PRD §8.2, CLAUDE.md rule 4.
 *
 * 500 seasons per policy, played over the real engine by the four reference bots
 * transcribed in `harness.ts`, measured against the table PRD §8.2 mandates:
 *
 *   NAIVE ★18.0/★★0.8 · ROTA ★36.8/★★4.4 · REVISE ★46.8/★★10.8 · SMART ★60.6/★★26.4
 *
 * What "matching sim-final.js" means here is set out in PRD §8.2: the RNG stream is
 * bit-exact (proved in `rng.test.ts`), the star rates are statistical, ±3 pp. Three
 * divergences from the reference simulation are deliberate and expected — the
 * neighbour harmony rule, one visit per third, and the five decoy signals.
 *
 * If a rate lands outside the band, that is reported, not tuned away. A shifted
 * ladder is a finding about the design, and the constants stay where the
 * simulation put them (CLAUDE.md rule 3).
 */

import { beforeAll, describe, expect, it } from 'vitest';

import { C } from '../engine/constants';
import {
  POLICIES,
  measureCareer,
  measurePolicy,
  type CareerMeasurement,
  type Policy,
  type PolicyMeasurement,
} from './harness';

/** PRD §8.2. Percentage points. */
const TARGET: Record<Policy, { star: number; twoStar: number }> = {
  NAIVE: { star: 18.0, twoStar: 0.8 },
  ROTA: { star: 36.8, twoStar: 4.4 },
  REVISE: { star: 46.8, twoStar: 10.8 },
  SMART: { star: 60.6, twoStar: 26.4 },
};

const CAREER_TARGET = {
  star: [57, 57, 53],
  twoStar: [22, 30, 28],
  handSum: 22,
};

const BAND_PP = 3;
const SEASONS = 500;
/** `sim-final.js` seeds its season runs from 7000 and its career runs from 9000. */
const SEASON_SEED_BASE = 7000;
const CAREER_SEED_BASE = 9000;

let measured: Record<Policy, PolicyMeasurement>;
let career: CareerMeasurement;

beforeAll(() => {
  measured = {} as Record<Policy, PolicyMeasurement>;
  for (const policy of POLICIES) {
    measured[policy] = measurePolicy(policy, SEASONS, SEASON_SEED_BASE);
  }
  career = measureCareer(SEASONS, CAREER_SEED_BASE);

  const rows = POLICIES.map((policy) => {
    const m = measured[policy];
    const t = TARGET[policy];
    return `  ${policy.padEnd(7)} ★ ${m.starRate.toFixed(1).padStart(5)} (target ${t.star.toFixed(1)}, Δ ${(m.starRate - t.star).toFixed(1).padStart(6)})   ★★ ${m.twoStarRate.toFixed(1).padStart(5)} (target ${t.twoStar.toFixed(1)}, Δ ${(m.twoStarRate - t.twoStar).toFixed(1).padStart(6)})`;
  });
  console.log(`\nmeasured over ${SEASONS} seasons per policy:\n${rows.join('\n')}`);
  console.log(
    `  career ★ ${career.starRate.map((v) => v.toFixed(1)).join(' / ')}` +
      `   ★★ ${career.twoStarRate.map((v) => v.toFixed(1)).join(' / ')}` +
      `   Σhand ${career.handSum.map((v) => v.toFixed(1)).join(' / ')}\n`,
  );
}, 900_000);

describe('the measurement is real', () => {
  it('ran a full 500 seasons for every policy', () => {
    for (const policy of POLICIES) {
      expect(measured[policy].starRate).toBeGreaterThanOrEqual(0);
      expect(measured[policy].starRate).toBeLessThanOrEqual(100);
      // A rate is a multiple of 1/500 of a percent; anything else means the
      // sample size is not what this test claims.
      expect((measured[policy].starRate * SEASONS) % 100).toBe(0);
    }
  });
});

describe('star rate within ±3 pp of PRD §8.2', () => {
  it.each(POLICIES)('%s — ★', (policy) => {
    const { starRate } = measured[policy];
    const target = TARGET[policy].star;
    expect(
      Math.abs(starRate - target),
      `${policy} ★ measured ${starRate.toFixed(1)} %, target ${target.toFixed(1)} %`,
    ).toBeLessThanOrEqual(BAND_PP);
  });

  it.each(POLICIES)('%s — ★★', (policy) => {
    const { twoStarRate } = measured[policy];
    const target = TARGET[policy].twoStar;
    expect(
      Math.abs(twoStarRate - target),
      `${policy} ★★ measured ${twoStarRate.toFixed(1)} %, target ${target.toFixed(1)} %`,
    ).toBeLessThanOrEqual(BAND_PP);
  });
});

describe('the skill ladder is monotone', () => {
  it('★ rises with every step up in policy', () => {
    const rates = POLICIES.map((policy) => measured[policy].starRate);
    const ordered = POLICIES.map((p, i) => `${p} ${rates[i]?.toFixed(1) ?? '?'}`).join(' < ');
    for (let i = 1; i < rates.length; i += 1) {
      expect(rates[i] ?? 0, `expected ${ordered} to be increasing`).toBeGreaterThan(rates[i - 1] ?? 0);
    }
  });

  it('★★ rises with every step up in policy', () => {
    const rates = POLICIES.map((policy) => measured[policy].twoStarRate);
    const ordered = POLICIES.map((p, i) => `${p} ${rates[i]?.toFixed(1) ?? '?'}`).join(' < ');
    for (let i = 1; i < rates.length; i += 1) {
      expect(rates[i] ?? 0, `expected ${ordered} to be increasing`).toBeGreaterThan(rates[i - 1] ?? 0);
    }
  });

  it('reading the signals is worth more than any other single step', () => {
    // v4 §11: the jump from REVISE to SMART is the whole difference between
    // "playing properly" and "playing with information".
    const revise = measured.REVISE.twoStarRate;
    const smart = measured.SMART.twoStarRate;
    expect(smart - revise).toBeGreaterThan(0);
  });
});

describe('a career declines mildly rather than running away', () => {
  it.each([0, 1, 2])('season %i — ★ within ±3 pp', (index) => {
    const measuredRate = career.starRate[index] ?? 0;
    const target = CAREER_TARGET.star[index] ?? 0;
    expect(
      Math.abs(measuredRate - target),
      `career season ${index + 1} ★ measured ${measuredRate.toFixed(1)} %, target ${target} %`,
    ).toBeLessThanOrEqual(BAND_PP);
  });

  it.each([0, 1, 2])('season %i — ★★ within ±3 pp', (index) => {
    const measuredRate = career.twoStarRate[index] ?? 0;
    const target = CAREER_TARGET.twoStar[index] ?? 0;
    expect(
      Math.abs(measuredRate - target),
      `career season ${index + 1} ★★ measured ${measuredRate.toFixed(1)} %, target ${target} %`,
    ).toBeLessThanOrEqual(BAND_PP);
  });

  it('the brigade grows from 16 toward about 22 and saturates', () => {
    const [first, second, third] = career.handSum;
    expect(first ?? 0).toBeGreaterThan(C.draft.handSumTarget);
    expect(third ?? 0).toBeGreaterThanOrEqual(second ?? 0);
    expect(
      Math.abs((third ?? 0) - CAREER_TARGET.handSum),
      `Σhand ended at ${(third ?? 0).toFixed(1)}, expected about ${CAREER_TARGET.handSum}`,
    ).toBeLessThanOrEqual(BAND_PP);
  });
});
