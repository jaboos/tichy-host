/**
 * The catalogue of thirty courses. PRD §2.3, §3.6, §3.9 FR-13.
 *
 * Eighteen of these are drawn per run, with at least four per station and at least
 * one of difficulty 5 (`C.draft`). The pool is therefore built so that constraint
 * is always satisfiable: six or more courses per station, one difficulty-5 course
 * on each.
 *
 * `harmony` is NOT a field here. PRD §3.6 supersedes v4 §6: harmony is computed
 * from a course's neighbours in the menu, because as a static property at
 * coefficient 0.75 it measured 0.0 impact.
 *
 * `isSignature` is false throughout — signature-dish naming is Layer 2 (v4 §16).
 * The field is kept because PRD §4.1 declares it.
 */
import type { Course } from '../engine/types';

export const COURSES: readonly Course[] = [
  // --- cold kitchen (8) -----------------------------------------------------
  {
    id: 'krenAKedlubna',
    nameKey: 'course.krenAKedlubna.name',
    station: 'cold',
    difficulty: 1,
    seasonPhase: 3,
    flavour: 'earthy',
    isSignature: false,
  },
  {
    id: 'celeroveCarpaccio',
    nameKey: 'course.celeroveCarpaccio.name',
    station: 'cold',
    difficulty: 2,
    seasonPhase: 0,
    flavour: 'sour',
    isSignature: false,
  },
  {
    id: 'kysleMlekoBylinky',
    nameKey: 'course.kysleMlekoBylinky.name',
    station: 'cold',
    difficulty: 2,
    seasonPhase: 4,
    flavour: 'dairy',
    isSignature: false,
  },
  {
    id: 'tatarakZJelena',
    nameKey: 'course.tatarakZJelena.name',
    station: 'cold',
    difficulty: 3,
    seasonPhase: 5,
    flavour: 'meaty',
    isSignature: false,
  },
  {
    id: 'syrovaKapusta',
    nameKey: 'course.syrovaKapusta.name',
    station: 'cold',
    difficulty: 3,
    seasonPhase: 1,
    flavour: 'earthy',
    isSignature: false,
  },
  {
    id: 'nakladanaJikra',
    nameKey: 'course.nakladanaJikra.name',
    station: 'cold',
    difficulty: 4,
    seasonPhase: 2,
    flavour: 'sour',
    isSignature: false,
  },
  {
    id: 'uzenyUhor',
    nameKey: 'course.uzenyUhor.name',
    station: 'cold',
    difficulty: 4,
    seasonPhase: 6,
    flavour: 'meaty',
    isSignature: false,
  },
  {
    id: 'ustriceSOctem',
    nameKey: 'course.ustriceSOctem.name',
    station: 'cold',
    difficulty: 5,
    seasonPhase: 7,
    flavour: 'sour',
    isSignature: false,
  },

  // --- fire (8) -------------------------------------------------------------
  {
    id: 'grilovanyPorek',
    nameKey: 'course.grilovanyPorek.name',
    station: 'fire',
    difficulty: 1,
    seasonPhase: 5,
    flavour: 'earthy',
    isSignature: false,
  },
  {
    id: 'pecenyCeler',
    nameKey: 'course.pecenyCeler.name',
    station: 'fire',
    difficulty: 2,
    seasonPhase: 0,
    flavour: 'earthy',
    isSignature: false,
  },
  {
    id: 'kvetakZPece',
    nameKey: 'course.kvetakZPece.name',
    station: 'fire',
    difficulty: 2,
    seasonPhase: 1,
    flavour: 'earthy',
    isSignature: false,
  },
  {
    id: 'kachniPrsaNaUhli',
    nameKey: 'course.kachniPrsaNaUhli.name',
    station: 'fire',
    difficulty: 3,
    seasonPhase: 2,
    flavour: 'meaty',
    isSignature: false,
  },
  {
    id: 'candatNaKuzi',
    nameKey: 'course.candatNaKuzi.name',
    station: 'fire',
    difficulty: 3,
    seasonPhase: 4,
    flavour: 'meaty',
    isSignature: false,
  },
  {
    id: 'jehneciHrbet',
    nameKey: 'course.jehneciHrbet.name',
    station: 'fire',
    difficulty: 4,
    seasonPhase: 6,
    flavour: 'meaty',
    isSignature: false,
  },
  {
    id: 'zverinovySteak',
    nameKey: 'course.zverinovySteak.name',
    station: 'fire',
    difficulty: 4,
    seasonPhase: 7,
    flavour: 'meaty',
    isSignature: false,
  },
  {
    id: 'holubNaSene',
    nameKey: 'course.holubNaSene.name',
    station: 'fire',
    difficulty: 5,
    seasonPhase: 3,
    flavour: 'meaty',
    isSignature: false,
  },

  // --- sauces (7) -----------------------------------------------------------
  {
    id: 'kminovaJiska',
    nameKey: 'course.kminovaJiska.name',
    station: 'sauce',
    difficulty: 1,
    seasonPhase: 0,
    flavour: 'earthy',
    isSignature: false,
  },
  {
    id: 'smetanovaKrenova',
    nameKey: 'course.smetanovaKrenova.name',
    station: 'sauce',
    difficulty: 2,
    seasonPhase: 7,
    flavour: 'dairy',
    isSignature: false,
  },
  {
    id: 'beurreBlanc',
    nameKey: 'course.beurreBlanc.name',
    station: 'sauce',
    difficulty: 3,
    seasonPhase: 6,
    flavour: 'dairy',
    isSignature: false,
  },
  {
    id: 'redukceZVina',
    nameKey: 'course.redukceZVina.name',
    station: 'sauce',
    difficulty: 3,
    seasonPhase: 5,
    flavour: 'sour',
    isSignature: false,
  },
  {
    id: 'hollandaise',
    nameKey: 'course.hollandaise.name',
    station: 'sauce',
    difficulty: 4,
    seasonPhase: 3,
    flavour: 'dairy',
    isSignature: false,
  },
  {
    id: 'houboveJus',
    nameKey: 'course.houboveJus.name',
    station: 'sauce',
    difficulty: 4,
    seasonPhase: 1,
    flavour: 'earthy',
    isSignature: false,
  },
  {
    id: 'demiGlace',
    nameKey: 'course.demiGlace.name',
    station: 'sauce',
    difficulty: 5,
    seasonPhase: 2,
    flavour: 'meaty',
    isSignature: false,
  },

  // --- desserts (7) ---------------------------------------------------------
  {
    id: 'bezinkovySorbet',
    nameKey: 'course.bezinkovySorbet.name',
    station: 'dessert',
    difficulty: 1,
    seasonPhase: 2,
    flavour: 'sweet',
    isSignature: false,
  },
  {
    id: 'tvarohovyKrem',
    nameKey: 'course.tvarohovyKrem.name',
    station: 'dessert',
    difficulty: 2,
    seasonPhase: 4,
    flavour: 'dairy',
    isSignature: false,
  },
  {
    id: 'svestkovyKolac',
    nameKey: 'course.svestkovyKolac.name',
    station: 'dessert',
    difficulty: 2,
    seasonPhase: 6,
    flavour: 'sweet',
    isSignature: false,
  },
  {
    id: 'pernikSeSmetanou',
    nameKey: 'course.pernikSeSmetanou.name',
    station: 'dessert',
    difficulty: 3,
    seasonPhase: 7,
    flavour: 'sweet',
    isSignature: false,
  },
  {
    id: 'jablecnyZavin',
    nameKey: 'course.jablecnyZavin.name',
    station: 'dessert',
    difficulty: 3,
    seasonPhase: 0,
    flavour: 'sweet',
    isSignature: false,
  },
  {
    id: 'cokoladaOlivovyOlej',
    nameKey: 'course.cokoladaOlivovyOlej.name',
    station: 'dessert',
    difficulty: 4,
    seasonPhase: 5,
    flavour: 'sweet',
    isSignature: false,
  },
  {
    id: 'karameloveSufle',
    nameKey: 'course.karameloveSufle.name',
    station: 'dessert',
    difficulty: 5,
    seasonPhase: 1,
    flavour: 'sweet',
    isSignature: false,
  },
];

const BY_ID = new Map(COURSES.map((course) => [course.id, course]));

export function getCourse(id: string): Course {
  const course = BY_ID.get(id);
  if (course === undefined) throw new Error(`Unknown course: ${id}`);
  return course;
}

export function findCourse(id: string): Course | undefined {
  return BY_ID.get(id);
}
