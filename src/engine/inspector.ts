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
 * One visit per third of the season, random inside the third, and never on the
 * final evening (PRD §9 case 7). `sim-final.js` draws uniformly over all forty —
 * a deliberate divergence, listed in PRD §8.2.
 */
export function drawVisitEvenings(rng: Rng): number[] {
  const evenings = C.season.eveningsPerSeason;
  const visits = C.inspector.visitsPerSeason;
  const out: number[] = [];

  for (let third = 0; third < visits; third += 1) {
    const start = Math.floor((third * evenings) / visits);
    const end = Math.floor(((third + 1) * evenings) / visits);
    const limit = third === visits - 1 ? end - 1 : end;
    out.push(start + rng.int(limit - start));
  }
  return out;
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
 * Posterior probability that tonight is a visit.
 * Prior = remaining visits / remaining evenings, which is what makes the number
 * climb on its own as the season runs out.
 */
export function computeSuspicion(
  signals: readonly Signal[],
  remainingVisits: number,
  remainingEvenings: number,
): number {
  if (remainingVisits <= 0 || remainingEvenings <= 0) return 0;
  if (remainingVisits >= remainingEvenings) return 1;

  const prior = remainingVisits / remainingEvenings;
  const odds = (prior / Math.max(1 - prior, C.inspector.priorEpsilon)) * likelihoodRatio(signals);
  return odds / (1 + odds);
}
