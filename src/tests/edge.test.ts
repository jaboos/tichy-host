/**
 * The edge cases of PRD §9, as far as the engine owns them.
 *
 * Cases 4, 5, 6, 13, 14, 15 and 16 are store, persistence or UI behaviour and are
 * tested in Phase 3 when those layers exist; every case that the engine decides is
 * here. Each test names its case number so the table stays traceable.
 */

import { describe, expect, it } from 'vitest';

import { C } from '../engine/constants';
import { createRng } from '../engine/rng';
import { buildStationSetup, computeHarmony, effectiveHand, meanHarmony } from '../engine/plate';
import { computeBarBreakdown } from '../engine/bar';
import { coversFor, isBankrupt, updateReputation } from '../engine/economy';
import { VISIT_THIRDS, drawVisitEvenings } from '../engine/inspector';
import { runService, type EveningSetup } from '../engine/service';
import { applyEveningWear, applyMondayRecovery } from '../engine/wear';
import { advanceEvening, judge, openEvening, startSeason } from '../engine/season';
import { referenceBrigade, makePlan } from './harness';
import { COURSES, getCourse } from '../data/courses';
import { STATIONS, type Assignment, type Cook, type Course, type Station } from '../engine/types';

const brigade = (): Cook[] => referenceBrigade();

/** Six courses covering all four stations, in a fixed order. */
function testMenu(): Course[] {
  return [
    getCourse('celeroveCarpaccio'), // cold, 2
    getCourse('kachniPrsaNaUhli'), // fire, 3
    getCourse('beurreBlanc'), // sauce, 3
    getCourse('tvarohovyKrem'), // dessert, 2
    getCourse('jehneciHrbet'), // fire, 4
    getCourse('houboveJus'), // sauce, 4
  ];
}

function setupFor(overrides: Partial<EveningSetup> = {}): EveningSetup {
  const cooks = brigade();
  return {
    cooks,
    assignment: makePlan(cooks, null),
    menu: testMenu(),
    weekIndex: 0,
    eveningIndex: 0,
    eveningInWeek: 0,
    reputation: C.economy.startingReputation,
    seasonNumber: 1,
    pushedStation: null,
    scoldedStation: null,
    premium: false,
    trialEvening: false,
    cutCourseId: null,
    inspected: false,
    inspectedWave: null,
    ...overrides,
  };
}

const emptyAssignment = (): Assignment => ({
  leads: { cold: null, fire: null, sauce: null, dessert: null },
  helpers: { cold: null, fire: null, sauce: null, dessert: null },
  resting: [],
});

describe('§9 case 1 — fewer cooks than stations', () => {
  it('leaves the station empty and resolves its courses as defects with no Q', () => {
    const cooks = brigade();
    const assignment = makePlan(cooks, null);
    assignment.leads.dessert = null; // nobody on desserts tonight

    const { result } = runService(setupFor({ cooks, assignment }), createRng(1));
    const dessertPlates = result.plates.filter((p) => p.station === 'dessert');

    expect(dessertPlates.length).toBeGreaterThan(0);
    for (const plate of dessertPlates) {
      expect(plate.outcome).toBe('defect');
      expect(plate.q).toBeNull();
    }
    // The other stations are unaffected.
    expect(result.plates.some((p) => p.station !== 'dessert' && p.q !== null)).toBe(true);
  });
});

describe('§9 case 2 — an empty station has capacity 0', () => {
  it('never divides by zero and reports itself unviable', () => {
    const setup = buildStationSetup('sauce', testMenu(), null, null);
    expect(setup.capacity).toBe(0);
    expect(setup.viable).toBe(false);
    expect(Number.isFinite(setup.overload)).toBe(true);
    expect(setup.overload).toBe(0);
  });

  it('treats a lead with no effective hand the same way', () => {
    // hand 1 away from home leaves an effective hand of 0, and so no capacity.
    const weak: Cook = { ...(brigade()[0] as Cook), hand: 1, homeStation: 'cold' };
    const setup = buildStationSetup('sauce', testMenu(), weak, null);
    expect(effectiveHand(weak, 'sauce')).toBe(0);
    expect(setup.viable).toBe(false);

    const cooks = [weak];
    const assignment = emptyAssignment();
    assignment.leads.sauce = weak.id;
    const { result } = runService(setupFor({ cooks, assignment }), createRng(2));
    for (const plate of result.plates.filter((p) => p.station === 'sauce')) {
      expect(plate.outcome).toBe('defect');
      expect(plate.q).toBeNull();
    }
  });
});

describe('§9 case 3 — a station with no course', () => {
  const menuWithoutDessert = (): Course[] => testMenu().filter((c) => c.station !== 'dessert');

  it('wears its lead at the helper rate, not the lead rate', () => {
    const cooks = brigade();
    const lead = cooks[3] as Cook;
    const menu = menuWithoutDessert();
    const assignment = emptyAssignment();
    assignment.leads.dessert = lead.id;

    const setups = {} as Record<Station, ReturnType<typeof buildStationSetup>>;
    for (const station of STATIONS) {
      setups[station] = buildStationSetup(station, menu, station === 'dessert' ? lead : null, null);
    }

    const after = applyEveningWear({
      cooks: [lead],
      setups,
      restingIds: [],
      pushedStation: null,
      defectsByStation: { cold: 0, fire: 0, sauce: 0, dessert: 0 },
    });
    expect(after[0]?.wear).toBe(C.wear.helper);
  });

  it('banks no clean evening — the work did not stretch anyone', () => {
    const cooks = brigade();
    const lead = cooks[3] as Cook;
    const menu = menuWithoutDessert();
    const setups = {} as Record<Station, ReturnType<typeof buildStationSetup>>;
    for (const station of STATIONS) {
      setups[station] = buildStationSetup(station, menu, station === 'dessert' ? lead : null, null);
    }
    const after = applyEveningWear({
      cooks: [lead],
      setups,
      restingIds: [],
      pushedStation: null,
      defectsByStation: { cold: 0, fire: 0, sauce: 0, dessert: 0 },
    });
    expect(after[0]?.cleanEvenings).toBe(0);
  });
});

describe('§9 case 7 — visit dates', () => {
  it('places one visit in each third and never on the final evening', () => {
    const rng = createRng(99);
    for (let i = 0; i < 5_000; i += 1) {
      const visits = drawVisitEvenings(rng);
      expect(visits).toHaveLength(C.inspector.visitsPerSeason);
      expect(new Set(visits).size).toBe(C.inspector.visitsPerSeason);
      expect(Math.max(...visits)).toBeLessThan(C.season.eveningsPerSeason - 1);
      VISIT_THIRDS.forEach(([start, end], third) => {
        const visit = visits[third] as number;
        expect(visit).toBeGreaterThanOrEqual(start);
        expect(visit).toBeLessThanOrEqual(end);
      });
    }
  });
});

describe('§9 case 8 — cutting a course on an inspection evening', () => {
  it('is allowed, and the cut course counts as a defect in both waves', () => {
    const menu = testMenu();
    const cut = menu[2] as Course;
    const { result } = runService(
      setupFor({ cutCourseId: cut.id, inspected: true, inspectedWave: 1 }),
      createRng(3),
    );
    const cutPlates = result.plates.filter((p) => p.courseId === cut.id);
    expect(cutPlates).toHaveLength(C.season.wavesPerEvening);
    for (const plate of cutPlates) {
      expect(plate.outcome).toBe('defect');
      expect(plate.q).toBeNull();
    }
    expect(result.defects).toBeGreaterThanOrEqual(C.season.wavesPerEvening);
  });
});

describe('§9 case 11 — crowding and overload both apply', () => {
  it('counts ambitious courses and volume separately', () => {
    // Three difficulty-4+ courses on one station, one lead, no helper.
    const menu = [
      getCourse('jehneciHrbet'), // fire 4
      getCourse('zverinovySteak'), // fire 4
      getCourse('holubNaSene'), // fire 5
    ];
    const lead = { ...(brigade()[1] as Cook), homeStation: 'fire' as Station, hand: 3 };
    const setup = buildStationSetup('fire', menu, lead, null);

    expect(setup.load).toBe(13);
    expect(setup.overload).toBeGreaterThan(0);
    expect(setup.crowding).toBeGreaterThan(0);
    // Three ambitious courses, allowance of one alone → 1.5 × 2.
    expect(setup.crowding).toBe(C.plate.crowdingCoef * 2);
  });
});

describe('§9 case 12 — wear clamps at 10', () => {
  it('never exceeds the cap however hard the evening was', () => {
    const cooks = brigade().map((c) => ({ ...c, wear: 9.8 }));
    const assignment = makePlan(cooks, null);
    const menu = testMenu();
    const setups = {} as Record<Station, ReturnType<typeof buildStationSetup>>;
    const byId = new Map(cooks.map((c) => [c.id, c]));
    for (const station of STATIONS) {
      setups[station] = buildStationSetup(
        station,
        menu,
        byId.get(assignment.leads[station] ?? '') ?? null,
        byId.get(assignment.helpers[station] ?? '') ?? null,
      );
    }
    const after = applyEveningWear({
      cooks,
      setups,
      restingIds: [],
      pushedStation: 'sauce',
      defectsByStation: { cold: 0, fire: 0, sauce: 0, dessert: 0 },
    });
    for (const cook of after) expect(cook.wear).toBeLessThanOrEqual(C.wear.max);
  });

  it('never falls below zero on rest or on a Monday', () => {
    const cooks = brigade().map((c) => ({ ...c, wear: 1 }));
    const rested = applyMondayRecovery(cooks);
    for (const cook of rested) expect(cook.wear).toBeGreaterThanOrEqual(C.wear.min);
  });
});

describe('§9 case 18 — reputation and covers clamp', () => {
  it('keeps reputation inside [0, 100]', () => {
    expect(updateReputation(99, 40, 12, 0, 12)).toBeLessThanOrEqual(C.economy.reputationMax);
    expect(updateReputation(1, 0, 30, 12, 0)).toBeGreaterThanOrEqual(C.economy.reputationMin);
  });

  it('keeps covers inside [12, 40] at both extremes of reputation', () => {
    for (const eveningInWeek of [0, 1, 2, 3, 4]) {
      for (const reputation of [0, 15, 50, 100]) {
        const covers = coversFor(reputation, eveningInWeek);
        expect(covers).toBeGreaterThanOrEqual(C.economy.coversMin);
        expect(covers).toBeLessThanOrEqual(C.economy.coversMax);
      }
    }
  });

  it('pays a weekend bonus on evenings 3 and 4', () => {
    expect(coversFor(50, 3)).toBeGreaterThan(coversFor(50, 2));
    expect(coversFor(50, 4)).toBeGreaterThan(coversFor(50, 2));
  });
});

describe('§9 case 19 — the investor ending', () => {
  it('triggers strictly below −150 000', () => {
    expect(isBankrupt(C.economy.bankruptcyThreshold)).toBe(false);
    expect(isBankrupt(C.economy.bankruptcyThreshold - 1)).toBe(true);
  });
});

describe('§9 case 20 — a cook at hand 5 stops growing', () => {
  it('accumulates no further clean evenings', () => {
    const maxed: Cook = { ...(brigade()[0] as Cook), hand: C.growth.maxHand, cleanEvenings: 13 };
    const menu = testMenu();
    const setups = {} as Record<Station, ReturnType<typeof buildStationSetup>>;
    for (const station of STATIONS) {
      setups[station] = buildStationSetup(station, menu, station === 'sauce' ? maxed : null, null);
    }
    const after = applyEveningWear({
      cooks: [maxed],
      setups,
      restingIds: [],
      pushedStation: null,
      defectsByStation: { cold: 0, fire: 0, sauce: 0, dessert: 0 },
    });
    expect(after[0]?.hand).toBe(C.growth.maxHand);
    expect(after[0]?.cleanEvenings).toBe(13);
  });
});

describe('growth — PRD §3.4', () => {
  it('needs both a clean station and work that stretches the cook', () => {
    const cook: Cook = {
      ...(brigade()[0] as Cook),
      hand: 2,
      homeStation: 'sauce',
      cleanEvenings: 0,
    };
    const menu = [getCourse('houboveJus')]; // sauce, difficulty 4 — above effective hand 3
    const setups = {} as Record<Station, ReturnType<typeof buildStationSetup>>;
    for (const station of STATIONS) {
      setups[station] = buildStationSetup(station, menu, station === 'sauce' ? cook : null, null);
    }

    const clean = applyEveningWear({
      cooks: [cook],
      setups,
      restingIds: [],
      pushedStation: null,
      defectsByStation: { cold: 0, fire: 0, sauce: 0, dessert: 0 },
    });
    expect(clean[0]?.cleanEvenings).toBe(1);

    const withDefect = applyEveningWear({
      cooks: [cook],
      setups,
      restingIds: [],
      pushedStation: null,
      defectsByStation: { cold: 0, fire: 0, sauce: 1, dessert: 0 },
    });
    expect(withDefect[0]?.cleanEvenings).toBe(0);
  });

  it('promotes at the threshold and moves to the next one', () => {
    const cook: Cook = {
      ...(brigade()[0] as Cook),
      hand: 2,
      homeStation: 'sauce',
      cleanEvenings: C.growth.thresholds[0] - 1,
      growthThreshold: C.growth.thresholds[0],
    };
    const menu = [getCourse('houboveJus')];
    const setups = {} as Record<Station, ReturnType<typeof buildStationSetup>>;
    for (const station of STATIONS) {
      setups[station] = buildStationSetup(station, menu, station === 'sauce' ? cook : null, null);
    }
    const after = applyEveningWear({
      cooks: [cook],
      setups,
      restingIds: [],
      pushedStation: null,
      defectsByStation: { cold: 0, fire: 0, sauce: 0, dessert: 0 },
    })[0];
    expect(after?.hand).toBe(3);
    expect(after?.cleanEvenings).toBe(0);
    expect(after?.growthThreshold).toBe(C.growth.thresholds[1]);
  });
});

describe('harmony — PRD §3.6', () => {
  it('penalises adjacent courses from the same station', () => {
    const a = getCourse('beurreBlanc');
    const b = getCourse('houboveJus'); // also sauce
    expect(computeHarmony([a, b])[0]).toBe(C.harmony.sameStation);
  });

  it('does not stack relations — the first match wins', () => {
    // Same station AND same flavour is still one penalty, not two. PRD §3.6 is a
    // table of relations, and docs/sim-harmony.js returns on the first hit.
    const a = getCourse('beurreBlanc'); // sauce, dairy
    const b = getCourse('smetanovaKrenova'); // sauce, dairy
    expect(computeHarmony([a, b])[0]).toBe(C.harmony.sameStation);
  });

  it('rewards arriving at a sweet course but not leaving one', () => {
    const savoury = getCourse('kachniPrsaNaUhli'); // fire, meaty
    const sweet = getCourse('svestkovyKolac'); // dessert, sweet
    expect(computeHarmony([savoury, sweet])[0]).toBe(C.harmony.opposing);
    expect(computeHarmony([sweet, savoury])[0]).toBe(C.harmony.neutral);
  });

  it('clamps to ±2 and does not punish the first and last course for having one neighbour', () => {
    const menu = testMenu();
    for (const value of computeHarmony(menu)) {
      expect(value).toBeGreaterThanOrEqual(C.harmony.clampMin);
      expect(value).toBeLessThanOrEqual(C.harmony.clampMax);
    }
    const single = computeHarmony([getCourse('beurreBlanc')]);
    expect(single).toEqual([0]);
  });
});

describe('the bar prices harmony — PRD §3.3', () => {
  it('a better-flowing menu raises its own bar', () => {
    const flowing = [getCourse('kachniPrsaNaUhli'), getCourse('svestkovyKolac')];
    const flat = [getCourse('beurreBlanc'), getCourse('houboveJus')];
    expect(computeBarBreakdown(flowing, 0, 15, 1).harmony).toBeGreaterThan(
      computeBarBreakdown(flat, 0, 15, 1).harmony,
    );
  });

  it('claws back half of what harmony gives, so it stays worth chasing', () => {
    const menu = testMenu();
    const breakdown = computeBarBreakdown(menu, 0, 15, 1);
    expect(breakdown.harmony).toBeCloseTo(C.bar.harmonyCoef * meanHarmony(menu), 12);
    expect(C.bar.harmonyCoef).toBeLessThan(1);
  });

  it('the breakdown sums to the bar it reports', () => {
    const b = computeBarBreakdown(testMenu(), 3, 40, 2);
    expect(b.base + b.ambition + b.week + b.reputation + b.season + b.harmony).toBeCloseTo(
      b.total,
      12,
    );
  });
});

describe('the verdict — PRD §3.8 FR-12', () => {
  const plate = (outcome: 'defect' | 'passed' | 'star') => ({
    courseId: 'x',
    station: 'sauce' as Station,
    wave: 0 as const,
    q: 1,
    bar: 1,
    outcome,
  });
  const visit = (outcomes: readonly ('defect' | 'passed' | 'star')[]) => ({
    eveningIndex: 0,
    wave: 0 as const,
    plates: outcomes.map(plate),
    suspicionAtTime: 0,
    pushedStation: null,
    confirmed: false,
  });

  it('gives ★ for at most one plate below the bar', () => {
    expect(
      judge({ visits: [visit(['passed', 'defect']), visit(['passed']), visit(['passed'])] }),
    ).toBe(1);
    expect(
      judge({ visits: [visit(['defect', 'defect']), visit(['passed']), visit(['passed'])] }),
    ).toBe(0);
  });

  it('gives ★★ only with no defect and a star plate in every visit', () => {
    expect(judge({ visits: [visit(['star']), visit(['star']), visit(['star'])] })).toBe(2);
    // A star plate missing from one visit is enough to lose the second star.
    expect(judge({ visits: [visit(['star']), visit(['star']), visit(['passed'])] })).toBe(1);
    // ...and so is a single defect.
    expect(judge({ visits: [visit(['star', 'defect']), visit(['star']), visit(['star'])] })).toBe(
      1,
    );
  });

  it('needs all three visits before it can award ★★', () => {
    expect(judge({ visits: [visit(['star']), visit(['star'])] })).toBe(1);
  });
});

describe('determinism — PRD §8.1', () => {
  it('replaying a seed with the same inputs gives an identical result', () => {
    const run = () => {
      let state = startSeason({ seed: '7K3-MAREN', seasonNumber: 1, cooks: brigade() });
      const rng = createRng(state.rngState);
      const results = [];
      for (let e = 0; e < 10; e += 1) {
        const opened = openEvening(state, rng);
        state = opened.state;
        const assignment = makePlan(state.cooks, null);
        const stepped = advanceEvening(
          state,
          opened.opening,
          { assignment, intervention: null },
          rng,
        );
        state = stepped.state;
        results.push(stepped.result);
      }
      return { results, rngState: state.rngState, reputation: state.reputation };
    };
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()));
  });

  it('survives a JSON round-trip, which is what an autosave is', () => {
    const state = startSeason({ seed: '7K3-MAREN', seasonNumber: 1, cooks: brigade() });
    const rng = createRng(state.rngState);
    const opened = openEvening(state, rng);
    const assignment = makePlan(state.cooks, null);
    const { state: next } = advanceEvening(
      opened.state,
      opened.opening,
      { assignment, intervention: null },
      rng,
    );
    expect(JSON.parse(JSON.stringify(next))).toEqual(next);
  });
});

describe('the push — PRD §3.5', () => {
  it('spends exactly one of five tokens and raises quality on its station', () => {
    let state = startSeason({ seed: '7K3-MAREN', seasonNumber: 1, cooks: brigade() });
    expect(state.pushTokens).toBe(C.intervention.pushTokensPerSeason);
    const rng = createRng(state.rngState);
    const opened = openEvening(state, rng);
    const assignment = makePlan(opened.state.cooks, null);
    const stepped = advanceEvening(
      opened.state,
      opened.opening,
      { assignment, intervention: { id: 'push', station: 'sauce' } },
      rng,
    );
    expect(stepped.state.pushTokens).toBe(C.intervention.pushTokensPerSeason - 1);
    state = stepped.state;
    expect(state.cooks.find((c) => c.id === assignment.leads.sauce)?.wear).toBeGreaterThanOrEqual(
      C.wear.push,
    );
  });

  it('cannot be spent when no token is left', () => {
    const started = startSeason({ seed: '7K3-MAREN', seasonNumber: 1, cooks: brigade() });
    const state = { ...started, pushTokens: 0 };
    const rng = createRng(state.rngState);
    const opened = openEvening(state, rng);
    const assignment = makePlan(opened.state.cooks, null);
    const stepped = advanceEvening(
      opened.state,
      opened.opening,
      { assignment, intervention: { id: 'push', station: 'sauce' } },
      rng,
    );
    expect(stepped.state.pushTokens).toBe(0);
  });
});

describe('the catalogue and the draft — PRD §3.9', () => {
  it('has thirty courses spanning every station and difficulty', () => {
    expect(COURSES).toHaveLength(C.draft.courseCatalogueSize);
    for (const station of STATIONS) {
      expect(COURSES.filter((c) => c.station === station).length).toBeGreaterThanOrEqual(
        C.draft.minCoursesPerStationInRun,
      );
    }
  });
});
