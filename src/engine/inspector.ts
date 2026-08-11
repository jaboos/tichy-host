/**
 * The inspector — PRD §3.8.
 *
 * One guest, six plates, one wave. Three visits a season = 18 plates. Everything
 * the player gets is one number and the maître's words.
 *
 * The posterior is naive Bayes **including the terms for absent signals**. This is
 * not a detail: the audit found that omitting them made the game overstate the
 * probability by 5.5× — it showed 38 % when the truth was 21 %. Lying to the player
 * with numbers is the one thing this game may never do (CLAUDE.md rule 6).
 */

import { C } from './constants';
import { SIGNALS, probabilityWithInspector, probabilityWithoutInspector } from '../data/signals';
import type { Rng } from './rng';
import type { Signal } from './types';

/**
 * The thirds a visit can fall in. PRD §3.8: evening 39 never hosts one, so the
 * three windows are 13, 14 and 12 evenings rather than an even split.
 */
export const VISIT_THIRDS: readonly (readonly [number, number])[] = [
  [0, 12],
  [13, 26],
  [27, 38],
];

/** Which third an evening belongs to, or null for the final evening. */
export function thirdOf(eveningIndex: number): number | null {
  for (let index = 0; index < VISIT_THIRDS.length; index += 1) {
    const bounds = VISIT_THIRDS[index];
    if (bounds !== undefined && eveningIndex >= bounds[0] && eveningIndex <= bounds[1]) {
      return index;
    }
  }
  return null;
}

/**
 * One visit per third, uniform inside it (PRD §9 case 7). `sim-final.js` draws
 * uniformly over all forty — a deliberate divergence, listed in PRD §8.2.
 */
export function drawVisitEvenings(rng: Rng): number[] {
  return VISIT_THIRDS.map(([start, end]) => start + rng.int(end - start + 1));
}

/**
 * The last evening the player has had a report card for. A visit is confirmed on
 * the Sunday closing its week (FR-11), so nothing inside the current week is known
 * yet — which is exactly why the count below only shrinks at week boundaries.
 */
export function lastReportedEvening(eveningIndex: number): number {
  return Math.floor(eveningIndex / C.season.eveningsPerWeek) * C.season.eveningsPerWeek - 1;
}

/**
 * Prior probability that tonight is the visit, using only what the player knows.
 *
 * It is scoped to the CURRENT THIRD, not to the rest of the season. A season-wide
 * prior assumes visits are spread uniformly over the evenings that remain; they
 * are not — there is exactly one per third. Measured: the season-wide version
 * understated the top suspicion decile by 4.24 pp (38.0 % shown against 42.2 %
 * observed), worst at the end of a third. Understating suspicion precisely where
 * it matters is a rule-6 problem, not just a failed test. PRD §3.8.
 */
export function computePrior(eveningIndex: number, visitEvenings: readonly number[]): number {
  const third = thirdOf(eveningIndex);
  if (third === null) return 0;
  const bounds = VISIT_THIRDS[third];
  if (bounds === undefined) return 0;

  const [start, end] = bounds;
  const lastReported = lastReportedEvening(eveningIndex);

  // A report card already named this third's visit — it cannot be tonight.
  if (visitEvenings.some((visit) => visit >= start && visit <= end && visit <= lastReported)) {
    return 0;
  }

  const unknownEvenings = end - Math.max(start - 1, lastReported);
  return unknownEvenings <= 0 ? 0 : 1 / unknownEvenings;
}

/**
 * Draws all nine signals for one evening. The four correlating ones come first,
 * so their rolls sit in the same place in the stream as `sim-final.js`'s four.
 * The five decoys follow; their LR is exactly 1.0, so they move the posterior by
 * a factor of one whether present or absent, and exist only so the player cannot
 * tell from the shape of the sentence which lines carry information.
 */
export function drawSignals(rng: Rng, inspectorPresent: boolean): Signal[] {
  return SIGNALS.map((definition) => ({
    id: definition.id,
    lr: definition.lr,
    present: rng.chance(
      inspectorPresent ? probabilityWithInspector(definition) : probabilityWithoutInspector(),
    ),
  }));
}

/** The combined likelihood ratio, absent signals included. */
export function likelihoodRatio(signals: readonly Signal[]): number {
  let lr = 1;
  for (const signal of signals) {
    const pH = Math.min(C.inspector.maxSignalProbability, C.inspector.baseSignalProbability * signal.lr);
    const pNotH = C.inspector.baseSignalProbability;
    lr *= signal.present ? pH / pNotH : (1 - pH) / (1 - pNotH);
  }
  return lr;
}

/**
 * Posterior probability that tonight is a visit: the prior above, updated by every
 * signal — present and absent alike.
 */
export function computeSuspicion(signals: readonly Signal[], prior: number): number {
  if (prior <= 0) return 0;
  if (prior >= 1) return 1;
  const odds = (prior / Math.max(1 - prior, C.inspector.priorEpsilon)) * likelihoodRatio(signals);
  return odds / (1 + odds);
}
