/**
 * Plate quality — PRD §3.4. The centre of the game.
 *
 *   Q = 9.5
 *     + 1.6 × effHand(lead)  + 0.6 × effHand(helper)
 *     + 0.9 × difficulty     − 2.2 × max(0, difficulty − effHand(lead))
 *     + seasonality + harmony
 *     − 5.0 × overload²      − crowding
 *     − wear × enduranceCoef × waveWeight
 *     + push + scold + premium + trial
 *     + U(−1, +1) × (1 + 0.25 × max(0, difficulty − 2)) × (pushed ? 2.2 : 1)
 *
 * The noise term is the *only* output randomness in the game. Everything else —
 * draft, catalogue, visit dates, signals, seasonality — is input randomness,
 * resolved before the player decides.
 *
 * The deterministic part is split from the roll so the menu planner can score a
 * candidate menu without consuming the RNG.
 */

import { C } from './constants';
import { clamp } from './math';
import { getTrait } from '../data/traits';
import type { Rng } from './rng';
import type { Cook, Course, Flavour, PlateContext, Station, Trait, WaveIndex } from './types';

/** +1 at home, −1 away. Enters quality, capacity, the overreach threshold and growth. */
export function effectiveHand(cook: Cook | null, station: Station): number {
  if (cook === null) return 0;
  return (
    cook.hand +
    (cook.homeStation === station ? C.plate.homeStationBonus : C.plate.awayStationPenalty)
  );
}

export interface StationSetup {
  station: Station;
  lead: Cook | null;
  helper: Cook | null;
  effHandLead: number;
  effHandHelper: number;
  /** Sum of the difficulties of this station's courses. */
  load: number;
  capacity: number;
  overload: number;
  crowding: number;
  courseCount: number;
  /** 0 when the station carries no course. Growth reads it. */
  maxDifficulty: number;
  /**
   * False when there is no lead, or when the lead's effective hand leaves the
   * station with no capacity at all. Its courses are then defects computed
   * without a Q — PRD §9 cases 1 and 2, and the reason nothing here divides by zero.
   */
  viable: boolean;
}

export function buildStationSetup(
  station: Station,
  menu: readonly Course[],
  lead: Cook | null,
  helper: Cook | null,
): StationSetup {
  const effHandLead = effectiveHand(lead, station);
  const effHandHelper = effectiveHand(helper, station);

  let load = 0;
  let ambitious = 0;
  let courseCount = 0;
  let maxDifficulty = 0;
  for (const course of menu) {
    if (course.station !== station) continue;
    load += course.difficulty;
    courseCount += 1;
    if (course.difficulty >= C.plate.crowdingDifficultyThreshold) ambitious += 1;
    if (course.difficulty > maxDifficulty) maxDifficulty = course.difficulty;
  }

  const capacity = C.plate.capacityCoef * (effHandLead + C.plate.capacityHelperCoef * effHandHelper);
  const viable = lead !== null && capacity > 0;
  const overload = viable ? Math.max(0, load / capacity - 1) : 0;

  // Crowding counts ambitious courses; overload measures volume. They are
  // different things and they both apply — PRD §9 case 11.
  const allowance =
    helper !== null ? C.plate.crowdingAllowanceWithHelper : C.plate.crowdingAllowanceSolo;
  const crowding = C.plate.crowdingCoef * Math.max(0, ambitious - allowance);

  return {
    station,
    lead,
    helper,
    effHandLead,
    effHandHelper,
    load,
    capacity,
    overload,
    crowding,
    courseCount,
    maxDifficulty,
    viable,
  };
}

// ---------------------------------------------------------------------------
// Harmony — PRD §3.6, computed from neighbours
// ---------------------------------------------------------------------------

const OPPOSING_PAIRS: ReadonlyArray<readonly [Flavour, Flavour]> = [
  ['meaty', 'sour'],
  ['earthy', 'sour'],
];

/**
 * `left` is the earlier course, `right` the later one. PRD §3.6 writes the rule as
 * "meaty↔sour, earthy↔sour, anything→sweet" — the arrows differ on purpose, so the
 * first two are symmetric and the sweet rule is **directional**: arriving at a
 * sweet course is a contrast, leaving one is not. That is what makes a tasting
 * menu's order mean something rather than just its contents.
 */
function areOpposing(left: Flavour, right: Flavour): boolean {
  if (left === right) return false;
  if (right === 'sweet') return true;
  if (left === 'sweet') return false;
  return OPPOSING_PAIRS.some(([x, y]) => (left === x && right === y) || (left === y && right === x));
}

/** One adjacent pair's contribution. Same station and same flavour can stack. */
function pairHarmony(a: Course, b: Course): number {
  let value = 0;
  if (a.station === b.station) value += C.harmony.sameStation;
  if (a.flavour === b.flavour) value += C.harmony.sameFlavour;
  else if (areOpposing(a.flavour, b.flavour)) value += C.harmony.opposing;
  return value;
}

/**
 * Each course sums the contribution of its left and right neighbour, then clamps.
 * The first and last course have one neighbour each and are not penalised for it.
 */
export function computeHarmony(menu: readonly Course[]): number[] {
  return menu.map((course, index) => {
    const left = menu[index - 1];
    const right = menu[index + 1];
    let total = 0;
    if (left !== undefined) total += pairHarmony(left, course);
    if (right !== undefined) total += pairHarmony(course, right);
    return clamp(total, C.harmony.clampMin, C.harmony.clampMax);
  });
}

/** ±0.8 over an eight-week cycle. Shifts every course, so it never changes a menu alone. */
export function seasonality(course: Course, weekIndex: number): number {
  return (
    C.plate.seasonalityAmplitude *
    Math.sin((2 * Math.PI * (weekIndex + course.seasonPhase)) / C.plate.seasonalityPeriod)
  );
}

// ---------------------------------------------------------------------------
// Quality
// ---------------------------------------------------------------------------

export interface EveningContext {
  menu: readonly Course[];
  /** One clamped value per course, from `computeHarmony`. */
  harmony: readonly number[];
  weekIndex: number;
  eveningIndex: number;
  pushedStation: Station | null;
  scoldedStation: Station | null;
  premium: boolean;
  /** One of the two evenings after a menu revision. PRD §3.6 */
  trialEvening: boolean;
  bar: number;
}

function traitOf(cook: Cook | null): Trait | null {
  return cook === null ? null : getTrait(cook.traitId);
}

function plateContext(
  course: Course,
  courseIndex: number,
  setup: StationSetup,
  evening: EveningContext,
  wave: WaveIndex,
  waveWeight: number,
  cook: Cook,
  role: 'lead' | 'helper',
): PlateContext {
  return {
    course,
    courseIndex,
    menu: evening.menu,
    station: setup.station,
    role,
    cook,
    lead: setup.lead,
    helper: setup.helper,
    effHandLead: setup.effHandLead,
    effHandHelper: setup.effHandHelper,
    wave,
    waveWeight,
    weekIndex: evening.weekIndex,
    eveningIndex: evening.eveningIndex,
    stationLoad: setup.load,
    capacity: setup.capacity,
    overload: setup.overload,
    crowding: setup.crowding,
    pushed: evening.pushedStation === setup.station,
    premium: evening.premium,
    bar: evening.bar,
  };
}

/**
 * The deterministic half of a plate. Callers that only want to compare menus stop
 * here; `computePlateQuality` adds the roll.
 *
 * `wearOverride` lets the menu planner reason about a typical evening rather than
 * about tonight's exact fatigue.
 */
export function computeBaseQuality(
  course: Course,
  courseIndex: number,
  setup: StationSetup,
  evening: EveningContext,
  wave: WaveIndex,
  wearOverride?: number,
): number {
  const waveWeight = C.waveWeights[wave];
  const lead = setup.lead;
  const wear = wearOverride ?? lead?.wear ?? 0;
  const enduranceCoef = lead === null ? 0 : C.endurance[lead.endurance];

  let q =
    C.plate.base +
    C.plate.leadHandCoef * setup.effHandLead +
    C.plate.helperHandCoef * setup.effHandHelper +
    C.plate.difficultyCoef * course.difficulty -
    C.plate.overreachCoef * Math.max(0, course.difficulty - setup.effHandLead) +
    seasonality(course, evening.weekIndex) +
    (evening.harmony[courseIndex] ?? 0) -
    C.plate.overloadCoef * setup.overload * setup.overload -
    setup.crowding -
    wear * enduranceCoef * waveWeight;

  if (evening.pushedStation === setup.station) q += C.intervention.pushQuality;
  if (evening.scoldedStation === setup.station) q += C.intervention.scoldQuality;
  if (evening.premium) q += C.plate.premiumBonus;
  if (evening.trialEvening) q += C.plate.trialEveningPenalty;

  // Traits change a rule, not a stat. The context is only built when someone
  // actually has a rule to apply — this loop runs millions of times in the
  // menu planner and the reference brigade has no traits at all.
  const leadTrait = traitOf(lead);
  if (leadTrait?.apply !== undefined && lead !== null) {
    q = leadTrait.apply(
      plateContext(course, courseIndex, setup, evening, wave, waveWeight, lead, 'lead'),
      q,
    );
  }
  const helper = setup.helper;
  const helperTrait = traitOf(helper);
  if (helperTrait?.apply !== undefined && helper !== null) {
    q = helperTrait.apply(
      plateContext(course, courseIndex, setup, evening, wave, waveWeight, helper, 'helper'),
      q,
    );
  }

  return q;
}

/** How wide the roll is. Ambition destabilises; a push doubles it; traits scale it. */
export function noiseWidth(
  course: Course,
  setup: StationSetup,
  evening: EveningContext,
  wave: WaveIndex,
): number {
  const ambition =
    C.plate.noiseWidthBase +
    C.plate.noiseDifficultyCoef *
      Math.max(0, course.difficulty - C.plate.noiseDifficultyPivot);
  const push =
    evening.pushedStation === setup.station ? C.intervention.pushVarianceMultiplier : 1;

  let traitScale = 1;
  const lead = setup.lead;
  const leadTrait = traitOf(lead);
  if (leadTrait?.varianceMultiplier !== undefined && lead !== null) {
    traitScale = leadTrait.varianceMultiplier(
      plateContext(course, 0, setup, evening, wave, C.waveWeights[wave], lead, 'lead'),
    );
  }
  return ambition * push * traitScale;
}

export function computePlateQuality(
  course: Course,
  courseIndex: number,
  setup: StationSetup,
  evening: EveningContext,
  wave: WaveIndex,
  rng: Rng,
): number {
  const base = computeBaseQuality(course, courseIndex, setup, evening, wave);
  const roll = rng.uniform(C.plate.noiseMin, C.plate.noiseMax);
  return base + roll * noiseWidth(course, setup, evening, wave);
}
