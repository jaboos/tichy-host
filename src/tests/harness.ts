/**
 * The balance harness. Not a test file — it is the measuring apparatus that
 * `golden.test.ts` drives.
 *
 * It reproduces the experiment in `sim-final.js`: four bot policies, played over
 * the real engine. The bots are transcribed from the reference simulation rather
 * than invented, because the numbers in PRD §8.2 describe *that* experiment. Where
 * the reference bot does something odd, this file does the same odd thing and says
 * so — a "better" bot would measure a different experiment and the band would mean
 * nothing.
 *
 * The numbers in this file are properties of the reference experiment, not tunables
 * of the game, which is why they are here and not in `constants.ts`. Nothing here
 * may be changed to make a gate pass (CLAUDE.md rule 3).
 */

import { C } from '../engine/constants';
import { computeBar } from '../engine/bar';
import {
  buildStationSetup,
  computeBaseQuality,
  computeHarmony,
  type EveningContext,
} from '../engine/plate';
import { createRng, type Rng } from '../engine/rng';
import {
  advanceEvening,
  advanceWeek,
  openEvening,
  resolveMenu,
  startSeason,
} from '../engine/season';
import { STARTING_ARCHETYPES, createCook } from '../data/cooks';
import { NEUTRAL_TRAIT_ID } from '../data/traits';
import {
  STATIONS,
  type Assignment,
  type Cook,
  type Course,
  type Intervention,
  type Station,
  type WaveIndex,
} from '../engine/types';

// --- reference-experiment constants ---------------------------------------

/** `sim-final.js` line 82: rest the most worn cook once wear reaches this. */
const REST_WEAR_THRESHOLD = 4;
/** Lines 83 and 87: the suspicion at which SMART cancels rest and burns a token. */
const SUSPICION_THRESHOLD = 0.35;
/**
 * `sim-final.js` line 87 always pushes station 2. PRD §8.2 bot hygiene forbids a
 * hardcoded target: the push goes to the station with the worst predicted margin,
 * which is what a player reads off the station disks and the bar.
 */
/** Line 23: the planner reasons about a typical evening, not tonight's fatigue. */
const EVAL_WEAR = 3.0;
/** Line 26: `-below*10 + top*0.5`. Defects dominate; star plates are a tiebreak. */
const EVAL_DEFECT_WEIGHT = -10;
const EVAL_STAR_WEIGHT = 0.5;
/**
 * PRD §8.2 bot hygiene: the planner must not be blind to what the Pas screen puts
 * on the player's screen as a glowing disk. `below` and `top` are counts, so once
 * a candidate has no plates under the bar they stop discriminating and the planner
 * happily buys ambition with capacity.
 *
 * The weight is 1.0 and was chosen once, not searched: `strain` is already measured
 * in quality points (it is literally the overload and crowding terms of
 * `computePlateQuality`), so one point of lost quality costs one point of score.
 * Defects stay an order of magnitude more important, as they were.
 */
const EVAL_STRAIN_WEIGHT = 1.0;
/** Line 69: NAIVE takes the first menu it draws; everyone else searches. */
const MENU_TRIES_NAIVE = 1;
const MENU_TRIES_SEARCH = 200;

/** Lines 47-48: the reference planner fills empty stations in this order... */
const STATION_ORDER: readonly Station[] = STATIONS;
/** ...and seats its one or two helpers on sauce first, then fire. */
const HELPER_PRIORITY: readonly Station[] = ['sauce', 'fire'];

export type Policy = 'NAIVE' | 'ROTA' | 'REVISE' | 'SMART';
export const POLICIES: readonly Policy[] = ['NAIVE', 'ROTA', 'REVISE', 'SMART'];

/**
 * The §4.2 brigade with traits switched off, which is what `sim-final.js` measured
 * — its cooks carry hand, home station and endurance and nothing else. Traits are
 * a real part of the game and are exercised in `edge.test.ts`; letting them into
 * the balance measurement would add a divergence PRD §8.2 does not list.
 */
export function referenceBrigade(): Cook[] {
  return STARTING_ARCHETYPES.map((archetype) =>
    createCook({ ...archetype, traitId: NEUTRAL_TRAIT_ID }),
  );
}

/** The same six, with their real traits. Measured alongside, never gated on. */
export function starterBrigade(): Cook[] {
  return STARTING_ARCHETYPES.map(createCook);
}

// --- the reference planner (sim-final.js `makePlan`) -----------------------

export function makePlan(cooks: readonly Cook[], restId: string | null): Assignment {
  const leads: Record<Station, string | null> = {
    cold: null,
    fire: null,
    sauce: null,
    dessert: null,
  };
  const helpers: Record<Station, string | null> = {
    cold: null,
    fire: null,
    sauce: null,
    dessert: null,
  };

  // Best hands claim their home station first.
  const available = cooks.filter((cook) => cook.id !== restId).sort((a, b) => b.hand - a.hand);
  for (const cook of available) {
    if (leads[cook.homeStation] === null) leads[cook.homeStation] = cook.id;
  }

  const isLead = (id: string): boolean => STATION_ORDER.some((station) => leads[station] === id);

  // Whoever is left covers an empty station, at −1 for being away from home.
  for (const cook of available) {
    if (isLead(cook.id)) continue;
    const empty = STATION_ORDER.find((station) => leads[station] === null);
    if (empty !== undefined) leads[empty] = cook.id;
  }

  for (const cook of available) {
    if (isLead(cook.id)) continue;
    if (HELPER_PRIORITY.some((station) => helpers[station] === cook.id)) continue;
    const slot = HELPER_PRIORITY.find((station) => helpers[station] === null);
    if (slot !== undefined) helpers[slot] = cook.id;
  }

  // Emergency cover: a station with nobody at all would resolve as defects.
  const first = available[0];
  if (first !== undefined) {
    for (const station of STATION_ORDER) {
      if (leads[station] === null) leads[station] = first.id;
    }
  }

  return { leads, helpers, resting: restId === null ? [] : [restId] };
}

// --- the reference menu planner (sim-final.js `evalMenu` / `pickMenu`) -----

function setupsFor(cooks: readonly Cook[], assignment: Assignment, menu: readonly Course[]) {
  const byId = new Map(cooks.map((cook) => [cook.id, cook]));
  const lookup = (id: string | null): Cook | null => (id === null ? null : (byId.get(id) ?? null));
  const out = {} as Record<Station, ReturnType<typeof buildStationSetup>>;
  for (const station of STATIONS) {
    out[station] = buildStationSetup(
      station,
      menu,
      lookup(assignment.leads[station]),
      lookup(assignment.helpers[station]),
    );
  }
  return out;
}

/**
 * Scores a candidate menu without touching the RNG: how many of the twelve plates
 * would land under the bar, and how many would reach a star plate.
 *
 * QUIRK, deliberately preserved: `sim-final.js` line 23 passes `0` where the
 * pushed station belongs, and station 0 is the cold kitchen — so the reference
 * planner scores every menu as though cold were being pushed. It is a slip in the
 * reference bot, and it biases menu choice toward cold-heavy menus. It is kept
 * because the 18.0 / 36.8 / 46.8 / 60.6 table was measured with it; "fixing" it
 * here would measure a different experiment against an unchanged band.
 */
export interface MenuScore {
  /** The menu cooked on an ordinary evening. */
  normal: number;
  /** The same menu on one of the two trial evenings a revision costs. */
  trial: number;
}

export function scoreMenu(
  menu: readonly Course[],
  cooks: readonly Cook[],
  assignment: Assignment,
  weekIndex: number,
  reputation: number,
  seasonNumber: number,
  evalPushStation: Station | null = 'cold',
): MenuScore {
  const bar = computeBar(menu, weekIndex, reputation, seasonNumber);
  const setups = setupsFor(cooks, assignment, menu);
  const evening: EveningContext = {
    menu,
    harmony: computeHarmony(menu),
    weekIndex,
    eveningIndex: 0,
    pushedStation: evalPushStation,
    scoldedStation: null,
    premium: false,
    trialEvening: false,
    bar,
  };

  let below = 0;
  let top = 0;
  let belowTrial = 0;
  let topTrial = 0;
  const starBar = bar + C.outcome.starPlateOffset;

  for (let index = 0; index < menu.length; index += 1) {
    const course = menu[index];
    if (course === undefined) continue;
    const setup = setups[course.station];
    for (const wave of [0, 1] as readonly WaveIndex[]) {
      const q = setup.viable
        ? computeBaseQuality(course, index, setup, evening, wave, EVAL_WEAR)
        : Number.NEGATIVE_INFINITY;
      if (q < bar) below += 1;
      if (q >= starBar) top += 1;
      // A trial evening is the same plate minus 1.0, so one pass covers both.
      const trialQ = q + C.plate.trialEveningPenalty;
      if (trialQ < bar) belowTrial += 1;
      if (trialQ >= starBar) topTrial += 1;
    }
  }

  // The quality this menu throws away on strained stations, in quality points.
  let strain = 0;
  for (const station of STATIONS) {
    const setup = setups[station];
    if (!setup.viable) continue;
    strain += C.plate.overloadCoef * setup.overload * setup.overload + setup.crowding;
  }
  const penalty = strain * EVAL_STRAIN_WEIGHT;

  return {
    normal: below * EVAL_DEFECT_WEIGHT + top * EVAL_STAR_WEIGHT - penalty,
    trial: belowTrial * EVAL_DEFECT_WEIGHT + topTrial * EVAL_STAR_WEIGHT - penalty,
  };
}

/**
 * What a challenger is really worth once the revision is paid for. PRD §3.6
 * charges two evenings at −1.0 out of the five a menu will cook before the next
 * Monday, so the expected score is that blend. No free parameter: both numbers
 * come from the spec (`C.menu.trialEvenings`, `C.season.eveningsPerWeek`).
 */
export function challengerScore(score: MenuScore): number {
  const trialEvenings = C.menu.trialEvenings;
  const ordinary = C.season.eveningsPerWeek - trialEvenings;
  return (ordinary * score.normal + trialEvenings * score.trial) / C.season.eveningsPerWeek;
}

export function evalMenu(
  menu: readonly Course[],
  cooks: readonly Cook[],
  assignment: Assignment,
  weekIndex: number,
  reputation: number,
  seasonNumber: number,
  evalPushStation: Station | null = 'cold',
): number {
  return scoreMenu(menu, cooks, assignment, weekIndex, reputation, seasonNumber, evalPushStation)
    .normal;
}

/**
 * Draws one course per station, then fills to six at random, and keeps the best of
 * `tries` candidates. The insertion order — cold, fire, sauce, dessert, then the
 * fillers — is what the neighbour harmony rule sees as the service order.
 */
/**
 * Mean predicted distance from the bar across the twelve plates, using tonight's
 * actual fatigue. This is what the player estimates from the bar line and the
 * station disks; the bot uses it to aim a push.
 */
export function predictedMargin(
  menu: readonly Course[],
  cooks: readonly Cook[],
  assignment: Assignment,
  weekIndex: number,
  reputation: number,
  seasonNumber: number,
  station: Station | null = null,
): number {
  const bar = computeBar(menu, weekIndex, reputation, seasonNumber);
  const setups = setupsFor(cooks, assignment, menu);
  const evening: EveningContext = {
    menu,
    harmony: computeHarmony(menu),
    weekIndex,
    eveningIndex: 0,
    pushedStation: null,
    scoldedStation: null,
    premium: false,
    trialEvening: false,
    bar,
  };

  let total = 0;
  let count = 0;
  for (let index = 0; index < menu.length; index += 1) {
    const course = menu[index];
    if (course === undefined) continue;
    if (station !== null && course.station !== station) continue;
    const setup = setups[course.station];
    for (const wave of [0, 1] as readonly WaveIndex[]) {
      total += setup.viable
        ? computeBaseQuality(course, index, setup, evening, wave) - bar
        : -C.outcome.starPlateOffset;
      count += 1;
    }
  }
  return count === 0 ? 0 : total / count;
}

/** Where a push buys the most: the station closest to dropping plates. */
export function worstMarginStation(
  menu: readonly Course[],
  cooks: readonly Cook[],
  assignment: Assignment,
  weekIndex: number,
  reputation: number,
  seasonNumber: number,
): Station | null {
  let worst: Station | null = null;
  let worstMargin = Number.POSITIVE_INFINITY;
  for (const station of STATIONS) {
    if (!menu.some((course) => course.station === station)) continue;
    const margin = predictedMargin(
      menu,
      cooks,
      assignment,
      weekIndex,
      reputation,
      seasonNumber,
      station,
    );
    if (margin < worstMargin) {
      worstMargin = margin;
      worst = station;
    }
  }
  return worst;
}

export function pickMenu(
  rng: Rng,
  catalogue: readonly Course[],
  cooks: readonly Cook[],
  assignment: Assignment,
  weekIndex: number,
  reputation: number,
  seasonNumber: number,
  tries: number,
  evalPushStation: Station | null = 'cold',
  /**
   * The menu the kitchen is already cooking, if there is one. It competes, and it
   * competes on fair terms: it costs nothing to keep, while every challenger is
   * charged the two trial evenings §3.6 says a revision costs. Leaving it out was
   * a plain omission — the bot was forced to swap even when the best of two
   * hundred rolls was worse than what it already had, which no player looking at
   * the Menu screen would ever do.
   */
  incumbent: readonly Course[] | null = null,
): Course[] {
  const byStation = new Map<Station, Course[]>(STATIONS.map((station) => [station, []]));
  for (const course of catalogue) byStation.get(course.station)?.push(course);

  let best: Course[] | null = incumbent === null ? null : [...incumbent];
  let bestScore =
    incumbent === null
      ? Number.NEGATIVE_INFINITY
      : scoreMenu(
          incumbent,
          cooks,
          assignment,
          weekIndex,
          reputation,
          seasonNumber,
          evalPushStation,
        ).normal;

  for (let attempt = 0; attempt < tries; attempt += 1) {
    const chosen: Course[] = [];
    const seen = new Set<string>();
    const take = (course: Course | undefined): void => {
      if (course === undefined || seen.has(course.id)) return;
      seen.add(course.id);
      chosen.push(course);
    };

    for (const station of STATIONS) {
      const pool = byStation.get(station) ?? [];
      if (pool.length > 0) take(pool[rng.int(pool.length)]);
    }
    let guard = 0;
    while (chosen.length < C.menu.courses && guard < catalogue.length * 10) {
      take(catalogue[rng.int(catalogue.length)]);
      guard += 1;
    }
    if (chosen.length < C.menu.courses) continue;

    const score = scoreMenu(
      chosen,
      cooks,
      assignment,
      weekIndex,
      reputation,
      seasonNumber,
      evalPushStation,
    );
    // An opening menu costs nothing to adopt; a replacement costs two evenings.
    const value = incumbent === null ? score.normal : challengerScore(score);
    if (value > bestScore) {
      bestScore = value;
      best = chosen;
    }
  }

  if (best === null) throw new Error('pickMenu: catalogue cannot produce a legal menu');
  return best;
}

// --- the season runner (sim-final.js `season`) -----------------------------

export interface HarnessOptions {
  /**
   * PRD §3.6 charges two evenings at −1.0 for a menu revision. `sim-final.js` does
   * not model that cost at all. True is the game; false reproduces the reference.
   */
  modelTrialEvenings?: boolean;
  /** True runs the §4.2 brigade with its real traits. False is the reference. */
  useTraits?: boolean;
  /**
   * Which station the menu planner scores as pushed. `'cold'` reproduces the
   * reference bot's slip (see `evalMenu`); `null` is the planner without it.
   * Attribution only — the gate runs the reference value.
   */
  evalPushStation?: Station | null;
}

export interface SeasonOutcome {
  stars: 0 | 1 | 2;
  star: boolean;
  twoStars: boolean;
  reputation: number;
  cooks: Cook[];
  handSum: number;
  visits: number;
}

export function runPolicySeason(
  seed: number,
  policy: Policy,
  brigade: readonly Cook[],
  seasonNumber: 1 | 2 | 3,
  options: HarnessOptions = {},
): SeasonOutcome {
  const modelTrialEvenings = options.modelTrialEvenings ?? true;
  const tries = policy === 'NAIVE' ? MENU_TRIES_NAIVE : MENU_TRIES_SEARCH;

  let state = startSeason({ seed: `S${seed}`, seasonNumber, cooks: brigade });
  const rng = createRng(state.rngState);

  let assignment = makePlan(state.cooks, null);
  const evalPush = options.evalPushStation === undefined ? 'cold' : options.evalPushStation;
  const opening = pickMenu(
    rng,
    state.catalogue,
    state.cooks,
    assignment,
    0,
    state.reputation,
    seasonNumber,
    tries,
    evalPush,
  );
  state = { ...state, menu: opening.map((course) => course.id) };

  for (let evening = 0; evening < C.season.eveningsPerSeason; evening += 1) {
    const week = Math.floor(evening / C.season.eveningsPerWeek);

    if (evening % C.season.eveningsPerWeek === 0) {
      const revises = week > 0 && (policy === 'REVISE' || policy === 'SMART');
      // The revision must plan against the FULL brigade. Scoring a menu against a
      // plan that has somebody resting, then cooking it with everyone present, was
      // measuring one kitchen and playing another — it made weekly revision look
      // actively harmful and inverted the ★ ladder.
      const revisionPlan = makePlan(state.cooks, null);
      const nextMenu = revises
        ? pickMenu(
            rng,
            state.catalogue,
            state.cooks,
            revisionPlan,
            week,
            state.reputation,
            seasonNumber,
            tries,
            evalPush,
            resolveMenu(state),
          )
        : null;

      state = advanceWeek(state, {
        menu: nextMenu === null ? state.menu : nextMenu.map((course) => course.id),
        premiumIngredients: policy !== 'NAIVE' && week % 2 === 0,
      });
      if (!modelTrialEvenings) {
        state = { ...state, weekPlan: { ...state.weekPlan, trialEveningsLeft: 0 } };
      }
    }

    const opened = openEvening(state, rng);
    state = opened.state;

    let restId: string | null = null;
    const readsSignals = policy === 'SMART';
    if (policy !== 'NAIVE') {
      const worst = [...state.cooks].sort((a, b) => b.wear - a.wear)[0];
      if (worst !== undefined && worst.wear >= REST_WEAR_THRESHOLD) restId = worst.id;
      // Reading the signals: never rest anyone on an evening that smells of a visit.
      if (readsSignals && opened.opening.suspicion >= SUSPICION_THRESHOLD) restId = null;
    }
    assignment = makePlan(state.cooks, restId);

    let intervention: Intervention | null = null;
    if (readsSignals && state.pushTokens > 0 && opened.opening.suspicion >= SUSPICION_THRESHOLD) {
      const target = worstMarginStation(
        resolveMenu(state),
        state.cooks,
        assignment,
        week,
        state.reputation,
        seasonNumber,
      );
      if (target !== null) intervention = { id: 'push', station: target };
    }

    state = advanceEvening(state, opened.opening, { assignment, intervention }, rng).state;
  }

  return {
    stars: state.stars,
    star: state.stars >= 1,
    twoStars: state.stars === 2,
    reputation: state.reputation,
    // A career carries the brigade over rested and with the counter cleared.
    cooks: state.cooks.map((cook) => ({ ...cook, wear: 0, cleanEvenings: 0 })),
    handSum: state.cooks.reduce((total, cook) => total + cook.hand, 0),
    visits: state.visits.length,
  };
}

export interface PolicyMeasurement {
  policy: Policy;
  starRate: number;
  twoStarRate: number;
  reputation: number;
}

/** Percentage points, to one decimal — the unit PRD §8.2 states its band in. */
export function measurePolicy(
  policy: Policy,
  seasons: number,
  seedBase: number,
  options: HarnessOptions = {},
): PolicyMeasurement {
  const brigade = options.useTraits === true ? starterBrigade() : referenceBrigade();
  let stars = 0;
  let twoStars = 0;
  let reputation = 0;

  for (let i = 0; i < seasons; i += 1) {
    const outcome = runPolicySeason(seedBase + i, policy, brigade, 1, options);
    if (outcome.star) stars += 1;
    if (outcome.twoStars) twoStars += 1;
    reputation += outcome.reputation;
  }

  return {
    policy,
    starRate: (100 * stars) / seasons,
    twoStarRate: (100 * twoStars) / seasons,
    reputation: reputation / seasons,
  };
}

export interface CareerMeasurement {
  starRate: number[];
  twoStarRate: number[];
  handSum: number[];
}

/** SMART across three seasons; the brigade survives and the bar rises 0.4 a season. */
export function measureCareer(
  seasons: number,
  seedBase: number,
  options: HarnessOptions = {},
): CareerMeasurement {
  const length = C.season.seasonsPerCareer;
  const stars = Array.from({ length }, () => 0);
  const twoStars = Array.from({ length }, () => 0);
  const hands = Array.from({ length }, () => 0);

  for (let i = 0; i < seasons; i += 1) {
    let brigade = options.useTraits === true ? starterBrigade() : referenceBrigade();
    for (let season = 1; season <= length; season += 1) {
      const outcome = runPolicySeason(
        seedBase + i * length + season,
        'SMART',
        brigade,
        season as 1 | 2 | 3,
        options,
      );
      if (outcome.star) stars[season - 1] = (stars[season - 1] ?? 0) + 1;
      if (outcome.twoStars) twoStars[season - 1] = (twoStars[season - 1] ?? 0) + 1;
      hands[season - 1] = (hands[season - 1] ?? 0) + outcome.handSum;
      brigade = outcome.cooks;
    }
  }

  return {
    starRate: stars.map((n) => (100 * n) / seasons),
    twoStarRate: twoStars.map((n) => (100 * n) / seasons),
    handSum: hands.map((n) => n / seasons),
  };
}
