/**
 * The season loop — PRD §3.1, §3.2, §3.8 FR-12.
 *
 * Two steps per evening, because that is the shape of the decision:
 *
 *   openEvening(state, rng)  → the signals, the suspicion, the covers, the bar.
 *                              All input randomness, resolved BEFORE the player chooses.
 *   advanceEvening(...)      → the service roll and its consequences.
 *
 * That split is the whole design of PRD §11.6: input randomness before the
 * decision, output randomness only in the plate roll.
 */

import { C } from './constants';
import { computeBar } from './bar';
import { coversFor, isBankrupt, updateReputation } from './economy';
import { computePrior, computeSuspicion, drawSignals, drawVisitEvenings } from './inspector';
import { runService, type EveningSetup } from './service';
import { applyEveningWear, applyMondayRecovery } from './wear';
import { draftBrigade, draftCatalogue, defaultMenu } from './draft';
import { createRng, seedToRngState, type Rng } from './rng';
import { STATIONS } from './types';
import type {
  Assignment,
  Cook,
  Course,
  GameState,
  Intervention,
  Lang,
  ServiceResult,
  Signal,
  Station,
  Visit,
  WaveIndex,
} from './types';

export const EMPTY_ASSIGNMENT: Assignment = {
  leads: { cold: null, fire: null, sauce: null, dessert: null },
  helpers: { cold: null, fire: null, sauce: null, dessert: null },
  resting: [],
};

export function weekIndexOf(eveningIndex: number): number {
  return Math.floor(eveningIndex / C.season.eveningsPerWeek);
}

export function eveningInWeekOf(eveningIndex: number): number {
  return eveningIndex % C.season.eveningsPerWeek;
}

export function resolveMenu(state: GameState): Course[] {
  const byId = new Map(state.catalogue.map((course) => [course.id, course]));
  const menu: Course[] = [];
  for (const id of state.menu) {
    const course = byId.get(id);
    if (course === undefined)
      throw new Error(`Menu references a course outside the catalogue: ${id}`);
    menu.push(course);
  }
  return menu;
}

// ---------------------------------------------------------------------------
// Starting a season
// ---------------------------------------------------------------------------

export interface StartSeasonOptions {
  seed: string;
  seasonNumber?: 1 | 2 | 3;
  venueName?: string;
  lang?: Lang;
  /** Carried over in a career, or the curated six on a first run. Drafted when absent. */
  cooks?: readonly Cook[];
  catalogue?: readonly Course[];
  menu?: readonly string[];
  reputation?: number;
  cash?: number;
}

export function startSeason(options: StartSeasonOptions): GameState {
  const rng = createRng(seedToRngState(options.seed));

  const catalogue = options.catalogue !== undefined ? [...options.catalogue] : draftCatalogue(rng);
  const cooks =
    options.cooks !== undefined ? options.cooks.map((c) => ({ ...c })) : draftBrigade(rng);
  const menu =
    options.menu !== undefined ? [...options.menu] : defaultMenu(catalogue).map((c) => c.id);
  const visitEvenings = drawVisitEvenings(rng);

  return {
    version: C.storage.version,
    seed: options.seed,
    rngState: rng.state(),
    lang: options.lang ?? 'cs',
    venueName: options.venueName ?? '',
    seasonNumber: options.seasonNumber ?? 1,
    eveningIndex: 0,
    cooks,
    catalogue,
    menu,
    assignment: EMPTY_ASSIGNMENT,
    weekPlan: {
      restTickets: [],
      deferredRest: [],
      menuChangedThisWeek: false,
      trialEveningsLeft: 0,
      premiumIngredients: false,
    },
    cash: options.cash ?? C.economy.startingCash,
    reputation: options.reputation ?? C.economy.startingReputation,
    pushTokens: C.intervention.pushTokensPerSeason,
    visitEvenings,
    visits: [],
    history: [],
    stars: 0,
    narratorUsed: [],
  };
}

/**
 * A sensible opening assignment for an evening: the best hands take their home
 * station, whoever is left covers an empty one, and the last one or two become
 * helpers. The player rearranges from here — this only exists so the Pas screen
 * never opens empty. Pure.
 */
export function autoAssign(cooks: readonly Cook[], restingIds: readonly string[]): Assignment {
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
  const resting = new Set(restingIds);

  const available = cooks.filter((cook) => !resting.has(cook.id)).sort((a, b) => b.hand - a.hand);
  for (const cook of available) {
    if (leads[cook.homeStation] === null) leads[cook.homeStation] = cook.id;
  }
  const isLead = (id: string): boolean => STATIONS.some((station) => leads[station] === id);

  for (const cook of available) {
    if (isLead(cook.id)) continue;
    const empty = STATIONS.find((station) => leads[station] === null);
    if (empty !== undefined) leads[empty] = cook.id;
  }
  // Spare hands help where the load is heaviest.
  for (const cook of available) {
    if (isLead(cook.id) || STATIONS.some((station) => helpers[station] === cook.id)) continue;
    const slot = STATIONS.find((station) => helpers[station] === null);
    if (slot !== undefined) helpers[slot] = cook.id;
  }

  return { leads, helpers, resting: [...restingIds] };
}

// ---------------------------------------------------------------------------
// The evening
// ---------------------------------------------------------------------------

export interface EveningOpening {
  eveningIndex: number;
  weekIndex: number;
  eveningInWeek: number;
  /** Hidden from the UI. The player only ever sees `suspicion`. */
  inspected: boolean;
  inspectedWave: WaveIndex;
  signals: Signal[];
  /** 0–1. The one number the player is shown. */
  suspicion: number;
  covers: number;
  bar: number;
}

export function openEvening(
  state: GameState,
  rng: Rng,
): { state: GameState; opening: EveningOpening } {
  const eveningIndex = state.eveningIndex;
  const inspected = state.visitEvenings.includes(eveningIndex);

  // Drawn every evening whether or not anyone is watching, so the draw itself
  // cannot leak which evening is the visit.
  const inspectedWave = rng.int(C.season.wavesPerEvening) as WaveIndex;
  const signals = drawSignals(rng, inspected);

  const opening: EveningOpening = {
    eveningIndex,
    weekIndex: weekIndexOf(eveningIndex),
    eveningInWeek: eveningInWeekOf(eveningIndex),
    inspected,
    inspectedWave,
    signals,
    suspicion: computeSuspicion(signals, computePrior(eveningIndex, state.visitEvenings)),
    covers: coversFor(state.reputation, eveningInWeekOf(eveningIndex)),
    bar: computeBar(
      resolveMenu(state),
      weekIndexOf(eveningIndex),
      state.reputation,
      state.seasonNumber,
    ),
  };

  return { state: { ...state, rngState: rng.state() }, opening };
}

export interface EveningDecision {
  assignment: Assignment;
  /** Exactly one, or none. PRD §3.5 */
  intervention: Intervention | null;
}

interface ResolvedIntervention {
  pushedStation: Station | null;
  scoldedStation: Station | null;
  cutCourseId: string | null;
  extraWear: Map<string, number>;
  spendsToken: boolean;
}

function resolveIntervention(
  intervention: Intervention | null,
  assignment: Assignment,
): ResolvedIntervention {
  const out: ResolvedIntervention = {
    pushedStation: null,
    scoldedStation: null,
    cutCourseId: null,
    extraWear: new Map(),
    spendsToken: false,
  };
  if (intervention === null) return out;

  switch (intervention.id) {
    case 'praise':
      if (intervention.cookId !== undefined) {
        out.extraWear.set(intervention.cookId, C.intervention.praiseWear);
      }
      break;
    case 'scold':
      if (intervention.station !== undefined) {
        out.scoldedStation = intervention.station;
        const lead = assignment.leads[intervention.station];
        if (lead !== null) out.extraWear.set(lead, C.intervention.scoldWear);
      }
      break;
    case 'push':
      if (intervention.station !== undefined) {
        out.pushedStation = intervention.station;
        out.spendsToken = true;
      }
      break;
    case 'cutCourse':
      out.cutCourseId = intervention.courseId ?? null;
      break;
    // `swap` is expressed by the assignment the caller hands in; `deferRest`
    // by that assignment's `resting` list plus the weekPlan queue.
    case 'swap':
    case 'deferRest':
      break;
  }
  return out;
}

export function advanceEvening(
  state: GameState,
  opening: EveningOpening,
  decision: EveningDecision,
  rng: Rng,
): { state: GameState; result: ServiceResult } {
  const menu = resolveMenu(state);
  const resolved = resolveIntervention(decision.intervention, decision.assignment);
  // The push is only spent if a token is actually available.
  const pushes = resolved.spendsToken && state.pushTokens > 0;
  const pushedStation = pushes ? resolved.pushedStation : null;

  const setup: EveningSetup = {
    cooks: state.cooks,
    assignment: decision.assignment,
    menu,
    weekIndex: opening.weekIndex,
    eveningIndex: opening.eveningIndex,
    eveningInWeek: opening.eveningInWeek,
    reputation: state.reputation,
    seasonNumber: state.seasonNumber,
    pushedStation,
    scoldedStation: resolved.scoldedStation,
    premium: state.weekPlan.premiumIngredients,
    trialEvening: state.weekPlan.trialEveningsLeft > 0,
    cutCourseId: resolved.cutCourseId,
    inspected: opening.inspected,
    inspectedWave: opening.inspectedWave,
  };

  const { result, setups, defectsByStation } = runService(setup, rng);

  let cooks = applyEveningWear({
    cooks: state.cooks,
    setups,
    restingIds: decision.assignment.resting,
    pushedStation,
    extraWear: resolved.extraWear,
    defectsByStation,
  });

  const isLastEveningOfWeek = opening.eveningInWeek === C.season.eveningsPerWeek - 1;
  if (isLastEveningOfWeek) cooks = applyMondayRecovery(cooks);

  const visits: Visit[] = opening.inspected
    ? [
        ...state.visits,
        {
          eveningIndex: opening.eveningIndex,
          wave: opening.inspectedWave,
          plates: result.plates.filter((plate) => plate.wave === opening.inspectedWave),
          suspicionAtTime: opening.suspicion,
          pushedStation,
          confirmed: false,
        },
      ]
    : state.visits;

  const next: GameState = {
    ...state,
    rngState: rng.state(),
    cooks,
    assignment: decision.assignment,
    reputation: updateReputation(
      state.reputation,
      result.avgQ,
      result.bar,
      result.defects,
      result.starPlates,
    ),
    cash: state.cash + result.revenue - result.costs,
    pushTokens: pushes ? state.pushTokens - 1 : state.pushTokens,
    visits,
    history: [...state.history, result],
    weekPlan: {
      ...state.weekPlan,
      trialEveningsLeft: Math.max(0, state.weekPlan.trialEveningsLeft - 1),
    },
    eveningIndex: opening.eveningIndex + 1,
  };

  return { state: { ...next, stars: judge(next) }, result };
}

// ---------------------------------------------------------------------------
// The week and the verdict
// ---------------------------------------------------------------------------

export interface WeekChanges {
  menu?: readonly string[];
  premiumIngredients?: boolean;
  restTickets?: GameState['weekPlan']['restTickets'];
}

/**
 * Monday. A menu change costs two trial evenings at −1.0 quality (PRD §3.6); if
 * an inspection lands in them, that is the risk of revising.
 */
export function advanceWeek(state: GameState, changes: WeekChanges): GameState {
  const menuChanged = changes.menu !== undefined && changes.menu.join() !== state.menu.join();
  return {
    ...state,
    menu: changes.menu !== undefined ? [...changes.menu] : state.menu,
    weekPlan: {
      ...state.weekPlan,
      restTickets: changes.restTickets !== undefined ? [...changes.restTickets] : [],
      menuChangedThisWeek: menuChanged,
      trialEveningsLeft: menuChanged ? C.menu.trialEvenings : state.weekPlan.trialEveningsLeft,
      premiumIngredients: changes.premiumIngredients ?? state.weekPlan.premiumIngredients,
    },
  };
}

/**
 * ★  at most one of the 18 inspected plates below the bar.
 * ★★ none below the bar, and at least one star plate in every visit.
 * PRD §3.8 FR-12.
 */
export function judge(state: Pick<GameState, 'visits'>): 0 | 1 | 2 {
  const plates = state.visits.flatMap((visit) => visit.plates);
  const below = plates.filter((plate) => plate.outcome === 'defect').length;

  const everyVisitStarred =
    state.visits.length === C.inspector.visitsPerSeason &&
    state.visits.every(
      (visit) =>
        visit.plates.filter((plate) => plate.outcome === 'star').length >=
        C.inspector.starTwoMinStarPlatesPerVisit,
    );

  if (below <= C.inspector.starTwoMaxBelowBar && everyVisitStarred) return 2;
  if (below <= C.inspector.starOneMaxBelowBar) return 1;
  return 0;
}

export function isSeasonOver(state: GameState): boolean {
  return state.eveningIndex >= C.season.eveningsPerSeason || isBankrupt(state.cash);
}
