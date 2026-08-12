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
import type { NarratorLine } from '../engine/narrator';
import {
  buildStationSetup,
  computeHarmony,
  effectiveHand,
  stationOdds,
  type EveningContext,
} from '../engine/plate';
import { formatNumber, formatPercent, setLang as setI18nLang, t, type TKey } from '../i18n';
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
  /** Sunday, and only when a visit is waiting to be confirmed. PRD FR-11 */
  | 'report'
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
 * The assignment is STATION-FIRST — PRD §3.1 FR-1a as amended.
 *
 * The decision the player is actually making is "who cooks this station", not
 * "where does this person go", and the numbers that decide it live on the station
 * card. So the card is the control: tapping one of its two places opens the list
 * of people who could stand there, each with the consequence already worked out.
 */
export interface SlotRef {
  station: Station;
  role: CookRole;
}

export function slotEquals(a: SlotRef | null, b: SlotRef | null): boolean {
  return a !== null && b !== null && a.station === b.station && a.role === b.role;
}

function occupantOf(assignment: Assignment, slot: SlotRef): string | null {
  return slot.role === 'lead' ? assignment.leads[slot.station] : assignment.helpers[slot.station];
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

/**
 * Puts `cookId` (or nobody) into `slot`, purely.
 *
 * Whoever was standing there takes the incoming cook's old place — station,
 * helper slot or Volno alike — so an exchange never changes how many leads or
 * helpers exist and the cap of two helpers can never block one. Moving somebody
 * out of a station that has nobody else leaves a hole; that is allowed, and the
 * picker says so in red before the tap rather than refusing it.
 */
export function applyToSlot(
  assignment: Assignment,
  slot: SlotRef,
  cookId: string | null,
): Assignment {
  const leads = { ...assignment.leads };
  const helpers = { ...assignment.helpers };
  let resting = [...assignment.resting];

  const occupant = occupantOf(assignment, slot);
  const from = cookId === null ? null : placementOf(assignment, cookId);

  const clear = (id: string): void => {
    for (const station of STATIONS) {
      if (leads[station] === id) leads[station] = null;
      if (helpers[station] === id) helpers[station] = null;
    }
    resting = resting.filter((x) => x !== id);
  };

  if (occupant !== null) clear(occupant);
  if (cookId !== null) clear(cookId);

  if (cookId !== null) {
    if (slot.role === 'lead') leads[slot.station] = cookId;
    else helpers[slot.station] = cookId;
  }

  // The displaced cook inherits the incoming one's old place.
  if (occupant !== null && occupant !== cookId) {
    if (from === null || from.target === 'rest') resting = [...resting, occupant];
    else if (from.role === 'lead') leads[from.target] = occupant;
    else helpers[from.target] = occupant;
  }

  const placed = new Set<string>();
  for (const station of STATIONS) {
    const lead = leads[station];
    const helper = helpers[station];
    if (lead !== null) placed.add(lead);
    if (helper !== null) placed.add(helper);
  }
  return { leads, helpers, resting: resting.filter((id) => !placed.has(id)) };
}

export interface SlotCandidate {
  cook: Cook;
  /** Effective hand AT THIS STATION, the ±1 already applied. */
  effHand: number;
  current: boolean;
  /** Where they stand now, or null when resting. */
  fromStation: Station | null;
  /** This station's load as a percentage of capacity, before and after. */
  percentBefore: number;
  percentAfter: number;
  /** The station they would leave without a lead. Null when nothing is emptied. */
  emptiedStation: Station | null;
}

function loadPercent(setup: ReturnType<typeof buildStationSetup>): number {
  return setup.capacity > 0 ? Math.round((setup.load / setup.capacity) * 100) : 0;
}

/** Everyone who could stand in this slot, each with the consequence worked out. */
export function slotCandidates(
  game: GameState,
  draft: Assignment,
  menu: readonly Course[],
  slot: SlotRef,
): SlotCandidate[] {
  const byId = new Map(game.cooks.map((cook) => [cook.id, cook]));
  const setupFor = (assignment: Assignment, station: Station) =>
    buildStationSetup(
      station,
      menu,
      byId.get(assignment.leads[station] ?? '') ?? null,
      byId.get(assignment.helpers[station] ?? '') ?? null,
    );

  const percentBefore = loadPercent(setupFor(draft, slot.station));

  return game.cooks.map((cook) => {
    const next = applyToSlot(draft, slot, cook.id);
    const from = placementOf(draft, cook.id);
    const fromStation = from.target === 'rest' ? null : from.target;

    // Which station does this move leave without a lead? Scanning every station
    // rather than just the one the cook came from, because moving a station's own
    // lead down into its helper place empties it too — and that reads as a
    // survivable capacity change unless it is called out.
    const emptied =
      STATIONS.find(
        (station) =>
          next.leads[station] === null &&
          draft.leads[station] !== null &&
          menu.some((course) => course.station === station),
      ) ?? null;

    return {
      cook,
      effHand: effectiveHand(cook, slot.station),
      current: occupantOf(draft, slot) === cook.id,
      fromStation,
      percentBefore,
      percentAfter: loadPercent(setupFor(next, slot.station)),
      emptiedStation: emptied,
    };
  });
}

/**
 * One line saying whether tonight's plan is sound. PRD §11.5: the number is
 * immediate, the story is a tap away — but a screen full of numbers and no verdict
 * makes the player do arithmetic the game has already done.
 *
 * It reports the WORST thing it can find, in that order, because a station with no
 * hands does not become less urgent just because another one is also overloaded.
 */
export interface EveningVerdict {
  key: TKey;
  params: Record<string, string | number>;
  tone: 'bad' | 'warn' | 'ok';
}

/**
 * The narrator's lines for one evening, in the player's language.
 *
 * The engine returns template ids and the ids of who and what they are about; this
 * is where those become names. It lives in the store rather than in the engine
 * because `t()` and the current language are the store's business — the engine
 * stays language-free, which is what stops a bilingual game from growing two
 * narrators that drift apart.
 */
export function narratorText(game: GameState, result: ServiceResult): string[] {
  const cooks = new Map(game.cooks.map((cook) => [cook.id, cook]));
  const courses = new Map(game.catalogue.map((course) => [course.id, course]));

  return (result.lines ?? []).map((line: NarratorLine) => {
    const course = line.courseId === null ? null : courses.get(line.courseId);
    const params: Record<string, string | number> = {
      ...Object.fromEntries(
        Object.entries(line.numbers).map(([key, value]) => [key, formatNumber(value, 1)]),
      ),
      station: line.station === null ? '' : t(`station.${line.station}`),
      // The locative, preposition included: "na Ohni", not "na Oheň". A template
      // that needs a case other than the nominative uses this and writes no
      // preposition of its own.
      stationAt: line.station === null ? '' : t(`station.${line.station}.at`),
      cook: line.cookId === null ? '' : (cooks.get(line.cookId)?.lastName ?? ''),
      course: course === undefined || course === null ? '' : t(course.nameKey),
    };
    return t(`narrator.${line.templateId}` as TKey, params);
  });
}

export function eveningVerdict(
  game: GameState,
  draft: Assignment,
  menu: readonly Course[],
  suspicion: number,
  intervention: Intervention | null,
): EveningVerdict {
  const setups = buildSetups(game.cooks, draft, menu);
  const carries = (station: Station): boolean => menu.some((course) => course.station === station);

  const blind = STATIONS.find((station) => carries(station) && !setups[station].viable);
  if (blind !== undefined) {
    return { key: 'verdictLine.noHands', params: { station: t(`station.${blind}`) }, tone: 'bad' };
  }

  const strained = STATIONS.find((station) => setups[station].overload > 0);
  if (strained !== undefined) {
    return {
      key: 'verdictLine.overloaded',
      params: { station: t(`station.${strained}`) },
      tone: 'bad',
    };
  }

  if (game.weekPlan.trialEveningsLeft > 0) {
    return { key: 'verdictLine.trial', params: {}, tone: 'warn' };
  }

  // Exposed: the evening smells of a visit and nothing was held back for it.
  const held = draft.resting.length > 0 || intervention?.id === 'push';
  if (suspicion >= C.inspector.highSuspicion && !held) {
    return {
      key: 'verdictLine.exposed',
      params: { suspicion: formatPercent(suspicion) },
      tone: 'warn',
    };
  }

  const worn = game.cooks.filter(
    (cook) => cook.wear >= C.wear.warningThreshold && !draft.resting.includes(cook.id),
  );
  if (worn.length > 0) {
    return {
      key: 'verdictLine.worn',
      params: { names: worn.map((cook) => cook.lastName).join(', ') },
      tone: 'warn',
    };
  }

  return { key: 'verdictLine.clear', params: {}, tone: 'ok' };
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
  /** Which place on which station has its picker open. Never invisible. */
  openSlot: SlotRef | null;
  focusCookId: string | null;
  refusal: RefusalKey | null;
  lang: Lang;
  reducedMotion: boolean;
  /** Chosen on the Pas, before the evening runs — not a control inside the cascade. */
  skipReveal: boolean;
  storageBroken: boolean;

  boot: () => void;
  newGame: (venueName: string, seed?: string) => void;
  /** Season n+1 of the same career: the same brigade, one season older. */
  nextSeason: () => void;
  /** Throws the save away and returns to onboarding. */
  startOver: () => void;
  goto: (screen: Screen) => void;
  dismissRefusal: () => void;
  setLang: (lang: Lang) => void;

  openSlotPicker: (slot: SlotRef | null) => void;
  /** `null` empties the place. Removal is a named option, never a gesture. */
  assignToSlot: (slot: SlotRef, cookId: string | null) => void;
  openCookCard: (cookId: string) => void;

  openIntervention: (id: InterventionId | null) => void;
  pickInterventionTarget: (target: Intervention | null) => void;
  confirmIntervention: () => void;
  clearIntervention: () => void;
  /** `true` jumps straight to the finished board; the reveal is only a replay. */
  startService: (skipReveal?: boolean) => void;
  finishReveal: () => void;
  nextEvening: () => void;
  /** Marks the visits shown on the report card as confirmed and moves on. */
  acknowledgeReport: () => void;

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
  openSlot: null,
  focusCookId: null,
  refusal: null,
  lang: 'cs',
  reducedMotion: false,
  skipReveal: false,
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
      openSlot: null,
      refusal: null,
    });
  },

  /**
   * The career, PRD §3.8. It carries exactly what `measureCareer` in the harness
   * carries, because that is the run the frozen ladder was measured over: the
   * brigade with whatever it grew into, the season number, and nothing else.
   * Reputation, cash and the catalogue start over — the bar already charges for
   * the season through `C.bar.seasonCoef`, and carrying reputation too would
   * charge twice.
   *
   * Until now `newGame` hardcoded season 1 and there was no other way in, so the
   * three-season career the golden test measures could not be played at all.
   */
  nextSeason: () => {
    const game = get().game;
    if (game === null) return;
    const next = game.seasonNumber + 1;
    if (next > C.season.seasonsPerCareer) {
      get().startOver();
      return;
    }
    const seed = generateSeed(createRng(seedToRngState(String(Date.now()))));
    const fresh = startSeason({
      seed,
      seasonNumber: next as 1 | 2 | 3,
      venueName: game.venueName,
      lang: get().lang,
      cooks: game.cooks,
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
      openSlot: null,
      refusal: null,
    });
  },

  /**
   * The save has to go, not just the screen. Sending the player to onboarding and
   * leaving the finished season on disk meant one reload put them back on the
   * verdict letter with no way out.
   */
  startOver: () => {
    persist(null);
    set({
      screen: 'onboarding',
      game: null,
      opening: null,
      lastResult: null,
      intervention: null,
      interventionOpen: null,
      interventionPick: null,
      openSlot: null,
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

  openSlotPicker: (slot) => set({ openSlot: slot, refusal: null }),
  openCookCard: (cookId) => set({ focusCookId: cookId, screen: 'cook' }),

  assignToSlot: (slot, cookId) => {
    set({ draft: applyToSlot(get().draft, slot, cookId), openSlot: null, refusal: null });
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

  startService: (skipReveal = false) => {
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
      skipReveal,
      opening: null,
      intervention: null,
      interventionOpen: null,
      interventionPick: null,
      openSlot: null,
    });
  },

  finishReveal: () => set({ screen: 'consequence' }),

  nextEvening: () => {
    const game = get().game;
    if (game === null) return;

    // Sunday, before anything else: a visit is confirmed by the end of the same
    // week (FR-11). Without this the learning loop for the only outcome that
    // matters is forty evenings long — a whole season of play produced one
    // recorded visit that the player was never told about.
    const isMonday = eveningInWeekOf(game.eveningIndex) === 0;
    if (isMonday && game.visits.some((visit) => !visit.confirmed)) {
      set({ screen: 'report', opening: null, refusal: null });
      return;
    }

    if (isSeasonOver(game)) {
      set({ screen: 'verdict' });
      return;
    }
    // Monday is a planning screen, and week 1 has it locked. PRD §3.2
    if (isMonday && weekIndexOf(game.eveningIndex) >= C.season.planningUnlocksAtWeekIndex) {
      // No opening is live on a Monday, which is what lets the planning screen
      // persist its edits directly.
      set({ screen: 'monday', opening: null, refusal: null });
      return;
    }
    const opened = openAndPersist(game);
    set({ screen: 'pas', game: opened.game, opening: opened.opening, draft: opened.draft });
  },

  /**
   * The player has read the report card. The visit is marked confirmed so it is
   * never shown twice, and the same routing that sent them here decides where
   * they go — the last visit of the season lands on the letter, not on a Monday.
   */
  acknowledgeReport: () => {
    const game = get().game;
    if (game === null) return;
    const confirmed: GameState = {
      ...game,
      visits: game.visits.map((visit) => ({ ...visit, confirmed: true })),
    };
    persist(confirmed);
    set({ game: confirmed });
    get().nextEvening();
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
