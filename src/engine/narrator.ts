/**
 * Facts → at most three lines. PRD §3.11 FR-17.
 *
 * The engine writes no prose and knows no language. It receives the 30–60
 * structured facts `collectFacts` produced, ranks them, and returns the *identity*
 * of the templates to say plus the ids they refer to. Turning that into Czech or
 * English is the UI's job — which is what keeps a bilingual game from growing two
 * narrators.
 *
 * Ranking is PRD §3.11's formula, unchanged:
 *
 *     salience = |deviation| × attention × novelty
 *
 * `attention` weights what the player actually spent the evening on: a station
 * they pushed or left empty is a decision they made minutes ago, a station that
 * merely ran hot is weather. `novelty` is the repetition budget. Everything below
 * the top three is dropped, and a fact that deviates by nothing is never told —
 * silence is information.
 *
 * Nothing here touches the RNG. The variant of a template is chosen by hashing the
 * fact, so the same season replays to the same words.
 */
import { C } from './constants';
import type { NarratorFact, NarratorFactKind, NarratorLine } from './types';

export type { NarratorLine };

/** How many ways there are to say each kind. Keep in step with the dictionary. */
const VARIANTS: Record<NarratorFactKind, number> = {
  defect: 2,
  starPlate: 2,
  emptyStation: 2,
  overload: 2,
  crowding: 2,
  push: 2,
  // Not emitted by `collectFacts` yet. Listed at 0 so that adding an emission
  // produces silence rather than a missing-key crash, and so the gap is visible.
  wearHigh: 0,
  wearCapped: 0,
  growth: 0,
  cutCourse: 0,
  reputation: 0,
  cash: 0,
};

function attentionFor(kind: NarratorFactKind): number {
  const { attention } = C.narrator;
  switch (kind) {
    case 'push':
      return attention.push;
    case 'emptyStation':
      return attention.emptyStation;
    case 'overload':
    case 'crowding':
      return attention.condition;
    default:
      return attention.plate;
  }
}

/** FNV-1a over the fact's identity. Deterministic, and it spends no RNG. */
function variantOf(fact: NarratorFact, variants: number): number {
  if (variants <= 1) return 0;
  const source = `${fact.kind}|${fact.station ?? ''}|${fact.courseId ?? ''}|${fact.cookId ?? ''}|${fact.eveningIndex}`;
  // Annotated, because `as const` gives the constant a literal type.
  let hash: number = C.seed.fnvOffsetBasis;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, C.seed.fnvPrime);
  }
  return Math.abs(hash) % variants;
}

export function templateIdOf(fact: NarratorFact): string {
  return `${fact.kind}${variantOf(fact, VARIANTS[fact.kind]) + 1}`;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function numbersFor(fact: NarratorFact): Record<string, number> {
  switch (fact.kind) {
    case 'overload':
      return {
        load: round1(Number(fact.params.load ?? 0)),
        capacity: round1(Number(fact.params.capacity ?? 0)),
      };
    case 'defect':
    case 'starPlate':
      return { gap: round1(Math.abs(fact.deviation)) };
    default:
      return {};
  }
}

/**
 * The three lines for one evening, most salient first.
 *
 * `used` is the season's repetition budget — the template ids already told. It is
 * not mutated; the caller appends what it decides to show, so a line that never
 * reached the screen never costs its novelty.
 */
export function tellEvening(
  facts: readonly NarratorFact[],
  used: readonly string[] = [],
): NarratorLine[] {
  const seen = new Set(used);
  const scored: { line: NarratorLine; salience: number }[] = [];
  const takenThisEvening = new Set<string>();

  for (const fact of facts) {
    if (VARIANTS[fact.kind] === 0) continue;
    const templateId = templateIdOf(fact);
    // `emptyStation` deviates by nothing by construction — the plate has no Q at
    // all — so magnitude cannot rank it. It is still the most important thing that
    // happened, so it enters on attention alone.
    const magnitude = fact.kind === 'emptyStation' ? 1 : Math.abs(fact.deviation);
    if (magnitude === 0) continue;
    const novelty = seen.has(templateId) ? C.narrator.repeatNovelty : 1;
    scored.push({
      salience: magnitude * attentionFor(fact.kind) * novelty,
      line: {
        templateId,
        station: fact.station,
        cookId: fact.cookId,
        courseId: fact.courseId,
        numbers: numbersFor(fact),
      },
    });
  }

  scored.sort((a, b) => b.salience - a.salience);

  const lines: NarratorLine[] = [];
  for (const { line } of scored) {
    if (lines.length >= C.narrator.maxLinesPerService) break;
    // Never say the same thing twice in one evening, even about different plates:
    // "Pod laťkou: Candát" three times running is a list, not a story.
    if (takenThisEvening.has(line.templateId)) continue;
    takenThisEvening.add(line.templateId);
    lines.push(line);
  }
  return lines;
}
