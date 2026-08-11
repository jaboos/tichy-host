/**
 * One evening's service — PRD §3.1 FR-2, §3.4.
 *
 * Everything is computed here, in full, before anything is shown. The reveal on
 * the Service screen is a replay of this result (CLAUDE.md rule 7): closing the
 * tab mid-cascade must lose nothing, so nothing may be decided during it.
 *
 * Twelve plates: six courses × two waves, wave-major, exactly as the reference
 * simulation orders them.
 */

import { C } from './constants';
import { computeBar, outcomeFor } from './bar';
import {
  buildStationSetup,
  computeHarmony,
  computePlateQuality,
  type EveningContext,
  type StationSetup,
} from './plate';
import { coversFor, eveningCosts, eveningRevenue } from './economy';
import { STATIONS } from './types';
import type { Rng } from './rng';
import type {
  Assignment,
  Cook,
  Course,
  NarratorFact,
  Plate,
  ServiceResult,
  Station,
  WaveIndex,
} from './types';

export interface EveningSetup {
  cooks: readonly Cook[];
  assignment: Assignment;
  /** Six courses, in service order — harmony reads the order. */
  menu: readonly Course[];
  weekIndex: number;
  eveningIndex: number;
  /** 0–4 = Tue…Sat. Drives the weekend covers bonus and the rent charge. */
  eveningInWeek: number;
  reputation: number;
  seasonNumber: number;
  pushedStation: Station | null;
  scoldedStation: Station | null;
  premium: boolean;
  trialEvening: boolean;
  /** The `cutCourse` intervention. The cut course counts as a defect (§9 case 8). */
  cutCourseId: string | null;
  inspected: boolean;
  inspectedWave: WaveIndex | null;
}

function emptyStationRecord(): Record<Station, number> {
  return { cold: 0, fire: 0, sauce: 0, dessert: 0 };
}

export function buildSetups(
  cooks: readonly Cook[],
  assignment: Assignment,
  menu: readonly Course[],
): Record<Station, StationSetup> {
  const byId = new Map(cooks.map((cook) => [cook.id, cook]));
  const lookup = (id: string | null): Cook | null => (id === null ? null : (byId.get(id) ?? null));

  return {
    cold: buildStationSetup(
      'cold',
      menu,
      lookup(assignment.leads.cold),
      lookup(assignment.helpers.cold),
    ),
    fire: buildStationSetup(
      'fire',
      menu,
      lookup(assignment.leads.fire),
      lookup(assignment.helpers.fire),
    ),
    sauce: buildStationSetup(
      'sauce',
      menu,
      lookup(assignment.leads.sauce),
      lookup(assignment.helpers.sauce),
    ),
    dessert: buildStationSetup(
      'dessert',
      menu,
      lookup(assignment.leads.dessert),
      lookup(assignment.helpers.dessert),
    ),
  };
}

export interface ServiceOutcome {
  result: ServiceResult;
  setups: Record<Station, StationSetup>;
  defectsByStation: Record<Station, number>;
}

export function runService(setup: EveningSetup, rng: Rng): ServiceOutcome {
  const bar = computeBar(setup.menu, setup.weekIndex, setup.reputation, setup.seasonNumber);
  const harmony = computeHarmony(setup.menu);
  const setups = buildSetups(setup.cooks, setup.assignment, setup.menu);

  const evening: EveningContext = {
    menu: setup.menu,
    harmony,
    weekIndex: setup.weekIndex,
    eveningIndex: setup.eveningIndex,
    pushedStation: setup.pushedStation,
    scoldedStation: setup.scoldedStation,
    premium: setup.premium,
    trialEvening: setup.trialEvening,
    bar,
  };

  const plates: Plate[] = [];
  const defectsByStation = emptyStationRecord();
  let qSum = 0;
  let qCount = 0;
  let defects = 0;
  let starPlates = 0;

  for (let wave: WaveIndex = 0; wave <= 1; wave = (wave + 1) as WaveIndex) {
    for (let index = 0; index < setup.menu.length; index += 1) {
      const course = setup.menu[index];
      if (course === undefined) continue;
      const stationSetup = setups[course.station];

      // No hands, no capacity, or cut tonight — a defect with no number computed.
      const cut = setup.cutCourseId === course.id;
      if (cut || !stationSetup.viable) {
        plates.push({
          courseId: course.id,
          station: course.station,
          wave,
          q: null,
          bar,
          outcome: 'defect',
        });
        defects += 1;
        defectsByStation[course.station] += 1;
        continue;
      }

      const q = computePlateQuality(course, index, stationSetup, evening, wave, rng);
      const outcome = outcomeFor(q, bar);
      plates.push({ courseId: course.id, station: course.station, wave, q, bar, outcome });
      qSum += q;
      qCount += 1;
      if (outcome === 'defect') {
        defects += 1;
        defectsByStation[course.station] += 1;
      } else if (outcome === 'star') {
        starPlates += 1;
      }
    }
  }

  const covers = coversFor(setup.reputation, setup.eveningInWeek);
  const isLastEveningOfWeek = setup.eveningInWeek === C.season.eveningsPerWeek - 1;
  const revenue = eveningRevenue(covers);
  const costs = eveningCosts(covers, setup.menu, setup.premium, isLastEveningOfWeek);

  const result: ServiceResult = {
    eveningIndex: setup.eveningIndex,
    bar,
    covers,
    plates,
    avgQ: qCount === 0 ? 0 : qSum / qCount,
    defects,
    starPlates,
    wasInspected: setup.inspected,
    inspectedWave: setup.inspected ? setup.inspectedWave : null,
    revenue,
    costs,
    facts: collectFacts(setup, setups, plates, bar),
  };

  return { result, setups, defectsByStation };
}

/**
 * Structured facts, never prose (PRD §3.11). The narrator ranks these in Phase 4
 * and is allowed to tell three of them. A course that went fine produces nothing —
 * silence is information.
 */
function collectFacts(
  setup: EveningSetup,
  setups: Record<Station, StationSetup>,
  plates: readonly Plate[],
  bar: number,
): NarratorFact[] {
  const facts: NarratorFact[] = [];

  for (const plate of plates) {
    if (plate.outcome === 'passed') continue;
    facts.push({
      kind: plate.q === null ? 'emptyStation' : plate.outcome === 'star' ? 'starPlate' : 'defect',
      eveningIndex: setup.eveningIndex,
      station: plate.station,
      cookId: setups[plate.station].lead?.id ?? null,
      courseId: plate.courseId,
      deviation: plate.q === null ? 0 : plate.q - bar,
      params: { wave: plate.wave },
    });
  }

  for (const station of STATIONS) {
    const stationSetup = setups[station];
    if (stationSetup.overload > 0) {
      facts.push({
        kind: 'overload',
        eveningIndex: setup.eveningIndex,
        station,
        cookId: stationSetup.lead?.id ?? null,
        courseId: null,
        deviation: stationSetup.overload,
        params: { load: stationSetup.load, capacity: stationSetup.capacity },
      });
    }
    if (stationSetup.crowding > 0) {
      facts.push({
        kind: 'crowding',
        eveningIndex: setup.eveningIndex,
        station,
        cookId: stationSetup.lead?.id ?? null,
        courseId: null,
        deviation: stationSetup.crowding,
        params: {},
      });
    }
  }

  if (setup.pushedStation !== null) {
    facts.push({
      kind: 'push',
      eveningIndex: setup.eveningIndex,
      station: setup.pushedStation,
      cookId: setups[setup.pushedStation].lead?.id ?? null,
      courseId: null,
      deviation: C.intervention.pushQuality,
      params: {},
    });
  }

  return facts;
}
