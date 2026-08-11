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
  restPaysPp: 15,
  signalsPayStarPp: 8,
  signalsPayTwoStarRatio: 1.7,
  naiveCeiling: 20,
  smartStarFloor: 55,
  smartStarCeiling: 70,
  smartTwoStarFloor: 20,
  smartTwoStarCeiling: 35,
  careerMaxStepPp: 10,
  careerMaxHandSum: 23,
};

let measured: Record<Policy, PolicyMeasurement>;
let career: CareerMeasurement;
/** Observation only — never a criterion. See the block at the bottom of this file. */
let reviseSmart: PolicyMeasurement;
const star = (policy: Policy): number => measured[policy].starRate;
const twoStar = (policy: Policy): number => measured[policy].twoStarRate;

beforeAll(() => {
  measured = {} as Record<Policy, PolicyMeasurement>;
  for (const policy of POLICIES) {
    measured[policy] = measurePolicy(policy, SEASONS, SEASON_SEED_BASE);
  }
  career = measureCareer(SEASONS, CAREER_SEED_BASE);
  reviseSmart = measurePolicy('REVISE_SMART', SEASONS, SEASON_SEED_BASE);

  const rows = POLICIES.map(
    (p) =>
      `  ${p.padEnd(7)} ★ ${star(p).toFixed(1).padStart(5)} %   ★★ ${twoStar(p).toFixed(1).padStart(5)} %   pověst ${measured[p].reputation.toFixed(0)}`,
  );
  console.log(
    `\nmeasured over ${SEASONS} seasons per policy:\n${rows.join('\n')}\n` +
      `  career ★ ${career.starRate.map((v) => v.toFixed(1)).join(' / ')}` +
      `   ★★ ${career.twoStarRate.map((v) => v.toFixed(1)).join(' / ')}` +
      `   Σhand ${career.handSum.map((v) => v.toFixed(1)).join(' / ')}\n` +
      `  observation — REVISE_SMART ★ ${reviseSmart.starRate.toFixed(1)} %  ★★ ${reviseSmart.twoStarRate.toFixed(1)} %\n`,
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

/**
 * Observation, never a criterion — PRD §3.6 asks whether a menu revision is worth
 * two trial evenings. REVISE_SMART revises only when the predicted margin actually
 * improves, using the same information the Menu screen already shows the player
 * (the bar, the ambition term, the four station-load discs).
 */
describe('is a menu revision worth it when made with judgement?', () => {
  it('records REVISE_SMART against blind weekly revision', () => {
    console.log(
      `  observation — REVISE_SMART ★ ${reviseSmart.starRate.toFixed(1)} % / ★★ ${reviseSmart.twoStarRate.toFixed(1)} % ` +
        `vs blind REVISE ★ ${star('REVISE').toFixed(1)} % / ★★ ${twoStar('REVISE').toFixed(1)} % ` +
        `and SMART ★ ${star('SMART').toFixed(1)} % / ★★ ${twoStar('SMART').toFixed(1)} %`,
    );
    expect(reviseSmart.starRate).toBeGreaterThanOrEqual(0);
    expect(reviseSmart.starRate).toBeLessThanOrEqual(100);
  });
});
