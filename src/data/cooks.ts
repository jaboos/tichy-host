/**
 * The pool of twenty-four cook archetypes. PRD §2.3, §3.9 FR-13, §4.2.
 *
 * The first six are the curated starting brigade from PRD §4.2 and are dealt
 * verbatim on a first run. Every run after that draws six from the whole pool
 * under the constraints in `C.draft`: hands summing to 14 ± 2, all four stations
 * covered as someone's home, at least one `burns`.
 *
 * The pool is shaped so those constraints are satisfiable rather than lucky:
 *   · six archetypes per station, so home coverage is always reachable
 *   · hands 1×5, 3×4, 6×3, 10×2, 4×1 — mean 2.46, so six draws land near 14.75
 *   · eight `burns` archetypes, so the endurance constraint is nearly free
 *   · each of the twelve traits appears exactly twice
 *
 * Czech surnames carry an explicit accusative (`lastNameAcc`) because narrator
 * templates decline them — *"Ryba stál na studené"* but *"...místo Rybu"* (FR-16).
 */
import { C } from '../engine/constants';
import type { Cook, CookArchetype, Endurance, Station } from '../engine/types';

/**
 * Slugs are listed so that `cook.${id}.paradox` type-checks against `TKey`
 * without a cast — a missing paradox line is a compile error.
 */
type CookSlug =
  | 'bartakova'
  | 'ryba'
  | 'vanous'
  | 'kesslerova'
  | 'hruba'
  | 'brichtova'
  | 'dolezal'
  | 'novakova'
  | 'simek'
  | 'kolar'
  | 'sykorova'
  | 'benes'
  | 'malkova'
  | 'zeman'
  | 'rehorova'
  | 'prochazka'
  | 'vlckova'
  | 'sedlacek'
  | 'jandova'
  | 'bilek'
  | 'krejci'
  | 'zelena'
  | 'hruska'
  | 'peroutkova';

/** Positional: id, first, last, accusative, instrumental, age, hand, home, endurance, trait, desire reward, starter. */
const cook = (
  id: CookSlug,
  firstName: string,
  lastName: string,
  lastNameAcc: string,
  lastNameIns: string,
  age: number,
  hand: number,
  homeStation: Station,
  endurance: Endurance,
  traitId: string,
  desireRewardTraitId: string | null,
  isStarter = false,
): CookArchetype => ({
  id,
  firstName,
  lastName,
  lastNameAcc,
  lastNameIns,
  age,
  hand,
  homeStation,
  endurance,
  traitId,
  paradox: `cook.${id}.paradox`,
  desireTarget: C.traits.desireTarget,
  desireRewardTraitId,
  isStarter,
});

// prettier-ignore — one archetype per line keeps the pool readable as a table.
// prettier-ignore
export const COOK_ARCHETYPES: readonly CookArchetype[] = [
  // --- the curated starting brigade, PRD §4.2. Σ hand = 16. -----------------
  // Two of them share Sauces on purpose: competition for a home station is a real cost.
  cook('bartakova', 'Ilona', 'Bartáková', 'Bartákovou', 'Bartákovou', 34, 3, 'sauce', 'lasts', 'nozirka', 'klidnaRuka', true),
  cook('ryba', 'Marek', 'Ryba', 'Rybu', 'Rybou', 29, 4, 'fire', 'burns', 'sampion', 'tichaVoda', true),
  cook('vanous', 'Petr', 'Vaňous', 'Vaňouse', 'Vaňousem', 41, 3, 'cold', 'normal', 'klidnaRuka', 'perfekcionista', true),
  cook('kesslerova', 'Dita', 'Kesslerová', 'Kesslerovou', 'Kesslerovou', 22, 2, 'dessert', 'lasts', 'ucednice', 'perfekcionista', true),
  cook('hruba', 'Jana', 'Hrubá', 'Hrubou', 'Hrubou', 27, 2, 'sauce', 'lasts', 'cteListky', 'nozirka', true),
  cook('brichtova', 'Ela', 'Brichtová', 'Brichtovou', 'Brichtovou', 25, 2, 'fire', 'lasts', 'vydrziZar', 'tahoun', true),

  // --- the rest of the pool -------------------------------------------------
  cook('dolezal', 'Vít', 'Doležal', 'Doležala', 'Doležalem', 38, 5, 'fire', 'burns', 'hazardniHrac', 'klidnaRuka'),
  cook('novakova', 'Radka', 'Nováková', 'Novákovou', 'Novákovou', 36, 4, 'sauce', 'normal', 'perfekcionista', 'tichaVoda'),
  cook('simek', 'Ondřej', 'Šimek', 'Šimka', 'Šimkem', 31, 4, 'cold', 'burns', 'domaZustava', 'nozirka'),
  cook('kolar', 'Tomáš', 'Kolář', 'Koláře', 'Kolářem', 44, 3, 'dessert', 'normal', 'tichaVoda', 'cteListky'),
  cook('sykorova', 'Věra', 'Sýkorová', 'Sýkorovou', 'Sýkorovou', 39, 3, 'cold', 'lasts', 'tahoun', 'vydrziZar'),
  cook('benes', 'Filip', 'Beneš', 'Beneše', 'Benešem', 26, 3, 'fire', 'normal', 'raniPtace', 'hazardniHrac'),
  cook('malkova', 'Lucie', 'Málková', 'Málkovou', 'Málkovou', 33, 3, 'sauce', 'burns', 'klidnaRuka', 'sampion'),
  cook('zeman', 'Karel', 'Zeman', 'Zemana', 'Zemanem', 52, 2, 'cold', 'lasts', 'vydrziZar', 'domaZustava'),
  cook('rehorova', 'Alena', 'Řehořová', 'Řehořovou', 'Řehořovou', 24, 2, 'dessert', 'normal', 'ucednice', 'cteListky'),
  cook('prochazka', 'Jiří', 'Procházka', 'Procházku', 'Procházkou', 30, 2, 'fire', 'burns', 'sampion', 'raniPtace'),
  cook('vlckova', 'Simona', 'Vlčková', 'Vlčkovou', 'Vlčkovou', 28, 2, 'sauce', 'lasts', 'cteListky', 'tahoun'),
  cook('sedlacek', 'Adam', 'Sedláček', 'Sedláčka', 'Sedláčkem', 23, 2, 'cold', 'normal', 'nozirka', 'domaZustava'),
  cook('jandova', 'Petra', 'Jandová', 'Jandovou', 'Jandovou', 35, 2, 'dessert', 'burns', 'perfekcionista', 'hazardniHrac'),
  cook('bilek', 'Roman', 'Bílek', 'Bílka', 'Bílkem', 47, 2, 'dessert', 'lasts', 'tichaVoda', 'vydrziZar'),
  cook('krejci', 'Matěj', 'Krejčí', 'Krejčího', 'Krejčím', 20, 1, 'cold', 'burns', 'raniPtace', 'ucednice'),
  cook('zelena', 'Nikola', 'Zelená', 'Zelenou', 'Zelenou', 21, 1, 'sauce', 'normal', 'hazardniHrac', 'ucednice'),
  cook('hruska', 'David', 'Hruška', 'Hrušku', 'Hruškou', 19, 1, 'fire', 'lasts', 'tahoun', 'ucednice'),
  cook('peroutkova', 'Klára', 'Peroutková', 'Peroutkovou', 'Peroutkovou', 22, 1, 'dessert', 'burns', 'domaZustava', 'sampion'),
];

/** The six of PRD §4.2, in the order the onboarding introduces them. */
export const STARTING_ARCHETYPES: readonly CookArchetype[] = COOK_ARCHETYPES.filter(
  (archetype) => archetype.isStarter,
);

const BY_ID = new Map(COOK_ARCHETYPES.map((archetype) => [archetype.id, archetype]));

export function getArchetype(id: string): CookArchetype {
  const archetype = BY_ID.get(id);
  if (archetype === undefined) throw new Error(`Unknown cook archetype: ${id}`);
  return archetype;
}

/**
 * Turns a static archetype into a cook at the start of a season: rested, with no
 * clean evenings banked and the desire arc at step 0. Pure.
 */
export function createCook(archetype: CookArchetype): Cook {
  return {
    id: archetype.id,
    firstName: archetype.firstName,
    lastName: archetype.lastName,
    lastNameAcc: archetype.lastNameAcc,
    lastNameIns: archetype.lastNameIns,
    age: archetype.age,
    hand: archetype.hand,
    homeStation: archetype.homeStation,
    endurance: archetype.endurance,
    traitId: archetype.traitId,
    wear: C.wear.min,
    cleanEvenings: 0,
    growthThreshold: C.growth.thresholds[0],
    desire: {
      step: 0,
      progress: 0,
      target: archetype.desireTarget,
      rewardTraitId: archetype.desireRewardTraitId,
      refusals: 0,
    },
    paradox: archetype.paradox,
  };
}

/** The first run's brigade. PRD §3.9: curated, not drafted. */
export function createStartingBrigade(): Cook[] {
  return STARTING_ARCHETYPES.map(createCook);
}
