/**
 * The Zustand store — the only place the pure engine meets React, the clock and
 * localStorage (PRD §2.2, CLAUDE.md rule 1).
 *
 * Data flows one way:
 *   UI event → store action → engine.reduce(state, action, rng) → new state → render
 *                                        ↓
 *                                persistence.saveGame(state)
 *
 * The service result is computed and saved BEFORE the reveal starts, so closing
 * the tab mid-cascade loses nothing (CLAUDE.md rule 7, §9 case 6).
 */

import { create } from 'zustand';

import { C } from '../engine/constants';
import { createRng, generateSeed, normalizeSeed, seedToRngState } from '../engine/rng';
import {
  advanceEvening,
  advanceWeek,
  autoAssign,
  eveningInWeekOf,
  isSeasonOver,
  openEvening,
  resolveMenu,
  startSeason,
  weekIndexOf,
  type EveningOpening,
} from '../engine/season';
import { createStartingBrigade } from '../engine/draft';
import { computeBar } from '../engine/bar';
import { buildSetups } from '../engine/service';
import { computeHarmony, stationOdds, type EveningContext } from '../engine/plate';
import { formatNumber, formatPercent, setLang as setI18nLang, t } from '../i18n';
import * as persistence from './persistence';
import { STATIONS } from '../engine/types';
import type {
  Assignment,
  Cook,
  CookRole,
  Course,
  InterventionId,
  GameState,
  Intervention,
  Lang,
  RestTicket,
  ServiceResult,
  Station,
} from '../engine/types';

export type Screen =
  | 'onboarding'
  | 'monday'
  | 'pas'
  | 'service'
  | 'consequence'
  | 'menu'
  | 'calendar'
  | 'brigade'
  | 'cook'
  | 'verdict';

/** Why an interaction was refused. Shown inline; never a silent no-op (§3.1). */
export type RefusalKey =
  | 'refusal.thirdHelper'
  | 'refusal.helperTwice'
  | 'refusal.restPerEvening'
  | 'refusal.restPerWeek'
  | 'refusal.noTokens'
  | 'refusal.menuStations'
  | 'refusal.menuSize';

/** Where a cook can stand. Rest is a place like any other, never a gesture. */
export type Placement = Station | 'rest';

/**
 * A station is exactly one of three rows — PRD §3.1 FR-1a item 4. An occupied
 * station does not refuse, it offers a swap, and a swap never changes how many
 * leads or helpers exist, so the cap of two helpers can never block one. That is
 * what removes the dead rows: every station is always actionable.
 */
export type PlacementKind = 'lead' | 'helper' | 'swap' | 'rest';

export interface PlacementOption {
  target: Placement;
  kind: PlacementKind;
  current: boolean;
  /** For a swap: the cook who moves the other way, in the instrumental. */
  swapWith: Cook | null;
}

export function placementOf(
  assignment: Assignment,
  cookId: string,
): { target: Placement; role: CookRole | null } {
  for (const station of STATIONS) {
    if (assignment.leads[station] === cookId) return { target: station, role: 'lead' };
    if (assignment.helpers[station] === cookId) return { target: station, role: 'helper' };
  }
  return { target: 'rest', role: null };
}

/** Five rows, all live: the four stations and Volno. Nothing is ever disabled. */
export function placementOptions(
  assignment: Assignment,
  cooks: readonly Cook[],
  cookId: string,
): PlacementOption[] {
  const here = placementOf(assignment, cookId);
  const helperCount = STATIONS.filter(
    (station) => assignment.helpers[station] !== null && assignment.helpers[station] !== cookId,
  ).length;

  const options: PlacementOption[] = STATIONS.map((station) => {
    const lead = assignment.leads[station];
    const helper = assignment.helpers[station];
    const current = here.target === station;

    if (lead === null || lead === cookId) {
      return { target: station, kind: 'lead', current, swapWith: null };
    }
    if ((helper === null || helper === cookId) && helperCount < C.planning.maxHelpers) {
      return { target: station, kind: 'helper', current, swapWith: null };
    }
    // Both slots spoken for, or the helper cap is reached: trade places with the
    // lead. Counts stay identical, so this is always legal.
    return {
      target: station,
      kind: 'swap',
      current,
      swapWith: cooks.find((cook) => cook.id === lead) ?? null,
    };
  });

  options.push({ target: 'rest', kind: 'rest', current: here.target === 'rest', swapWith: null });
  return options;
}

// ---------------------------------------------------------------------------
// Interventions — PRD §3.5. One flow for all six: expand, name the targets,
// show the effect, confirm. A tap never both chooses and commits.
// ---------------------------------------------------------------------------

export interface InterventionTarget {
  /** What `Intervention` needs: a cook, a station or a course. */
  value: Intervention;
  /** Named, always — even when there is only one legal target. */
  label: string;
  /** The effect in units the player already reads off the screen. */
  effect: string;
  /** A second line, where the offer has a cost worth stating separately. */
  note?: string;
}

function eveningContextFor(
  game: GameState,
  menu: readonly Course[],
  weekIndex: number,
  pushedStation: Station | null,
): EveningContext {
  return {
    menu,
    harmony: computeHarmony(menu),
    weekIndex,
    eveningIndex: game.eveningIndex,
    pushedStation,
    scoldedStation: null,
    premium: game.weekPlan.premiumIngredients,
    trialEvening: game.weekPlan.trialEveningsLeft > 0,
    bar: computeBar(menu, weekIndex, game.reputation, game.seasonNumber),
  };
}

/**
 * The legal targets for one intervention, each named and each carrying its effect
 * in units the player already reads off the screen — PRD §3.5. Nothing picks its
 * own target: a screen that silently chooses for the player is not a decision.
 */
export function interventionTargets(
  id: InterventionId,
  game: GameState,
  draft: Assignment,
  menu: readonly Course[],
  weekIndex: number,
): InterventionTarget[] {
  const byId = new Map(game.cooks.map((cook) => [cook.id, cook]));
  const wearAfter = (cook: Cook, delta: number): string =>
    formatNumber(Math.max(C.wear.min, Math.min(C.wear.max, cook.wear + delta)), 1);
  const staffed = STATIONS.filter((station) => draft.leads[station] !== null);

  switch (id) {
    case 'praise':
      return game.cooks
        .filter((cook) => !draft.resting.includes(cook.id))
        .map((cook) => ({
          value: { id, cookId: cook.id },
          label: cook.lastName,
          effect: t('iv.effectPraise', {
            name: cook.lastName,
            from: formatNumber(cook.wear, 1),
            to: wearAfter(cook, C.intervention.praiseWear),
          }),
        }));

    case 'scold':
      return staffed.map((station) => {
        const lead = byId.get(draft.leads[station] ?? '');
        return {
          value: { id, station },
          label: t(`station.${station}`),
          effect: t('iv.effectScold', {
            station: t(`station.${station}`),
            q: formatNumber(C.intervention.scoldQuality, 1),
            name: lead?.lastName ?? '',
            from: lead === undefined ? '—' : formatNumber(lead.wear, 1),
            to: lead === undefined ? '—' : wearAfter(lead, C.intervention.scoldWear),
          }),
        };
      });

    case 'push': {
      const setups = buildSetups(game.cooks, draft, menu);
      return staffed.map((station) => {
        const before = stationOdds(
          station,
          setups[station],
          eveningContextFor(game, menu, weekIndex, null),
        );
        const after = stationOdds(
          station,
          setups[station],
          eveningContextFor(game, menu, weekIndex, station),
        );
        return {
          value: { id, station },
          label: t(`station.${station}`),
          // Both sides of the offer, always. PRD §3.5.
          effect: t('iv.effectPush', {
            station: t(`station.${station}`),
            starFrom: formatPercent(before.star),
            starTo: formatPercent(after.star),
            defectFrom: formatPercent(before.defect),
            defectTo: formatPercent(after.defect),
          }),
          note: t('iv.effectPushCost', { n: game.pushTokens - 1 }),
        };
      });
    }

    case 'cutCourse':
      return menu.map((course) => ({
        value: { id, courseId: course.id },
        label: t(course.nameKey),
        effect: t('iv.effectCut', { course: t(course.nameKey) }),
      }));

    case 'deferRest':
      return game.cooks
        .filter((cook) => draft.resting.includes(cook.id))
        .map((cook) => ({
          value: { id, cookId: cook.id },
          label: cook.lastName,
          effect: t('iv.effectDefer', { name: cook.lastName }),
        }));

    case 'swap':
      return game.cooks
        .filter((cook) => !draft.resting.includes(cook.id))
        .map((cook) => {
          const station = placementOf(draft, cook.id).target;
          return {
            value: { id, cookId: cook.id },
            label: cook.lastName,
            effect: t('iv.effectSwap', {
              name: cook.lastName,
              station: station === 'rest' ? t('pas.resting') : t(`station.${station}`),
            }),
          };
        });
  }
}

interface Store {
  screen: Screen;
  game: GameState | null;
  opening: EveningOpening | null;
  lastResult: ServiceResult | null;
  /** The assignment the player is editing, before service starts. */
  draft: Assignment;
  intervention: Intervention | null;
  /** Which intervention is expanded. Expanding is not choosing (§3.5 step 1). */
  interventionOpen: InterventionId | null;
  /** A named target the player has picked but not yet confirmed (§3.5 step 3). */
  interventionPick: Intervention | null;
  /** Which cook row has its picker open. There is no invisible selection. */
  expandedCookId: string | null;
  focusCookId: string | null;
  refusal: RefusalKey | null;
  lang: Lang;
  reducedMotion: boolean;
  storageBroken: boolean;

  boot: () => void;
  newGame: (venueName: string, seed?: string) => void;
  goto: (screen: Screen) => void;
  dismissRefusal: () => void;
  setLang: (lang: Lang) => void;

  expandCook: (cookId: string | null) => void;
  placeCook: (cookId: string, target: Placement) => void;
  openCookCard: (cookId: string) => void;

  openIntervention: (id: InterventionId | null) => void;
  pickInterventionTarget: (target: Intervention | null) => void;
  confirmIntervention: () => void;
  clearIntervention: () => void;
  startService: () => void;
  finishReveal: () => void;
  nextEvening: () => void;

  toggleRestTicket: (cookId: string, eveningInWeek: number) => void;
  setMenu: (courseIds: readonly string[]) => void;
  togglePremium: () => void;
  lockKitchen: () => void;
}

function persist(game: GameState | null): void {
  persistence.saveGame(game);
}

/**
 * Opens the next evening.
 *
 * `openEvening` draws the wave and the signals, so it ADVANCES the RNG. What gets
 * persisted is therefore always the state as it stood *before* the opening, never
 * after: the opening is deterministic given that state, so a reload replays it and
 * lands on exactly the same evening with exactly the same signals. Saving the
 * opened state instead made `boot()` roll a second opening on top of the first,
 * and a reloaded season silently diverged from the one that was saved.
 */
function open(game: GameState): { game: GameState; opening: EveningOpening; draft: Assignment } {
  const rng = createRng(game.rngState);
  const { state, opening } = openEvening(game, rng);
  const resting = state.weekPlan.restTickets
    .filter((ticket) => ticket.eveningIndex === opening.eveningInWeek)
    .map((ticket) => ticket.cookId);
  return { game: state, opening, draft: autoAssign(state.cooks, resting) };
}

/** Save the pre-opening state, then open. The only correct order — see `open`. */
function openAndPersist(game: GameState): {
  game: GameState;
  opening: EveningOpening;
  draft: Assignment;
} {
  persist(game);
  return open(game);
}

const EMPTY_DRAFT: Assignment = {
  leads: { cold: null, fire: null, sauce: null, dessert: null },
  helpers: { cold: null, fire: null, sauce: null, dessert: null },
  resting: [],
};

export const useGame = create<Store>((set, get) => ({
  screen: 'onboarding',
  game: null,
  opening: null,
  lastResult: null,
  draft: EMPTY_DRAFT,
  intervention: null,
  interventionOpen: null,
  interventionPick: null,
  expandedCookId: null,
  focusCookId: null,
  refusal: null,
  lang: 'cs',
  reducedMotion: false,
  storageBroken: false,

  boot: () => {
    const prefs = persistence.loadPrefs();
    setI18nLang(prefs.lang);
    const storageBroken = !persistence.isStorageAvailable();
    const saved = persistence.loadGame();

    if (saved === null) {
      set({
        screen: 'onboarding',
        lang: prefs.lang,
        reducedMotion: prefs.reducedMotion,
        storageBroken,
      });
      return;
    }
    if (isSeasonOver(saved)) {
      set({
        screen: 'verdict',
        game: saved,
        lang: prefs.lang,
        reducedMotion: prefs.reducedMotion,
        storageBroken,
      });
      return;
    }
    // A reload lands on the pas of the evening that was never played, with the
    // RNG exactly where the last autosave left it.
    const opened = open(saved);
    set({
      screen: 'pas',
      game: opened.game,
      opening: opened.opening,
      draft: opened.draft,
      lang: prefs.lang,
      reducedMotion: prefs.reducedMotion,
      storageBroken,
    });
  },

  newGame: (venueName, seed) => {
    const normalized = seed === undefined ? null : normalizeSeed(seed);
    // The clock is entropy, and it lives here rather than in the engine.
    const chosen = normalized ?? generateSeed(createRng(seedToRngState(String(Date.now()))));
    const fresh = startSeason({
      seed: chosen,
      seasonNumber: 1,
      venueName: venueName.trim(),
      lang: get().lang,
      cooks: createStartingBrigade(),
    });
    const opened = openAndPersist(fresh);
    set({
      screen: 'pas',
      game: opened.game,
      opening: opened.opening,
      draft: opened.draft,
      lastResult: null,
      intervention: null,
      interventionOpen: null,
      interventionPick: null,
      expandedCookId: null,
      refusal: null,
    });
  },

  goto: (screen) => set({ screen, refusal: null }),
  dismissRefusal: () => set({ refusal: null }),

  setLang: (lang) => {
    setI18nLang(lang);
    persistence.savePrefs({ ...persistence.loadPrefs(), lang });
    const game = get().game;
    // Switching language never touches game state. PRD §9 case 16.
    if (game !== null) {
      const next = { ...game, lang };
      persist(next);
      set({ lang, game: next });
    } else {
      set({ lang });
    }
  },

  expandCook: (cookId) => set({ expandedCookId: cookId, refusal: null }),
  openCookCard: (cookId) => set({ focusCookId: cookId, screen: 'cook' }),

  /**
   * Move a cook. The picker only offers legal targets, so this should never
   * refuse — but if it ever does, it says why rather than doing nothing.
   */
  placeCook: (cookId, target) => {
    const { draft, game } = get();
    if (game === null) return;

    const from = placementOf(draft, cookId);
    const leads = { ...draft.leads };
    const helpers = { ...draft.helpers };
    let resting = draft.resting.filter((id) => id !== cookId);

    // Who is standing where, captured before anything moves.
    const displacedLead = target === 'rest' ? null : leads[target];
    const helperCount = STATIONS.filter(
      (station) => helpers[station] !== null && helpers[station] !== cookId,
    ).length;

    const clear = (id: string): void => {
      for (const station of STATIONS) {
        if (leads[station] === id) leads[station] = null;
        if (helpers[station] === id) helpers[station] = null;
      }
    };
    clear(cookId);

    if (target === 'rest') {
      resting = [...resting, cookId];
    } else if (displacedLead === null || displacedLead === cookId) {
      leads[target] = cookId;
    } else if (
      (helpers[target] === null || helpers[target] === cookId) &&
      helperCount < C.planning.maxHelpers
    ) {
      helpers[target] = cookId;
    } else {
      // Swap: the lead takes whatever this cook was doing, including nothing.
      clear(displacedLead);
      leads[target] = cookId;
      resting = resting.filter((id) => id !== displacedLead);
      if (from.target === 'rest') resting = [...resting, displacedLead];
      else if (from.role === 'lead') leads[from.target] = displacedLead;
      else helpers[from.target] = displacedLead;
    }

    set({ draft: { leads, helpers, resting }, expandedCookId: null, refusal: null });
  },

  openIntervention: (id) => {
    const game = get().game;
    // A push with no token left is the one genuinely impossible case.
    if (id === 'push' && game !== null && game.pushTokens <= 0) {
      set({ refusal: 'refusal.noTokens', interventionOpen: null, interventionPick: null });
      return;
    }
    set({ interventionOpen: id, interventionPick: null, refusal: null });
  },

  /** Choosing a target shows its effect. It does not commit. */
  pickInterventionTarget: (target) => set({ interventionPick: target, refusal: null }),

  /** The second tap. */
  confirmIntervention: () => {
    const pick = get().interventionPick;
    if (pick === null) return;
    set({ intervention: pick, interventionOpen: null, interventionPick: null, refusal: null });
  },

  /** Tapping away cancels without losing the intervention already confirmed. */
  clearIntervention: () =>
    set({ intervention: null, interventionOpen: null, interventionPick: null, refusal: null }),

  startService: () => {
    const { game, opening, draft, intervention } = get();
    if (game === null || opening === null) return;

    const rng = createRng(game.rngState);
    const { state, result } = advanceEvening(
      game,
      opening,
      { assignment: draft, intervention },
      rng,
    );
    // Persisted before a single pixel moves. CLAUDE.md rule 7.
    persist(state);
    set({
      game: state,
      lastResult: result,
      screen: 'service',
      opening: null,
      intervention: null,
      interventionOpen: null,
      interventionPick: null,
      expandedCookId: null,
    });
  },

  finishReveal: () => set({ screen: 'consequence' }),

  nextEvening: () => {
    const game = get().game;
    if (game === null) return;

    if (isSeasonOver(game)) {
      set({ screen: 'verdict' });
      return;
    }
    // Monday is a planning screen, and week 1 has it locked. PRD §3.2
    const isMonday = eveningInWeekOf(game.eveningIndex) === 0;
    if (isMonday && weekIndexOf(game.eveningIndex) >= C.season.planningUnlocksAtWeekIndex) {
      // No opening is live on a Monday, which is what lets the planning screen
      // persist its edits directly.
      set({ screen: 'monday', opening: null, refusal: null });
      return;
    }
    const opened = openAndPersist(game);
    set({ screen: 'pas', game: opened.game, opening: opened.opening, draft: opened.draft });
  },

  toggleRestTicket: (cookId, eveningInWeek) => {
    const game = get().game;
    if (game === null) return;
    const tickets = game.weekPlan.restTickets;
    const existing = tickets.find((t) => t.cookId === cookId && t.eveningIndex === eveningInWeek);

    let next: RestTicket[];
    if (existing !== undefined) {
      next = tickets.filter((t) => t !== existing);
    } else {
      if (tickets.some((t) => t.cookId === cookId && t.eveningIndex === eveningInWeek)) return;
      const perWeek = tickets.filter((t) => t.cookId === cookId).length;
      if (perWeek >= C.planning.maxTicketsPerCookPerWeek) {
        set({ refusal: 'refusal.restPerWeek' });
        return;
      }
      if (tickets.length >= C.planning.restTicketsPerWeek) return;
      next = [...tickets, { cookId, eveningIndex: eveningInWeek }];
    }
    const updated = { ...game, weekPlan: { ...game.weekPlan, restTickets: next } };
    if (get().opening === null) persist(updated);
    set({ game: updated, refusal: null });
  },

  setMenu: (courseIds) => {
    const game = get().game;
    if (game === null) return;
    // Menu changes are a Monday decision (§3.6), and Monday is the only moment
    // with no opening in flight.
    if (get().opening !== null) return;
    if (courseIds.length !== C.menu.courses) {
      set({ refusal: 'refusal.menuSize' });
      return;
    }
    const byId = new Map(game.catalogue.map((course) => [course.id, course]));
    const stations = new Set(courseIds.map((id) => byId.get(id)?.station));
    // At least one course per station. PRD §3.6
    if (stations.size < C.season.stationCount) {
      set({ refusal: 'refusal.menuStations' });
      return;
    }
    const updated = { ...game, menu: [...courseIds] };
    persist(updated);
    set({ game: updated, refusal: null });
  },

  togglePremium: () => {
    const game = get().game;
    if (game === null) return;
    const updated = {
      ...game,
      weekPlan: { ...game.weekPlan, premiumIngredients: !game.weekPlan.premiumIngredients },
    };
    if (get().opening === null) persist(updated);
    set({ game: updated });
  },

  lockKitchen: () => {
    const game = get().game;
    if (game === null) return;
    // A menu change costs two trial evenings; advanceWeek prices it.
    const locked = advanceWeek(game, {
      menu: game.menu,
      premiumIngredients: game.weekPlan.premiumIngredients,
      restTickets: game.weekPlan.restTickets,
    });
    const opened = openAndPersist(locked);
    set({ screen: 'pas', game: opened.game, opening: opened.opening, draft: opened.draft });
  },
}));

/** The menu as courses, in service order. Throws only on a corrupt save. */
export function currentMenu(game: GameState) {
  return resolveMenu(game);
}
