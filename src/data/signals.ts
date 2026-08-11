/**
 * The nine inspector signals. PRD §2.3, §3.8.
 *
 * Four of them correlate with a visit and carry the likelihood ratios measured in
 * v4 §8. The other five have LR exactly 1.0 and are decoys: they give the maître
 * something to say on a quiet evening without moving the posterior. That is not a
 * decoration argument — it is arithmetic. In
 *
 *     lr *= present ? pH / pNotH : (1 - pH) / (1 - pNotH)
 *
 * a signal with LR 1.0 has `pH === pNotH === C.inspector.baseSignalProbability`,
 * so both branches multiply by exactly 1. A decoy provably cannot lie to the player.
 *
 * PHASE 2 WARNING — RNG ordering. `sim-final.js` draws exactly four signal rolls
 * per evening (its line 76). If the engine draws for the decoys as well, it must
 * do so *after* all four correlating signals, or the stream desynchronises from
 * the reference simulation and `golden.test.ts` stops meaning anything.
 */
import { C } from '../engine/constants';
import type { SignalDefinition } from '../engine/types';

/** LR 1.0: the signal is exactly as likely with an inspector in the room as without. */
const NEUTRAL_LR = 1.0;

export const SIGNALS: readonly SignalDefinition[] = [
  // --- correlating, PRD §3.8 -------------------------------------------------
  { id: 'aloneByWindow', textKey: 'signal.aloneByWindow', lr: 2.4, correlates: true },
  { id: 'tapWater', textKey: 'signal.tapWater', lr: 3.1, correlates: true },
  { id: 'declinedPairing', textKey: 'signal.declinedPairing', lr: 1.9, correlates: true },
  { id: 'notebook', textKey: 'signal.notebook', lr: 2.8, correlates: true },

  // --- decoys ---------------------------------------------------------------
  {
    id: 'photographedPlates',
    textKey: 'signal.photographedPlates',
    lr: NEUTRAL_LR,
    correlates: false,
  },
  { id: 'askedForChef', textKey: 'signal.askedForChef', lr: NEUTRAL_LR, correlates: false },
  { id: 'largeParty', textKey: 'signal.largeParty', lr: NEUTRAL_LR, correlates: false },
  { id: 'expensiveWine', textKey: 'signal.expensiveWine', lr: NEUTRAL_LR, correlates: false },
  { id: 'earlyDeparture', textKey: 'signal.earlyDeparture', lr: NEUTRAL_LR, correlates: false },
];

/** The four that carry information. Exactly `C.inspector.signalsPerEvening` of them. */
export const CORRELATING_SIGNALS: readonly SignalDefinition[] = SIGNALS.filter(
  (signal) => signal.correlates,
);

/** p(signal present | no inspector). The same base rate for every signal. */
export function probabilityWithoutInspector(): number {
  return C.inspector.baseSignalProbability;
}

/** p(signal present | inspector) = min(0.85, 0.18 × LR). PRD §3.8 */
export function probabilityWithInspector(signal: SignalDefinition): number {
  return Math.min(C.inspector.maxSignalProbability, C.inspector.baseSignalProbability * signal.lr);
}
