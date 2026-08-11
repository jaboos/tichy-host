/**
 * THE gate. PRD §8.2, CLAUDE.md rule 4.
 *
 * The gate is the SHAPE of the skill ladder, not fixed numbers. The old band
 * (NAIVE ★18.0 · ROTA ★36.8 · REVISE ★46.8 · SMART ★60.6) was measured with static
 * harmony; §3.6 replaced that with the neighbour rule and §3.3 now prices harmony
 * in the bar, so the whole distribution has moved by design. What has to hold is
 * that skill pays, monotonically, and that the ceiling stays out of reach.
 *
 * 500 seasons per policy, played over the real engine by the reference bots in
 * `harness.ts`. If a criterion fails it is reported, not tuned away: no constant is
 * moved to make a gate pass, and `sim-final.js` stays untouched as the RNG oracle
 * (CLAUDE.md rule 3).
 *
 * The measured numbers are printed on every run. Once the shape holds they get
 * frozen here as a ±3 pp regression band, per §8.2 — that step is deliberately not
 * taken while a shape criterion is still failing, because freezing a distribution
 * whose shape is wrong would cement the wrong thing.
 */

import { beforeAll, describe, expect, it } from 'vitest';

import {
  POLICIES,
  measureCareer,
  measurePolicy,
  type CareerMeasurement,
  type Policy,
  type PolicyMeasurement,
} from './harness';

const SEASONS = 500;
/** `sim-final.js` seeds its season runs from 7000 and its career runs from 9000. */
const SEASON_SEED_BASE = 7000;
const CAREER_SEED_BASE = 9000;

/** PRD §8.2 shape criteria. */
const SHAPE = {
  naiveCeiling: 20,
  smartStarFloor: 55,
  smartStarCeiling: 70,
  smartTwoStarFloor: 20,
  smartTwoStarCeiling: 35,
  signalsMustPayRatio: 1.7,
  careerMaxStepPp: 10,
  careerMaxHandSum: 23,
};

let measured: Record<Policy, PolicyMeasurement>;
let career: CareerMeasurement;
const star = (policy: Policy): number => measured[policy].starRate;
const twoStar = (policy: Policy): number => measured[policy].twoStarRate;

beforeAll(() => {
  measured = {} as Record<Policy, PolicyMeasurement>;
  for (const policy of POLICIES) {
    measured[policy] = measurePolicy(policy, SEASONS, SEASON_SEED_BASE);
  }
  career = measureCareer(SEASONS, CAREER_SEED_BASE);

  const rows = POLICIES.map(
    (p) =>
      `  ${p.padEnd(7)} ★ ${star(p).toFixed(1).padStart(5)} %   ★★ ${twoStar(p).toFixed(1).padStart(5)} %   pověst ${measured[p].reputation.toFixed(0)}`,
  );
  console.log(
    `\nmeasured over ${SEASONS} seasons per policy:\n${rows.join('\n')}\n` +
      `  career ★ ${career.starRate.map((v) => v.toFixed(1)).join(' / ')}` +
      `   ★★ ${career.twoStarRate.map((v) => v.toFixed(1)).join(' / ')}` +
      `   Σhand ${career.handSum.map((v) => v.toFixed(1)).join(' / ')}\n`,
  );
}, 900_000);

describe('the measurement is real', () => {
  it('ran a full 500 seasons for every policy', () => {
    for (const policy of POLICIES) {
      // A rate is a whole multiple of 1/500 of a percent; anything else means the
      // sample size is not what this file claims it is.
      expect((star(policy) * SEASONS) % 100).toBe(0);
      expect(star(policy)).toBeGreaterThanOrEqual(0);
      expect(star(policy)).toBeLessThanOrEqual(100);
    }
  });
});

describe('the skill ladder is monotone — PRD §8.2', () => {
  it('★ rises at every step up in policy', () => {
    const rates = POLICIES.map(star);
    const shown = POLICIES.map((p, i) => `${p} ${rates[i]?.toFixed(1) ?? '?'}`).join(' < ');
    for (let i = 1; i < rates.length; i += 1) {
      expect(rates[i] ?? 0, `expected ${shown} to be increasing`).toBeGreaterThan(rates[i - 1] ?? 0);
    }
  });

  it('★★ rises at every step up in policy', () => {
    const rates = POLICIES.map(twoStar);
    const shown = POLICIES.map((p, i) => `${p} ${rates[i]?.toFixed(1) ?? '?'}`).join(' < ');
    for (let i = 1; i < rates.length; i += 1) {
      expect(rates[i] ?? 0, `expected ${shown} to be increasing`).toBeGreaterThan(rates[i - 1] ?? 0);
    }
  });
});

describe('the ends of the ladder — PRD §8.2', () => {
  it(`the floor: playing badly earns ★ at most ${SHAPE.naiveCeiling} % of the time`, () => {
    expect(star('NAIVE'), `NAIVE ★ ${star('NAIVE').toFixed(1)} %`).toBeLessThanOrEqual(
      SHAPE.naiveCeiling,
    );
  });

  it(`the ceiling: best play earns ★ between ${SHAPE.smartStarFloor} and ${SHAPE.smartStarCeiling} %`, () => {
    expect(star('SMART'), `SMART ★ ${star('SMART').toFixed(1)} %`).toBeGreaterThanOrEqual(
      SHAPE.smartStarFloor,
    );
    expect(star('SMART')).toBeLessThanOrEqual(SHAPE.smartStarCeiling);
  });

  it(`the second star stays a chase: SMART ★★ between ${SHAPE.smartTwoStarFloor} and ${SHAPE.smartTwoStarCeiling} %`, () => {
    expect(twoStar('SMART'), `SMART ★★ ${twoStar('SMART').toFixed(1)} %`).toBeGreaterThanOrEqual(
      SHAPE.smartTwoStarFloor,
    );
    expect(twoStar('SMART')).toBeLessThanOrEqual(SHAPE.smartTwoStarCeiling);
  });

  it('reading the signals pays — it is the whole difference between good and best', () => {
    const ratio = twoStar('SMART') / twoStar('REVISE');
    expect(
      ratio,
      `SMART ★★ ${twoStar('SMART').toFixed(1)} % / REVISE ★★ ${twoStar('REVISE').toFixed(1)} % = ${ratio.toFixed(2)}×`,
    ).toBeGreaterThanOrEqual(SHAPE.signalsMustPayRatio);
  });
});

describe('a career declines mildly rather than running away — PRD §8.2', () => {
  it('season 3 sits below season 1', () => {
    const [first, , third] = career.starRate;
    expect(third ?? 0, `career ★ ${career.starRate.map((v) => v.toFixed(1)).join(' / ')}`).toBeLessThan(
      first ?? 0,
    );
  });

  it(`no single season moves by more than ${SHAPE.careerMaxStepPp} pp`, () => {
    for (let i = 1; i < career.starRate.length; i += 1) {
      const step = Math.abs((career.starRate[i] ?? 0) - (career.starRate[i - 1] ?? 0));
      expect(step, `step ${i} was ${step.toFixed(1)} pp`).toBeLessThanOrEqual(SHAPE.careerMaxStepPp);
    }
  });

  it(`the brigade saturates — Σhand never passes ${SHAPE.careerMaxHandSum}`, () => {
    for (const handSum of career.handSum) {
      expect(handSum, `Σhand ${career.handSum.map((v) => v.toFixed(1)).join(' / ')}`).toBeLessThanOrEqual(
        SHAPE.careerMaxHandSum,
      );
    }
  });

  it('the brigade does grow — it starts above where it was drafted', () => {
    expect(career.handSum[0] ?? 0).toBeGreaterThan(16);
  });
});
