/**
 * Every tunable number in the game. CLAUDE.md rule 2: if a number appears anywhere
 * else in the codebase, it is a bug.
 *
 * Source of truth order (CLAUDE.md): PRD §3 > TICHY-HOST-v4-FINAL.md > sim-final.js,
 * except that **on any disagreement about a number the simulation wins** — it is the
 * only artefact that was measured. Divergences are marked WHY below.
 *
 * CLAUDE.md rule 3: never change a value here without first changing `sim-final.js`,
 * running `node sim-final.js 500`, and updating the golden expectations in the same
 * commit.
 */

/** Freezes the whole tree, so a stray `C.plate.base = 10` throws in strict mode. */
function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const key of Object.getOwnPropertyNames(value)) {
      deepFreeze((value as Record<string, unknown>)[key]);
    }
    Object.freeze(value);
  }
  return value;
}

export const C = deepFreeze({
  // -------------------------------------------------------------------------
  // Shape of a season — PRD §3.1, §3.8
  // -------------------------------------------------------------------------
  season: {
    eveningsPerSeason: 40,
    eveningsPerWeek: 5,
    weeksPerSeason: 8,
    wavesPerEvening: 2,
    coursesPerMenu: 6,
    stationCount: 4,
    brigadeSize: 6,
    seasonsPerCareer: 3,
    /** Evening index 0-4 = Tue…Sat. Index 3 and 4 carry the weekend covers bonus. */
    weekendEveningIndices: [3, 4],
    /** Week 1 planning is locked; the rail unlocks on Monday of week 2. PRD §3.2 */
    planningUnlocksAtWeekIndex: 1,
  },

  /** 18:30 counts 0.7, 20:30 counts 1.3. PRD §3.4 */
  waveWeights: [0.7, 1.3],

  // -------------------------------------------------------------------------
  // The bar (laťka) — PRD §3.3. The most important number in the game.
  // -------------------------------------------------------------------------
  bar: {
    base: 12.0,
    /** Ambitious menus lower the bar, so timidity stops being free. */
    ambitionCoef: 1.4,
    ambitionPivot: 3.33,
    ambitionMin: -1.0,
    ambitionMax: 2.5,
    /** weekIndex is 0-based. */
    weekCoef: 0.2,
    /**
     * WHY 0.03: the servo that stops both rubber-banding and running away.
     * d(bar)/d(own quality) = 0.48 < 1 — success raises the bar but does not
     * erase progress. One of the three real tuning levers (v4 §11).
     */
    reputationCoef: 0.03,
    reputationPivot: 15,
    /** Also the retention penalty: keeping a star means playing season n+1. */
    seasonCoef: 0.4,
    /**
     * WHY 0.5: any player-chosen quality the bar does not claw back becomes a
     * dominant strategy — the same failure the moving bar was introduced to fix
     * for ambition. An optimised menu reaches mean harmony ~0.9 against ~0.12 for
     * a thoughtless one, so unpriced harmony was ~1.5 free quality on every plate.
     * At 0.5 the ladder is monotone and harmony is still worth chasing; at 1.1
     * optimisers stop chasing it entirely and menu composition stops mattering.
     * Evidence: docs/sim-harmony.js. PRD §3.3.
     */
    harmonyCoef: 0.5,
  },

  /**
   * Outcome thresholds, all relative to the bar. PRD §3.3.
   *
   * WHY starPlateOffset is 7.5 and not the 8.5 written in PRD §3.3 prose:
   * `sim-final.js` defaults to `TOP=7.5`, and 7.5 is the only value that
   * reproduces the golden table the PRD itself mandates as the hard gate
   * (§1.2 / §8.2: NAIVE 18.0/0.8 · ROTA 36.8/4.4 · REVISE 46.8/10.8 ·
   * SMART 60.6/26.4, career 57/57/53). Measured: `node sim-final.js 500` gives
   * exactly that at 7.5, and 20.6/38.4/41.8/60.0 at 8.5 — the older table in
   * TICHY-HOST-v4-FINAL.md §11, which PRD §1.2 supersedes. CLAUDE.md source-of-
   * truth rule 3 ("the simulation wins") therefore selects 7.5.
   */
  outcome: {
    starPlateOffset: 7.5,
  },

  // -------------------------------------------------------------------------
  // Plate quality — PRD §3.4
  // -------------------------------------------------------------------------
  plate: {
    /**
     * WHY 9.5: the distance of average quality from the bar. The main calibration
     * knob of the whole game (v4 §11, lever 1).
     */
    base: 9.5,
    leadHandCoef: 1.6,
    helperHandCoef: 0.6,
    difficultyCoef: 0.9,
    /** Punishes a course harder than the hand cooking it. */
    overreachCoef: 2.2,
    homeStationBonus: 1,
    awayStationPenalty: -1,
    capacityCoef: 2.0,
    capacityHelperCoef: 0.4,
    /** Overload is a fence, not a trade — the optimum sits exactly at zero (v4 §2.4). */
    overloadCoef: 5.0,
    crowdingCoef: 1.5,
    /** A course counts as "ambitious" for crowding at this difficulty. */
    crowdingDifficultyThreshold: 4,
    crowdingAllowanceSolo: 1,
    crowdingAllowanceWithHelper: 2,
    seasonalityAmplitude: 0.8,
    seasonalityPeriod: 8,
    premiumBonus: 0.8,
    /** Two evenings after a menu revision cook at this penalty. PRD §3.6 */
    trialEveningPenalty: -1.0,
    /** The only output randomness in the game: U(-1, +1), widened by ambition. */
    noiseMin: -1,
    noiseMax: 1,
    noiseWidthBase: 1,
    noiseDifficultyCoef: 0.25,
    noiseDifficultyPivot: 2,
  },

  /** Fatigue coefficient by endurance label. PRD §3.4 */
  endurance: {
    lasts: 0.3,
    normal: 0.4,
    burns: 0.5,
  },

  // -------------------------------------------------------------------------
  // Wear and growth — PRD §3.4
  // -------------------------------------------------------------------------
  wear: {
    leadBase: 0.3,
    /**
     * WHY 0.18: the only link between the menu and the rota, sensitivity 25 points
     * (v4 §11, lever 2). Changing it re-tunes the entire game.
     */
    leadLoadCoef: 0.18,
    helper: 1.0,
    push: 2.0,
    rest: -5,
    /** Monday is not played; everyone recovers. */
    monday: -2,
    min: 0,
    max: 10,
    /** From here the UI shows the red two-evenings-ahead warning. PRD FR-1 */
    warningThreshold: 9,
  },

  growth: {
    /** Clean evenings needed for +1 hand, in order. PRD §3.4 */
    thresholds: [14, 30, 60],
    maxHand: 5,
    minHand: 1,
  },

  // -------------------------------------------------------------------------
  // Menu and harmony — PRD §3.6
  // -------------------------------------------------------------------------
  menu: {
    courses: 6,
    minCoursesPerStation: 1,
    minDifficulty: 1,
    maxDifficulty: 5,
    seasonPhases: 8,
    /** A revision costs two evenings at `plate.trialEveningPenalty`. */
    trialEvenings: 2,
  },

  /**
   * Harmony is computed from neighbours, not stored per course.
   *
   * WHY this supersedes v4 §6: as a static course property at coefficient 0.75 it
   * measured 0.0 impact. Simulation showed it has to reach ~2.0 to matter, so the
   * neighbour rule from the mockup at strength 2.0 is adopted (PRD §3.6 note).
   * NOTE: `sim-final.js` still uses the old static value — the golden tests in
   * Phase 2 have to account for this deliberate divergence.
   */
  harmony: {
    sameStation: -2.0,
    sameFlavour: -2.0,
    opposing: 2.0,
    neutral: 0,
    clampMin: -2.0,
    clampMax: 2.0,
  },

  // -------------------------------------------------------------------------
  // Traits — the six canonical ones are PRD §4.2, the other six fill the pool of
  // 24 archetypes. A trait changes a rule, not a stat (v4 §5); these are the
  // magnitudes those rules move by.
  // -------------------------------------------------------------------------
  traits: {
    /** Nožířka: alone +2, with a helper −2. */
    nozirkaSolo: 2.0,
    nozirkaWithHelper: -2.0,
    /** Šampión: the first two courses +3, the last two −3. */
    sampionEarlyBonus: 3.0,
    sampionLatePenalty: -3.0,
    sampionEarlyCourses: 2,
    sampionLateCourses: 2,
    /** Klidná ruka: multiplies the plate noise. */
    klidnaRukaVariance: 0.7,
    /** Učednice: halves the 14 / 30 / 60 growth thresholds. */
    ucedniceGrowthMultiplier: 0.5,
    /** Čte lístky: second wave. */
    cteListkyBonus: 0.5,
    /** Vydrží žár: the first 2.0 of wear does not bite. */
    vydrziZarImmunity: 2.0,
    /** Ranní ptáče: first wave. */
    raniPtaceBonus: 0.5,
    perfekcionistaHardBonus: 1.0,
    perfekcionistaHardThreshold: 4,
    perfekcionistaEasyPenalty: -0.5,
    perfekcionistaEasyThreshold: 2,
    /** Tahoun: a second helping of the 0.6 helper coefficient. */
    tahounHelperBonus: 0.6,
    hazardniHracBonus: 0.8,
    hazardniHracVariance: 1.4,
    domaZustavaHome: 1.5,
    domaZustavaAway: -1.5,
    tichaVodaOverloadBonus: 1.0,
    /** Every archetype's desire needs this many satisfying evenings. PRD §4.1 */
    desireTarget: 3,
    /** Two refusals bring an offer from elsewhere (v4 §13). */
    desireRefusalLimit: 2,
  },

  // -------------------------------------------------------------------------
  // Interventions — PRD §3.5. Exactly one per evening.
  // -------------------------------------------------------------------------
  intervention: {
    praiseWear: -1.5,
    scoldQuality: 0.5,
    scoldWear: 1.5,
    pushQuality: 2.5,
    pushVarianceMultiplier: 2.2,
    pushWear: 2.0,
    /** Five brass tokens a season. Exhaustibility is what makes it a decision. */
    pushTokensPerSeason: 5,
    deferredRestCap: 2,
  },

  // -------------------------------------------------------------------------
  // Monday planning — PRD §3.2
  // -------------------------------------------------------------------------
  planning: {
    restTicketsPerWeek: 6,
    maxTicketsPerCookPerEvening: 1,
    maxTicketsPerCookPerWeek: 2,
    maxHelpers: 2,
    maxHelpersPerStation: 1,
  },

  // -------------------------------------------------------------------------
  // Economy — PRD §3.7. Deliberately minimal: one channel touches quality.
  // -------------------------------------------------------------------------
  economy: {
    startingCash: 250_000,
    /** Below this the season ends and an investor takes over. */
    bankruptcyThreshold: -150_000,
    startingReputation: 15,
    reputationMin: 0,
    reputationMax: 100,
    reputationQualityCoef: 0.45,
    reputationDefectCoef: -0.35,
    reputationStarPlateCoef: 0.5,
    coversBase: 14,
    coversReputationDivisor: 3.5,
    coversWeekendBonus: 6,
    coversMin: 12,
    coversMax: 40,
    /** Fixed. The mockup's 2400/2800/3400 bands measured 0.0 impact and are cut. */
    pricePerCover: 2_800,
    foodCostBase: 0.26,
    foodCostDifficultyCoef: 0.02,
    premiumFoodCostSurcharge: 0.08,
    wagesPerEvening: 16_000,
    operationsPerEvening: 18_000,
    rentPerWeek: 40_000,
  },

  // -------------------------------------------------------------------------
  // Inspector — PRD §3.8
  // -------------------------------------------------------------------------
  inspector: {
    visitsPerSeason: 3,
    /** One guest, one wave, six plates. Three visits = 18 plates. */
    platesPerVisit: 6,
    /** Signals evaluated every evening, all four correlating ones. PRD §3.8 */
    signalsPerEvening: 4,
    baseSignalProbability: 0.18,
    maxSignalProbability: 0.85,
    /** Guard against a zero denominator in the prior odds. */
    priorEpsilon: 1e-9,
    /**
     * The line above which the game calls an evening exposed and says so on the
     * Pas. It is the same threshold the reference policy in the balance harness
     * uses to burn a token, so the advice matches the play that measured well.
     */
    highSuspicion: 0.35,
    /** ★: at most one of the 18 plates below the bar. */
    starOneMaxBelowBar: 1,
    /** ★★: none below the bar, and at least one star plate in every visit. */
    starTwoMaxBelowBar: 0,
    starTwoMinStarPlatesPerVisit: 1,
  },

  // -------------------------------------------------------------------------
  // Draft and catalogue rotation — PRD §3.9. The replayability engine.
  // -------------------------------------------------------------------------
  draft: {
    archetypePoolSize: 24,
    courseCatalogueSize: 30,
    /** 18 of the 30 courses are available in a given run. */
    runCatalogueSize: 18,
    handSumTarget: 14,
    handSumTolerance: 2,
    minBurnsCooks: 1,
    minCoursesPerStationInRun: 4,
    minMaxDifficultyCoursesInRun: 1,
    /** Rejection sampling gives up after this many attempts rather than looping. */
    maxDraftAttempts: 500,
  },

  // -------------------------------------------------------------------------
  // Narrator — PRD §3.11. Silence is information.
  // -------------------------------------------------------------------------
  narrator: {
    maxLinesPerService: 3,
    maxWordsPerParagraph: 40,
    maxWordsPerEvent: 60,
    maxWordsPerOption: 8,

    /**
     * Salience = |deviation| × attention × novelty (PRD §3.11).
     *
     * `attention` is how much of the evening the player spent on that actor. A
     * station they pushed or left empty is a decision they made minutes ago; a
     * station that merely ran hot is weather. Without this the ranking is pure
     * magnitude and the loudest number always wins — which is how the verdict line
     * ended up reporting the same worn brigade for twenty-four evenings running.
     */
    attention: {
      /** They chose this, tonight, and spent a token on it. */
      push: 1.6,
      /** They chose this too, by leaving a place empty. */
      emptyStation: 2,
      /** A single plate is the thing they watched come off the pass. */
      plate: 1,
      /** Load and crowding are conditions, not events. */
      condition: 0.6,
    },

    /**
     * WHY a penalty and not a ban: PRD §3.11 says the budget "prevents the same
     * template twice within a season", and read literally that needs one template
     * per line — 120 of them for forty evenings. Read as the `novelty` term of the
     * ranking formula it means what it is for: a line already told this season has
     * to be nearly three times as interesting to be told again. Deliberate
     * divergence from the letter of §3.11, reported.
     */
    repeatNovelty: 0.35,
  },

  // -------------------------------------------------------------------------
  // Seed — PRD FR-15. `7K3-MAREN`
  // -------------------------------------------------------------------------
  seed: {
    /** 32 glyphs: A–Z and 0–9 minus the ambiguous O, 0, I, 1. */
    alphabet: '23456789ABCDEFGHJKLMNPQRSTUVWXYZ',
    headLength: 3,
    tailLength: 5,
    fnvOffsetBasis: 0x811c9dc5,
    fnvPrime: 0x01000193,
  },

  // -------------------------------------------------------------------------
  // Persistence — PRD §3.10, §4.3
  // -------------------------------------------------------------------------
  storage: {
    version: 1,
    gameKey: 'tichy-host-v4',
    chronicleKey: 'tichy-host-v4-chron',
    prefsKey: 'tichy-host-v4-prefs',
    backupKey: 'tichy-host-v4-backup',
    clockKey: 'tichy-host-v4-clock',
    promptKey: 'tichy-host-v4-prompt',
    sessionKey: 'tichy-host-v4-session',
    tourKey: 'tichy-host-v4-tour',
  },

  // -------------------------------------------------------------------------
  // Feedback and telemetry.
  //
  // None of it touches the simulation. It lives here because the project keeps
  // every tunable in one file, and because "ask at five minutes" is exactly the
  // kind of number that otherwise ends up buried in a component.
  // -------------------------------------------------------------------------
  feedback: {
    /** Active play before the first ask, and before the second. Milliseconds. */
    firstPromptMs: 5 * 60 * 1000,
    secondPromptMs: 15 * 60 * 1000,
    /** Never more than twice in the life of one browser. */
    maxPrompts: 2,
    /** "Not now" buys silence for a day. */
    snoozeMs: 24 * 60 * 60 * 1000,
    /** The clock only advances while the tab is visible; this is its tick. */
    clockTickMs: 1000,

    /** Three clicks inside this window and this radius is a rage click. */
    rageWindowMs: 1000,
    rageRadiusPx: 30,
    rageClicks: 3,
    /** A click that mutates nothing within this window is a dead click. */
    deadClickMs: 700,

    /** Events are buffered and posted in batches, never one per click. */
    flushIntervalMs: 15000,
    maxBatch: 40,
  },
} as const);

export type Constants = typeof C;
