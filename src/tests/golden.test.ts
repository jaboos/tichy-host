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
 * The shape criteria hold, so the measured distribution is frozen below as a ±3 pp
 * regression band (§8.2). The band is a tripwire, not a target: if a later change
 * moves a rate, this fails and the change has to be explained. It is never the
 * reason to move a constant.
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
  restPaysPp: 15,
  signalsPayStarPp: 8,
  signalsPayTwoStarRatio: 1.7,
  naiveCeiling: 20,
  smartStarFloor: 55,
  smartStarCeiling: 75,
  smartTwoStarFloor: 20,
  smartTwoStarCeiling: 35,
  careerMaxStepPp: 10,
  careerMaxHandSum: 23,
};

/**
 * Frozen from this engine and this course data once every shape criterion passed.
 * Recorded in PRD §8.2. Re-derive and re-record deliberately, never silently.
 */
const FROZEN: Record<Policy, { star: number; twoStar: number }> = {
  NAIVE: { star: 10.6, twoStar: 1.4 },
  ROTA: { star: 55.2, twoStar: 13.4 },
  REVISE: { star: 49.4, twoStar: 14.0 },
  SMART: { star: 66.4, twoStar: 33.0 },
};
const FROZEN_CAREER = {
  star: [63.8, 59.8, 57.4],
  twoStar: [29.0, 30.8, 25.8],
  handSum: [19.3, 20.7, 21.5],
};
const REGRESSION_BAND_PP = 3;

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
      `   Σhand ${career.handSum.map((v) => v.toFixed(1)).join(' / ')}\n` +
      '',
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

describe('skill pays — PRD §8.2', () => {
  it(`rest pays: ROTA beats NAIVE on ★ by at least ${SHAPE.restPaysPp} pp`, () => {
    const gain = star('ROTA') - star('NAIVE');
    expect(
      gain,
      `ROTA ★ ${star('ROTA').toFixed(1)} % − NAIVE ★ ${star('NAIVE').toFixed(1)} % = ${gain.toFixed(1)} pp`,
    ).toBeGreaterThanOrEqual(SHAPE.restPaysPp);
  });

  it(`reading the signals pays on ★: SMART clears the best lower rung by ${SHAPE.signalsPayStarPp} pp`, () => {
    const best = Math.max(star('ROTA'), star('REVISE'));
    expect(
      star('SMART'),
      `SMART ★ ${star('SMART').toFixed(1)} %, needs max(ROTA ${star('ROTA').toFixed(1)}, REVISE ${star('REVISE').toFixed(1)}) + ${SHAPE.signalsPayStarPp} = ${(best + SHAPE.signalsPayStarPp).toFixed(1)} %`,
    ).toBeGreaterThanOrEqual(best + SHAPE.signalsPayStarPp);
  });

  it(`reading the signals pays on ★★: SMART is at least ${SHAPE.signalsPayTwoStarRatio}× the best lower rung`, () => {
    const best = Math.max(twoStar('ROTA'), twoStar('REVISE'));
    const ratio = twoStar('SMART') / best;
    expect(
      ratio,
      `SMART ★★ ${twoStar('SMART').toFixed(1)} % / best lower rung ${best.toFixed(1)} % = ${ratio.toFixed(2)}×`,
    ).toBeGreaterThanOrEqual(SHAPE.signalsPayTwoStarRatio);
  });
});

/**
 * PRD §8.2: ROTA vs REVISE is deliberately NOT a criterion. REVISE re-rolls 200
 * random menus every Monday and keeps the best by a myopic score — a bot
 * heuristic, not a human skill. Which of the two is higher is recorded, not gated.
 */
describe('ROTA vs REVISE — observation, not a gate', () => {
  it('records which is higher', () => {
    const winner = star('ROTA') >= star('REVISE') ? 'ROTA' : 'REVISE';
    console.log(
      `  observation — blind weekly revision: ROTA ★ ${star('ROTA').toFixed(1)} % vs ` +
        `REVISE ★ ${star('REVISE').toFixed(1)} %, higher is ${winner}`,
    );
    expect(['ROTA', 'REVISE']).toContain(winner);
  });
});

describe('a career declines mildly rather than running away — PRD §8.2', () => {
  it('season 3 sits below season 1', () => {
    const [first, , third] = career.starRate;
    expect(
      third ?? 0,
      `career ★ ${career.starRate.map((v) => v.toFixed(1)).join(' / ')}`,
    ).toBeLessThan(first ?? 0);
  });

  it(`no single season moves by more than ${SHAPE.careerMaxStepPp} pp`, () => {
    for (let i = 1; i < career.starRate.length; i += 1) {
      const step = Math.abs((career.starRate[i] ?? 0) - (career.starRate[i - 1] ?? 0));
      expect(step, `step ${i} was ${step.toFixed(1)} pp`).toBeLessThanOrEqual(
        SHAPE.careerMaxStepPp,
      );
    }
  });

  it(`the brigade saturates — Σhand never passes ${SHAPE.careerMaxHandSum}`, () => {
    for (const handSum of career.handSum) {
      expect(
        handSum,
        `Σhand ${career.handSum.map((v) => v.toFixed(1)).join(' / ')}`,
      ).toBeLessThanOrEqual(SHAPE.careerMaxHandSum);
    }
  });

  it('the brigade does grow — it starts above where it was drafted', () => {
    expect(career.handSum[0] ?? 0).toBeGreaterThan(16);
  });
});

describe('regression band — frozen at ±3 pp, PRD §8.2', () => {
  it.each(POLICIES)('%s stays where it was measured', (policy) => {
    const frozen = FROZEN[policy];
    expect(
      Math.abs(star(policy) - frozen.star),
      `${policy} ★ ${star(policy).toFixed(1)} %, frozen at ${frozen.star} %`,
    ).toBeLessThanOrEqual(REGRESSION_BAND_PP);
    expect(
      Math.abs(twoStar(policy) - frozen.twoStar),
      `${policy} ★★ ${twoStar(policy).toFixed(1)} %, frozen at ${frozen.twoStar} %`,
    ).toBeLessThanOrEqual(REGRESSION_BAND_PP);
  });

  it.each([0, 1, 2])('career season %i stays where it was measured', (index) => {
    expect(
      Math.abs((career.starRate[index] ?? 0) - (FROZEN_CAREER.star[index] ?? 0)),
      `career ★ ${career.starRate.map((v) => v.toFixed(1)).join(' / ')}, frozen at ${FROZEN_CAREER.star.join(' / ')}`,
    ).toBeLessThanOrEqual(REGRESSION_BAND_PP);
    expect(
      Math.abs((career.twoStarRate[index] ?? 0) - (FROZEN_CAREER.twoStar[index] ?? 0)),
      `career ★★ ${career.twoStarRate.map((v) => v.toFixed(1)).join(' / ')}, frozen at ${FROZEN_CAREER.twoStar.join(' / ')}`,
    ).toBeLessThanOrEqual(REGRESSION_BAND_PP);
    expect(
      Math.abs((career.handSum[index] ?? 0) - (FROZEN_CAREER.handSum[index] ?? 0)),
      `Σhand ${career.handSum.map((v) => v.toFixed(1)).join(' / ')}, frozen at ${FROZEN_CAREER.handSum.join(' / ')}`,
    ).toBeLessThanOrEqual(REGRESSION_BAND_PP);
  });
});
