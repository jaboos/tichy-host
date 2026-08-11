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
import { setLang as setI18nLang } from '../i18n';
import * as persistence from './persistence';
import type {
  Assignment,
  CookRole,
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

interface Store {
  screen: Screen;
  game: GameState | null;
  opening: EveningOpening | null;
  lastResult: ServiceResult | null;
  /** The assignment the player is editing, before service starts. */
  draft: Assignment;
  intervention: Intervention | null;
  selectedCookId: string | null;
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

  selectCook: (cookId: string | null) => void;
  placeSelected: (station: Station, role: CookRole) => void;
  clearSlot: (station: Station, role: CookRole) => void;
  openCookCard: (cookId: string) => void;

  setIntervention: (intervention: Intervention | null) => void;
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
  selectedCookId: null,
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
      selectedCookId: null,
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

  selectCook: (cookId) => set({ selectedCookId: cookId, refusal: null }),
  openCookCard: (cookId) => set({ focusCookId: cookId, screen: 'cook' }),

  placeSelected: (station, role) => {
    const { selectedCookId, draft } = get();
    if (selectedCookId === null) return;
    if (draft.resting.includes(selectedCookId)) return;

    const leads = { ...draft.leads };
    const helpers = { ...draft.helpers };

    if (role === 'helper') {
      const alreadyElsewhere = Object.entries(helpers).some(
        ([key, id]) => id === selectedCookId && key !== station,
      );
      const occupiedCount = Object.values(helpers).filter(
        (id) => id !== null && id !== selectedCookId,
      ).length;
      // At most two helpers in the brigade, one per station. PRD §9 case 4.
      if (helpers[station] === null && occupiedCount >= C.planning.maxHelpers) {
        set({ refusal: 'refusal.thirdHelper' });
        return;
      }
      if (alreadyElsewhere) {
        set({ refusal: 'refusal.helperTwice' });
        return;
      }
    }

    // A cook stands in exactly one place.
    for (const key of Object.keys(leads) as Station[]) {
      if (leads[key] === selectedCookId) leads[key] = null;
      if (helpers[key] === selectedCookId) helpers[key] = null;
    }
    if (role === 'lead') leads[station] = selectedCookId;
    else helpers[station] = selectedCookId;

    set({ draft: { ...draft, leads, helpers }, selectedCookId: null, refusal: null });
  },

  clearSlot: (station, role) => {
    const { draft } = get();
    if (role === 'lead') set({ draft: { ...draft, leads: { ...draft.leads, [station]: null } } });
    else set({ draft: { ...draft, helpers: { ...draft.helpers, [station]: null } } });
  },

  setIntervention: (intervention) => {
    const game = get().game;
    if (intervention?.id === 'push' && game !== null && game.pushTokens <= 0) {
      set({ refusal: 'refusal.noTokens' });
      return;
    }
    set({ intervention, refusal: null });
  },

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
      selectedCookId: null,
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
