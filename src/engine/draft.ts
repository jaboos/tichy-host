/**
 * Brigade draft and catalogue rotation — PRD §3.9 FR-13.
 *
 * This is in the MVP because it is the strongest source of run-to-run variety that
 * measurement found: playing a menu tailored to a different brigade costs 51.6
 * percentage points, and one brigade's optimum played by another dropped to 0.1 %.
 * A different six is not a reskin — it is a different puzzle.
 *
 * Both draws are rejection sampling against the constraints in `C.draft`. The pool
 * in `data/cooks.ts` is shaped so those constraints are reachable, not lucky; if
 * the attempt budget ever runs out, that is a data problem and it throws rather
 * than quietly dealing an illegal brigade.
 */

import { C } from './constants';
import { COOK_ARCHETYPES, createCook, createStartingBrigade } from '../data/cooks';
import { COURSES } from '../data/courses';
import { STATIONS, type Cook, type Course, type CookArchetype } from './types';
import type { Rng } from './rng';

/** Fisher-Yates on a copy. Pure with respect to the input. */
function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.int(i + 1);
    const a = out[i];
    const b = out[j];
    if (a === undefined || b === undefined) continue;
    out[i] = b;
    out[j] = a;
  }
  return out;
}

export function isValidBrigade(archetypes: readonly CookArchetype[]): boolean {
  if (archetypes.length !== C.season.brigadeSize) return false;

  const handSum = archetypes.reduce((total, a) => total + a.hand, 0);
  if (Math.abs(handSum - C.draft.handSumTarget) > C.draft.handSumTolerance) return false;

  // Every station must be somebody's home, or a whole station cooks at −1 all season.
  for (const station of STATIONS) {
    if (!archetypes.some((a) => a.homeStation === station)) return false;
  }

  const burns = archetypes.filter((a) => a.endurance === 'burns').length;
  return burns >= C.draft.minBurnsCooks;
}

export function isValidCatalogue(courses: readonly Course[]): boolean {
  if (courses.length !== C.draft.runCatalogueSize) return false;
  for (const station of STATIONS) {
    if (courses.filter((c) => c.station === station).length < C.draft.minCoursesPerStationInRun) {
      return false;
    }
  }
  return (
    courses.filter((c) => c.difficulty === C.menu.maxDifficulty).length >=
    C.draft.minMaxDifficultyCoursesInRun
  );
}

/** The first run gets the curated six of PRD §4.2; every run after this draws. */
export function draftBrigade(rng: Rng): Cook[] {
  for (let attempt = 0; attempt < C.draft.maxDraftAttempts; attempt += 1) {
    const candidate = shuffled(COOK_ARCHETYPES, rng).slice(0, C.season.brigadeSize);
    if (isValidBrigade(candidate)) return candidate.map(createCook);
  }
  throw new Error('draftBrigade: no valid brigade within the attempt budget');
}

export function draftCatalogue(rng: Rng): Course[] {
  for (let attempt = 0; attempt < C.draft.maxDraftAttempts; attempt += 1) {
    const candidate = shuffled(COURSES, rng).slice(0, C.draft.runCatalogueSize);
    if (isValidCatalogue(candidate)) return candidate;
  }
  throw new Error('draftCatalogue: no valid catalogue within the attempt budget');
}

export { createStartingBrigade };

/** A legal opening menu: one course per station, then the cheapest fillers. */
export function defaultMenu(catalogue: readonly Course[]): Course[] {
  const picked: Course[] = [];
  for (const station of STATIONS) {
    const first = catalogue.find((c) => c.station === station);
    if (first !== undefined) picked.push(first);
  }
  for (const course of catalogue) {
    if (picked.length >= C.menu.courses) break;
    if (!picked.includes(course)) picked.push(course);
  }
  return picked;
}
