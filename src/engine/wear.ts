/**
 * Wear, rest and growth — PRD §3.4.
 *
 *   lead    +0.3 + 0.18 × stationLoad     (+2.0 more if the station was pushed)
 *   helper  +1.0                          (also anyone standing idle, §9 case 3)
 *   rest    −5        Monday  −2 to everyone      clamp [0, 10]
 *
 * The 0.18 coefficient is the only link between the menu and the rota, and the
 * second of the three real tuning levers (v4 §11).
 *
 * Growth needs BOTH conditions: no defect anywhere on the cook's station, and the
 * hardest course there at least matching their effective hand — the work has to
 * stretch them. That is what removed the exploit where a timid menu also raised
 * the brigade.
 */

import { C } from './constants';
import { clamp, round1 } from './math';
import { getTrait } from '../data/traits';
import { effectiveHand, type StationSetup } from './plate';
import { STATIONS, type Cook, type Station } from './types';

export interface EveningWearInput {
  cooks: readonly Cook[];
  setups: Readonly<Record<Station, StationSetup>>;
  restingIds: readonly string[];
  pushedStation: Station | null;
  /** Wear from an intervention, by cook id. Praise is negative. */
  extraWear?: ReadonlyMap<string, number>;
  /** Defect count per station tonight. Growth needs zero. */
  defectsByStation: Readonly<Record<Station, number>>;
}

function nextThreshold(current: 14 | 30 | 60): 14 | 30 | 60 {
  const index = C.growth.thresholds.indexOf(current);
  return C.growth.thresholds[Math.min(index + 1, C.growth.thresholds.length - 1)] ?? current;
}

/** A cook at hand 5 stops growing and stops banking clean evenings (§9 case 20). */
function applyGrowth(cook: Cook, station: Station, setup: StationSetup, hadDefect: boolean): Cook {
  if (cook.hand >= C.growth.maxHand) return cook;
  // A station carrying no course cannot stretch anyone (§9 case 3).
  if (setup.courseCount === 0) return cook;
  const stretched = setup.maxDifficulty >= effectiveHand(cook, station);
  if (hadDefect || !stretched) return cook;

  const cleanEvenings = cook.cleanEvenings + 1;
  const multiplier = getTrait(cook.traitId).growthThresholdMultiplier ?? 1;
  if (cleanEvenings < cook.growthThreshold * multiplier) return { ...cook, cleanEvenings };

  return {
    ...cook,
    hand: cook.hand + 1,
    cleanEvenings: 0,
    growthThreshold: nextThreshold(cook.growthThreshold),
  };
}

export function applyEveningWear(input: EveningWearInput): Cook[] {
  const resting = new Set(input.restingIds);

  return input.cooks.map((cook) => {
    const extra = input.extraWear?.get(cook.id) ?? 0;

    if (resting.has(cook.id)) {
      return {
        ...cook,
        wear: round1(clamp(cook.wear + C.wear.rest + extra, C.wear.min, C.wear.max)),
      };
    }

    const station = STATIONS.find((s) => input.setups[s].lead?.id === cook.id) ?? null;

    if (station === null) {
      // Helper or nobody's lead — either way the evening costs the helper rate.
      return {
        ...cook,
        wear: round1(clamp(cook.wear + C.wear.helper + extra, C.wear.min, C.wear.max)),
      };
    }

    const setup = input.setups[station];
    // A lead with nothing to cook still stands there all evening and is worn by
    // the helper rate, not the lead rate — PRD §9 case 3. `sim-final.js` charges
    // the lead rate here; §9 is normative on mechanics, so this follows §9.
    const base =
      setup.courseCount === 0 ? C.wear.helper : C.wear.leadBase + C.wear.leadLoadCoef * setup.load;
    const delta = base + (input.pushedStation === station ? C.wear.push : 0) + extra;

    const worn: Cook = {
      ...cook,
      wear: round1(clamp(cook.wear + delta, C.wear.min, C.wear.max)),
    };
    return applyGrowth(worn, station, setup, input.defectsByStation[station] > 0);
  });
}

/** Monday is not played. Everyone recovers before the new week. */
export function applyMondayRecovery(cooks: readonly Cook[]): Cook[] {
  return cooks.map((cook) => ({
    ...cook,
    wear: round1(clamp(cook.wear + C.wear.monday, C.wear.min, C.wear.max)),
  }));
}

/** The UI shows a red warning two evenings before the cap. PRD FR-1, §9 case 12. */
export function isNearWearCap(cook: Cook): boolean {
  return cook.wear >= C.wear.warningThreshold;
}
