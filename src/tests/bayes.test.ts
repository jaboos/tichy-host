/**
 * The posterior must not lie. PRD §8.2, §3.8, CLAUDE.md rule 6.
 *
 * The audit that produced v4 found the game overstating a visit by 5.5× because
 * the update only multiplied in the signals that were *present*. Absent signals
 * are evidence too. A later measurement found a second, quieter lie: a
 * season-wide prior understated the top suspicion decile by 4.24 pp, because
 * visits are one per third and a season-wide prior assumes they are spread evenly.
 * Both are regression-tested here, and both are tested against **observed
 * frequency** rather than against a formula, so neither can be satisfied by
 * reproducing the same mistake twice.
 */

import { describe, expect, it } from 'vitest';

import { C } from '../engine/constants';
import { createRng } from '../engine/rng';
import {
  VISIT_THIRDS,
  computePrior,
  computeSuspicion,
  drawSignals,
  drawVisitEvenings,
  lastReportedEvening,
  likelihoodRatio,
  thirdOf,
} from '../engine/inspector';
import { CORRELATING_SIGNALS, SIGNALS } from '../data/signals';
import type { Signal } from '../engine/types';

interface Observation {
  suspicion: number;
  wasVisit: boolean;
  eveningIndex: number;
}

/**
 * Walks whole seasons, because the prior only means anything inside one.
 * 2 500 seasons × 40 evenings = 100 000 evenings, the sample PRD §8.2 names.
 */
function observeEvenings(seasons: number, seed: number): Observation[] {
  const rng = createRng(seed);
  const out: Observation[] = [];

  for (let season = 0; season < seasons; season += 1) {
    const visitEvenings = drawVisitEvenings(rng);
    for (let evening = 0; evening < C.season.eveningsPerSeason; evening += 1) {
      const wasVisit = visitEvenings.includes(evening);
      const signals = drawSignals(rng, wasVisit);
      out.push({
        suspicion: computeSuspicion(signals, computePrior(evening, visitEvenings)),
        wasVisit,
        eveningIndex: evening,
      });
    }
  }
  return out;
}

const OBSERVATIONS = observeEvenings(2_500, 20260811);

describe('the sample is the one PRD §8.2 asks for', () => {
  it('is 100 000 evenings', () => {
    expect(OBSERVATIONS).toHaveLength(100_000);
  });

  it('contains exactly three visits per season', () => {
    expect(OBSERVATIONS.filter((o) => o.wasVisit)).toHaveLength(
      2_500 * C.inspector.visitsPerSeason,
    );
  });
});

describe('calibration', () => {
  /**
   * Equal-count buckets, not equal-width: suspicion is heavily skewed toward the
   * low end, so fixed-width bins would put almost everything in one bucket and
   * measure nothing.
   */
  function buckets(observations: readonly Observation[], count: number) {
    const sorted = [...observations].sort((a, b) => a.suspicion - b.suspicion);
    const size = Math.floor(sorted.length / count);
    return Array.from({ length: count }, (_, i) => {
      const slice = sorted.slice(i * size, i === count - 1 ? sorted.length : (i + 1) * size);
      return {
        predicted: slice.reduce((total, o) => total + o.suspicion, 0) / slice.length,
        observed: slice.filter((o) => o.wasVisit).length / slice.length,
      };
    });
  }

  it('displayed suspicion matches observed frequency within ±1 pp in every decile', () => {
    const rows = buckets(OBSERVATIONS, 10);
    const table = rows
      .map(
        (r, i) =>
          `  decile ${i + 1}: shown ${(100 * r.predicted).toFixed(2)} %, actual ` +
          `${(100 * r.observed).toFixed(2)} %, error ${(100 * (r.predicted - r.observed)).toFixed(2)} pp`,
      )
      .join('\n');
    const worst = Math.max(...rows.map((r) => Math.abs(100 * (r.predicted - r.observed))));
    expect(worst, `calibration by decile\n${table}\n`).toBeLessThanOrEqual(1);
  });

  it('is calibrated in aggregate', () => {
    const predicted =
      OBSERVATIONS.reduce((total, o) => total + o.suspicion, 0) / OBSERVATIONS.length;
    const observed = OBSERVATIONS.filter((o) => o.wasVisit).length / OBSERVATIONS.length;
    expect(Math.abs(100 * (predicted - observed))).toBeLessThanOrEqual(1);
  });

  it('is calibrated at the end of a third, where the season-wide prior used to fail', () => {
    // The last two evenings of each third: the window has shrunk and the visit,
    // if unreported, is close to certain.
    const late = OBSERVATIONS.filter((o) => {
      const third = thirdOf(o.eveningIndex);
      if (third === null) return false;
      const bounds = VISIT_THIRDS[third];
      return bounds !== undefined && o.eveningIndex >= bounds[1] - 1;
    });
    const predicted = late.reduce((total, o) => total + o.suspicion, 0) / late.length;
    const observed = late.filter((o) => o.wasVisit).length / late.length;
    expect(Math.abs(100 * (predicted - observed))).toBeLessThanOrEqual(1);
  });
});

describe('discrimination', () => {
  /** Mann-Whitney: the chance a visit outranks a non-visit, ties counted half. */
  function auc(observations: readonly Observation[]): number {
    const sorted = [...observations].sort((a, b) => a.suspicion - b.suspicion);
    let rank = 1;
    let rankSumVisits = 0;
    let visits = 0;

    for (let i = 0; i < sorted.length; ) {
      let j = i;
      while (j < sorted.length && sorted[j]?.suspicion === sorted[i]?.suspicion) j += 1;
      const averageRank = rank + (j - i - 1) / 2;
      for (let k = i; k < j; k += 1) {
        if (sorted[k]?.wasVisit === true) {
          rankSumVisits += averageRank;
          visits += 1;
        }
      }
      rank += j - i;
      i = j;
    }
    const nonVisits = sorted.length - visits;
    return (rankSumVisits - (visits * (visits + 1)) / 2) / (visits * nonVisits);
  }

  const measured = auc(OBSERVATIONS);

  it('AUC is at least 0.87', () => {
    expect(measured, `AUC measured ${measured.toFixed(4)}`).toBeGreaterThanOrEqual(0.87);
  });

  it('the signal is deliberately imperfect — AUC is not 1', () => {
    expect(measured).toBeLessThan(1);
  });
});

describe('absent signals are evidence', () => {
  /** The bug v4 fixed: multiply only the signals that showed up. */
  function presentOnlyLikelihood(signals: readonly Signal[]): number {
    let lr = 1;
    for (const signal of signals) {
      if (!signal.present) continue;
      lr *=
        Math.min(C.inspector.maxSignalProbability, C.inspector.baseSignalProbability * signal.lr) /
        C.inspector.baseSignalProbability;
    }
    return lr;
  }

  it('omitting them overstates the posterior several-fold', () => {
    const rng = createRng(4242);
    let correct = 0;
    let naive = 0;
    const prior = 1 / VISIT_THIRDS[0]![1];

    for (let i = 0; i < 40_000; i += 1) {
      const signals = drawSignals(rng, false);
      const odds = prior / (1 - prior);
      const right = odds * likelihoodRatio(signals);
      const wrong = odds * presentOnlyLikelihood(signals);
      correct += right / (1 + right);
      naive += wrong / (1 + wrong);
    }
    expect(naive / correct).toBeGreaterThan(2);
  });

  it('an evening with no signals at all lowers suspicion below the prior', () => {
    const silent: Signal[] = SIGNALS.map((s) => ({ id: s.id, lr: s.lr, present: false }));
    const prior = 0.1;
    expect(computeSuspicion(silent, prior)).toBeLessThan(prior);
    expect(likelihoodRatio(silent)).toBeLessThan(1);
  });

  it('every correlating signal present raises it above the prior', () => {
    const loud: Signal[] = SIGNALS.map((s) => ({ id: s.id, lr: s.lr, present: true }));
    const prior = 0.1;
    expect(computeSuspicion(loud, prior)).toBeGreaterThan(prior);
  });
});

describe('decoy signals cannot move the number', () => {
  it('a decoy multiplies the likelihood ratio by exactly one, present or absent', () => {
    for (const definition of SIGNALS) {
      if (definition.correlates) continue;
      for (const present of [true, false]) {
        expect(likelihoodRatio([{ id: definition.id, lr: definition.lr, present }])).toBe(1);
      }
    }
  });

  it('there are four correlating signals and five decoys', () => {
    expect(CORRELATING_SIGNALS).toHaveLength(4);
    expect(SIGNALS.filter((s) => !s.correlates)).toHaveLength(5);
  });
});

describe('the prior is scoped to the current third — PRD §3.8', () => {
  it('covers evenings 0–38 in three windows and leaves the last evening out', () => {
    expect(VISIT_THIRDS).toEqual([
      [0, 12],
      [13, 26],
      [27, 38],
    ]);
    expect(thirdOf(C.season.eveningsPerSeason - 1)).toBeNull();
    expect(computePrior(C.season.eveningsPerSeason - 1, [5, 20, 30])).toBe(0);
  });

  it('only shrinks at week boundaries, because report cards arrive on Sundays', () => {
    expect(lastReportedEvening(0)).toBe(-1);
    expect(lastReportedEvening(4)).toBe(-1);
    expect(lastReportedEvening(5)).toBe(4);
    expect(lastReportedEvening(9)).toBe(4);
    expect(lastReportedEvening(10)).toBe(9);

    // Nothing changes across a week the player has not been told about yet.
    const visits = [12, 20, 30];
    expect(computePrior(5, visits)).toBe(computePrior(9, visits));
  });

  it('is 1 / unknown evenings remaining in the third', () => {
    const visits = [12, 26, 38];
    expect(computePrior(0, visits)).toBeCloseTo(1 / 13, 12); // evenings 0–12 unknown
    expect(computePrior(12, visits)).toBeCloseTo(1 / 3, 12); // 10, 11, 12 unknown
    expect(computePrior(13, visits)).toBeCloseTo(1 / 14, 12); // the whole second third
    expect(computePrior(27, visits)).toBeCloseTo(1 / 12, 12); // the whole third third
    expect(computePrior(38, visits)).toBeCloseTo(1 / 4, 12); // 35–38 unknown
  });

  it('drops to zero once a report card has named this third\'s visit', () => {
    // A visit on evening 2 is confirmed by the Sunday closing week 0.
    expect(computePrior(4, [2, 20, 30])).toBeGreaterThan(0);
    expect(computePrior(5, [2, 20, 30])).toBe(0);
    expect(computePrior(12, [2, 20, 30])).toBe(0);
    // ...and the next third starts fresh.
    expect(computePrior(13, [2, 20, 30])).toBeCloseTo(1 / 14, 12);
  });

  it('rises inside a third as the unreported window closes', () => {
    const visits = [12, 26, 38];
    expect(computePrior(10, visits)).toBeGreaterThan(computePrior(0, visits));
    expect(computePrior(35, visits)).toBeGreaterThan(computePrior(27, visits));
  });
});

describe('the visit draw — PRD §3.8, §9 case 7', () => {
  it('is uniform inside each third', () => {
    const rng = createRng(77);
    const counts = new Map<number, number>();
    const draws = 60_000;
    for (let i = 0; i < draws; i += 1) {
      for (const visit of drawVisitEvenings(rng)) counts.set(visit, (counts.get(visit) ?? 0) + 1);
    }
    for (const [start, end] of VISIT_THIRDS) {
      const width = end - start + 1;
      const expected = draws / width;
      for (let evening = start; evening <= end; evening += 1) {
        expect(Math.abs((counts.get(evening) ?? 0) - expected) / expected).toBeLessThan(0.06);
      }
    }
    expect(counts.get(C.season.eveningsPerSeason - 1)).toBeUndefined();
  });
});
