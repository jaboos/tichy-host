/**
 * Every game type. PRD §4.
 *
 * The whole of `GameState` is one serialisable object — no classes, no functions,
 * no Dates. That is what lets a season round-trip through `localStorage` and be
 * replayed from a seed.
 */

import type { TKey } from '../i18n';

// ---------------------------------------------------------------------------
// Scalars — PRD §4.1
// ---------------------------------------------------------------------------

export type Station = 'cold' | 'fire' | 'sauce' | 'dessert';
export type Flavour = 'earthy' | 'sour' | 'meaty' | 'dairy' | 'sweet';
/** Fatigue coefficient label: 0.30 · 0.40 · 0.50. See `C.endurance`. */
export type Endurance = 'lasts' | 'normal' | 'burns';
export type Lang = 'cs' | 'en';

/** 0 = 18:30 (weight 0.7), 1 = 20:30 (weight 1.3). */
export type WaveIndex = 0 | 1;
export type PlateOutcome = 'defect' | 'passed' | 'star';
export type CookRole = 'lead' | 'helper';

export const STATIONS: readonly Station[] = ['cold', 'fire', 'sauce', 'dessert'];
export const FLAVOURS: readonly Flavour[] = ['earthy', 'sour', 'meaty', 'dairy', 'sweet'];

// ---------------------------------------------------------------------------
// Cooks — PRD §4.1
// ---------------------------------------------------------------------------

/** A cook's two-step personal arc. PRD §4.1, §6.5 slot 3. */
export interface Desire {
  step: 0 | 1 | 2;
  /** e.g. 2 of 3. */
  progress: number;
  target: number;
  rewardTraitId: string | null;
  /** Two refusals bring an offer from elsewhere. */
  refusals: number;
}

export interface Cook {
  id: string;
  firstName: string;
  /** Nominative. Czech surnames also carry an accusative for narrator templates. */
  lastName: string;
  lastNameAcc: string;
  age: number;
  /** 1–5. The only skill number in the game. */
  hand: number;
  homeStation: Station;
  endurance: Endurance;
  traitId: string;
  /** 0–10, one decimal. */
  wear: number;
  cleanEvenings: number;
  /**
   * The next clean-evening target. The Učednice trait halves it at comparison
   * time (`Trait.growthThresholdMultiplier`) so this stays one of 14 | 30 | 60.
   */
  growthThreshold: 14 | 30 | 60;
  desire: Desire;
  /** i18n key. One sentence, shown on the cook card. */
  paradox: TKey;
}

/**
 * The static half of a cook — what the draft pool holds. PRD §3.9.
 * Runtime fields (wear, cleanEvenings, growthThreshold, desire) are added when a
 * cook is instantiated into a brigade.
 */
export interface CookArchetype {
  id: string;
  firstName: string;
  lastName: string;
  lastNameAcc: string;
  age: number;
  hand: number;
  homeStation: Station;
  endurance: Endurance;
  traitId: string;
  paradox: TKey;
  /** How many times the desire has to be satisfied to complete step 1. */
  desireTarget: number;
  /** The trait earned by completing step 1, or null if the arc gives none. */
  desireRewardTraitId: string | null;
  /** Member of the curated first-run brigade. PRD §4.2. */
  isStarter: boolean;
}

// ---------------------------------------------------------------------------
// Courses and traits — PRD §4.1
// ---------------------------------------------------------------------------

export interface Course {
  id: string;
  nameKey: TKey;
  station: Station;
  /** 1–5. Drives load, crowding, the overreach penalty and the noise width. */
  difficulty: number;
  /** 0–7. Offsets the seasonality sine. */
  seasonPhase: number;
  flavour: Flavour;
  /** Reserved for the Layer-2 signature-dish naming. Unused in MVP. */
  isSignature: boolean;
}

/**
 * Everything a trait can see when it modifies a plate. Assembled by `plate.ts`
 * once per course × wave × role.
 */
export interface PlateContext {
  readonly course: Course;
  /** Position in the menu, 0–5. Used by traits that care about service order. */
  readonly courseIndex: number;
  readonly menu: readonly Course[];
  readonly station: Station;
  /** Which cook this trait belongs to, and in what capacity. */
  readonly role: CookRole;
  readonly cook: Cook;
  readonly lead: Cook | null;
  readonly helper: Cook | null;
  readonly effHandLead: number;
  readonly effHandHelper: number;
  readonly wave: WaveIndex;
  readonly waveWeight: number;
  /** 0-based. */
  readonly weekIndex: number;
  /** 0–39. */
  readonly eveningIndex: number;
  readonly stationLoad: number;
  readonly capacity: number;
  readonly overload: number;
  readonly crowding: number;
  readonly pushed: boolean;
  readonly premium: boolean;
  readonly bar: number;
}

/**
 * A trait changes a rule, not a stat (v4 §5).
 *
 * NOTE — deviation from PRD §4.1, which declares only `apply`. Two of the six
 * canonical traits in §4.2 cannot be expressed as a post-hoc quality delta:
 * *Klidná ruka* scales the noise before it is added, and *Učednice* touches the
 * growth thresholds and never the plate at all. Both extra hooks are optional, so
 * the §4.1 shape still validates.
 */
export interface Trait {
  id: string;
  nameKey: TKey;
  descKey: TKey;
  /** Pure quality modifier, applied inside computePlateQuality. */
  apply?: (ctx: PlateContext, q: number) => number;
  /** Multiplies the plate noise — the only output randomness. Lead only. */
  varianceMultiplier?: (ctx: PlateContext) => number;
  /** Scales the 14 / 30 / 60 growth thresholds. Učednice = 0.5. */
  growthThresholdMultiplier?: number;
}

// ---------------------------------------------------------------------------
// Assignment and the week — PRD §4.1
// ---------------------------------------------------------------------------

export interface Assignment {
  leads: Record<Station, string | null>;
  /** At most 2 non-null overall, at most 1 per station. PRD §3.1 edge case. */
  helpers: Record<Station, string | null>;
  resting: string[];
}

export interface RestTicket {
  cookId: string;
  /** 0–4 = Tue…Sat. */
  eveningIndex: number;
}

export interface WeekPlan {
  /** Six a week. PRD §3.2 */
  restTickets: RestTicket[];
  /** Queue from the `deferRest` intervention, cap 2. */
  deferredRest: string[];
  menuChangedThisWeek: boolean;
  /** 0–2 remaining trial evenings, each at `C.plate.trialEveningPenalty`. */
  trialEveningsLeft: number;
  premiumIngredients: boolean;
}

// ---------------------------------------------------------------------------
// Interventions — PRD §3.5
// ---------------------------------------------------------------------------

export type InterventionId = 'praise' | 'scold' | 'swap' | 'cutCourse' | 'deferRest' | 'push';

/** Exactly one per evening, or none. The target depends on the id. */
export interface Intervention {
  id: InterventionId;
  /** `praise`, `deferRest`, `swap` (the cook being moved). */
  cookId?: string;
  /** `scold`, `push`, `swap` (the destination). */
  station?: Station;
  /** `cutCourse`. */
  courseId?: string;
}

// ---------------------------------------------------------------------------
// Inspector — PRD §4.1, §3.8
// ---------------------------------------------------------------------------

export interface Signal {
  id: string;
  /** Likelihood ratio. 1.0 means the signal carries no information. */
  lr: number;
  present: boolean;
}

/** A signal as it lives in `data/signals.ts`, before it is drawn for an evening. */
export interface SignalDefinition {
  id: string;
  textKey: TKey;
  lr: number;
  /** False for the decoys, whose LR is exactly 1.0. */
  correlates: boolean;
}

export interface Visit {
  eveningIndex: number;
  wave: WaveIndex;
  /** Exactly six. */
  plates: Plate[];
  suspicionAtTime: number;
  pushedStation: Station | null;
  /** Revealed the following Sunday. PRD FR-11 */
  confirmed: boolean;
}

// ---------------------------------------------------------------------------
// Service — PRD §4.1
// ---------------------------------------------------------------------------

export interface Plate {
  courseId: string;
  station: Station;
  wave: WaveIndex;
  q: number;
  bar: number;
  outcome: PlateOutcome;
}

export type NarratorFactKind =
  | 'defect'
  | 'starPlate'
  | 'overload'
  | 'crowding'
  | 'wearHigh'
  | 'wearCapped'
  | 'growth'
  | 'push'
  | 'emptyStation'
  | 'cutCourse'
  | 'reputation'
  | 'cash';

/**
 * A structured fact from one evening. The narrator receives 30–60 of these and
 * may tell three (PRD §3.11). The simulation never writes prose.
 */
export interface NarratorFact {
  kind: NarratorFactKind;
  eveningIndex: number;
  station: Station | null;
  cookId: string | null;
  courseId: string | null;
  /** Signed distance from what was expected. Drives salience. */
  deviation: number;
  /** Extra numbers a template may interpolate. */
  params: Record<string, number | string>;
}

export interface ServiceResult {
  eveningIndex: number;
  bar: number;
  covers: number;
  /** Twelve: six courses × two waves. */
  plates: Plate[];
  avgQ: number;
  defects: number;
  starPlates: number;
  wasInspected: boolean;
  inspectedWave: WaveIndex | null;
  revenue: number;
  costs: number;
  facts: NarratorFact[];
}

// ---------------------------------------------------------------------------
// Game state — PRD §4.1
// ---------------------------------------------------------------------------

export interface GameState {
  version: number;
  /** `7K3-MAREN`. */
  seed: string;
  /** The whole mulberry32 state. Persisted with every autosave. */
  rngState: number;
  lang: Lang;
  venueName: string;
  seasonNumber: 1 | 2 | 3;
  /** 0–39. */
  eveningIndex: number;
  /** Six. */
  cooks: Cook[];
  /** The 18 courses available this run. */
  catalogue: Course[];
  /** Six courseIds, ordered — harmony reads the order. */
  menu: string[];
  assignment: Assignment;
  weekPlan: WeekPlan;
  cash: number;
  /** 0–100. */
  reputation: number;
  /** Starts at 5. */
  pushTokens: number;
  /** Three evening indices. Never shown in the UI. */
  visitEvenings: number[];
  visits: Visit[];
  history: ServiceResult[];
  stars: 0 | 1 | 2;
  /** Repetition budget for narrator templates. */
  narratorUsed: string[];
}

// ---------------------------------------------------------------------------
// Persistence — PRD §4.3
// ---------------------------------------------------------------------------

export interface SaveEnvelope {
  version: number;
  game: GameState | null;
}

export interface ChronicleEntry {
  seed: string;
  venueName: string;
  seasonNumber: 1 | 2 | 3;
  stars: 0 | 1 | 2;
  reputation: number;
  cash: number;
  /** Chronicles keep the language they were generated in. PRD FR-16 */
  lang: Lang;
  /** Rendered season summary, under 900 characters. */
  text: string;
}

export interface Prefs {
  lang: Lang;
  reducedMotion: boolean;
}
