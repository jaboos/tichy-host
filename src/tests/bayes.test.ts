/**
 * PRD §8.2: over 100 000 evenings the displayed suspicion must match observed
 * frequency within ±1 pp across buckets, and the signal AUC must be >= 0.87.
 * Phase 2.
 */
import { describe, it } from 'vitest';

describe('bayes — the posterior does not lie', () => {
  it.todo('calibration within +/-1 pp across suspicion buckets over 100 000 evenings');
  it.todo('AUC of the signal set is at least 0.87');
  it.todo('absent signals contribute — omitting them overstates the posterior 5.5x');
});
