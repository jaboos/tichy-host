/**
 * The posterior must not lie. PRD §8.2, §3.8, CLAUDE.md rule 6.
 *
 * The audit that produced v4 found the game overstating the probability of a visit
 * by 5.5× — it showed 38 % where the truth was 21 % — because the naive Bayes
 * update only multiplied in the signals that were *present*. Absent signals are
 * evidence too. This file is the regression test for that fix, and it is written
 * against observed frequency rather than against a formula, so it cannot be
 * satisfied by reproducing the same mistake twice.
 */

import { describe, expect, it } from 'vitest';

import { C } from '../engine/constants';
import { createRng } from '../engine/rng';
import { computeSuspicion, drawSignals, drawVisitEvenings, likelihoodRatio } from '../engine/inspector';
import { CORRELATING_SIGNALS, SIGNALS } from '../data/signals';
import type { Signal } from '../engine/types';

interface Observation {
  suspicion: number;
  wasVisit: boolean;
}

/**
 * Walks whole seasons, because the prior (remaining visits / remaining evenings)
 * only means anything inside one. 2 500 seasons × 40 evenings = 100 000 evenings,
 * the sample size PRD §8.2 names.
 */
function observeEvenings(seasons: number, seed: number): Observation[] {
  const rng = createRng(seed);
  const out: Observation[] = [];

  for (let season = 0; season < seasons; season += 1) {
    const visitEvenings = drawVisitEvenings(rng);
    let visitsSoFar = 0;

    for (let evening = 0; evening < C.season.eveningsPerSeason; evening += 1) {
      const wasVisit = visitEvenings.includes(evening);
      const signals = drawSignals(rng, wasVisit);
      const suspicion = computeSuspicion(
        signals,
        C.inspector.visitsPerSeason - visitsSoFar,
        C.season.eveningsPerSeason - evening,
      );
      out.push({ suspicion, wasVisit });
      if (wasVisit) visitsSoFar += 1;
    }
  }
  return out;
}

const OBSERVATIONS = observeEvenings(2_500, 20260811);

describe('the sample is the one PRD §8.2 asks for', () => {
  it('is 100 000 evenings', () => {
    expect(OBSERVATIONS).toHaveLength(100_000);
  });

  it('contains the expected number of visits', () => {
    const visits = OBSERVATIONS.filter((o) => o.wasVisit).length;
    expect(visits).toBe(2_500 * C.inspector.visitsPerSeason);
  });
});

describe('calibration', () => {
  /**
   * Buckets are equal-count rather than equal-width: suspicion is heavily skewed
   * toward the low end, so fixed-width buckets would put 90 % of evenings in one
   * bin and measure nothing.
   */
  function buckets(observations: readonly Observation[], count: number) {
    const sorted = [...observations].sort((a, b) => a.suspicion - b.suspicion);
    const size = Math.floor(sorted.length / count);
    return Array.from({ length: count }, (_, i) => {
      const slice = sorted.slice(i * size, i === count - 1 ? sorted.length : (i + 1) * size);
      const predicted = slice.reduce((total, o) => total + o.suspicion, 0) / slice.length;
      const observed = slice.filter((o) => o.wasVisit).length / slice.length;
      return { predicted, observed, n: slice.length };
    });
  }

  it('displayed suspicion matches observed frequency within ±1 pp in every bucket', () => {
    const rows = buckets(OBSERVATIONS, 10);
    const errors = rows.map((row) => ({
      predicted: `${(100 * row.predicted).toFixed(2)} %`,
      observed: `${(100 * row.observed).toFixed(2)} %`,
      errorPp: Number((100 * (row.predicted - row.observed)).toFixed(2)),
    }));
    const worst = Math.max(...errors.map((e) => Math.abs(e.errorPp)));
    const table = errors
      .map((e, i) => `  bucket ${i + 1}: shown ${e.predicted},真 ${e.observed}, error ${e.errorPp} pp`)
      .join('\n')
      .replace(/真/g, 'actual');
    expect(worst, `calibration by decile\n${table}\n`).toBeLessThanOrEqual(1);
  });

  it('is calibrated in aggregate', () => {
    const predicted = OBSERVATIONS.reduce((total, o) => total + o.suspicion, 0) / OBSERVATIONS.length;
    const observed = OBSERVATIONS.filter((o) => o.wasVisit).length / OBSERVATIONS.length;
    expect(Math.abs(100 * (predicted - observed))).toBeLessThanOrEqual(1);
  });
});

describe('discrimination', () => {
  /** Mann-Whitney: the probability a visit outranks a non-visit, ties counted half. */
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

  it('AUC is at least 0.87', () => {
    expect(auc(OBSERVATIONS)).toBeGreaterThanOrEqual(0.87);
  });

  it('the signal is deliberately imperfect — AUC is not 1', () => {
    expect(auc(OBSERVATIONS)).toBeLessThan(1);
  });
});

describe('absent signals are evidence', () => {
  /** The bug v4 fixed: multiply only the signals that showed up. */
  function presentOnlyLikelihood(signals: readonly Signal[]): number {
    let lr = 1;
    for (const signal of signals) {
      if (!signal.present) continue;
      const pH = Math.min(
        C.inspector.maxSignalProbability,
        C.inspector.baseSignalProbability * signal.lr,
      );
      lr *= pH / C.inspector.baseSignalProbability;
    }
    return lr;
  }

  it('omitting them overstates the posterior several-fold', () => {
    const rng = createRng(4242);
    let correctTotal = 0;
    let naiveTotal = 0;
    const evenings = 40_000;

    for (let i = 0; i < evenings; i += 1) {
      const signals = drawSignals(rng, false);
      const prior = C.inspector.visitsPerSeason / C.season.eveningsPerSeason;
      const odds = prior / (1 - prior);
      correctTotal += (odds * likelihoodRatio(signals)) / (1 + odds * likelihoodRatio(signals));
      const naiveOdds = odds * presentOnlyLikelihood(signals);
      naiveTotal += naiveOdds / (1 + naiveOdds);
    }

    // On evenings with no inspector the correct posterior must sit well below the
    // naive one; the audit measured the gap at roughly 5.5×.
    expect(naiveTotal / correctTotal).toBeGreaterThan(2);
  });

  it('an evening with no signals at all lowers suspicion below the prior', () => {
    const silent: Signal[] = SIGNALS.map((s) => ({ id: s.id, lr: s.lr, present: false }));
    const prior = C.inspector.visitsPerSeason / C.season.eveningsPerSeason;
    expect(computeSuspicion(silent, C.inspector.visitsPerSeason, C.season.eveningsPerSeason))
      .toBeLessThan(prior);
    expect(likelihoodRatio(silent)).toBeLessThan(1);
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

describe('the prior', () => {
  it('climbs as the season runs out', () => {
    const silent: Signal[] = SIGNALS.map((s) => ({ id: s.id, lr: s.lr, present: false }));
    const early = computeSuspicion(silent, 3, 40);
    const late = computeSuspicion(silent, 1, 4);
    expect(late).toBeGreaterThan(early);
  });

  it('is zero once every visit has happened', () => {
    const loud: Signal[] = SIGNALS.map((s) => ({ id: s.id, lr: s.lr, present: true }));
    expect(computeSuspicion(loud, 0, 10)).toBe(0);
  });

  it('is certainty when there are as many visits left as evenings', () => {
    const silent: Signal[] = SIGNALS.map((s) => ({ id: s.id, lr: s.lr, present: false }));
    expect(computeSuspicion(silent, 2, 2)).toBe(1);
  });
});
