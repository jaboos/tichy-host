/**
 * The narrator, PRD §3.11 FR-17.
 *
 * Every assertion here names something concrete that has to be true of the output
 * — which line, how many, in what order. A test that only checked "it returned an
 * array" would pass on an empty one, and an empty narrator is exactly the failure
 * mode worth guarding: silence is information only when there is nothing to say.
 */
import { describe, expect, it } from 'vitest';

import { C } from '../engine/constants';
import { tellEvening, templateIdOf } from '../engine/narrator';
import { cs } from '../i18n/cs';
import type { NarratorFact, NarratorFactKind } from '../engine/types';

function fact(
  kind: NarratorFactKind,
  deviation: number,
  over: Partial<NarratorFact> = {},
): NarratorFact {
  return {
    kind,
    eveningIndex: 3,
    station: 'fire',
    cookId: 'ryba',
    courseId: 'zverinovySteak',
    deviation,
    params: {},
    ...over,
  };
}

describe('the narrator says at most three things', () => {
  it('never exceeds the service limit however many facts arrive', () => {
    const kinds: NarratorFactKind[] = ['defect', 'starPlate', 'overload', 'crowding', 'push'];
    const many = Array.from({ length: 40 }, (_, i) =>
      fact(kinds[i % kinds.length] ?? 'defect', -(i + 1), {
        courseId: `course${i}`,
        eveningIndex: i,
      }),
    );
    expect(tellEvening(many)).toHaveLength(C.narrator.maxLinesPerService);
  });

  it('an evening of nothing but defects is two lines, not six', () => {
    // The same template twice in one evening is a list, not a story, so a run of
    // identical facts runs out of ways to be said long before it runs out of facts.
    const six = Array.from({ length: 6 }, (_, i) =>
      fact('defect', -(i + 1), { courseId: `course${i}`, eveningIndex: i }),
    );
    const lines = tellEvening(six);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    expect(lines.length).toBeLessThanOrEqual(2);
  });

  it('says nothing about an evening where nothing deviated', () => {
    expect(tellEvening([])).toEqual([]);
    expect(tellEvening([fact('defect', 0)])).toEqual([]);
  });

  it('ranks the larger deviation first', () => {
    const lines = tellEvening([
      fact('defect', -0.4, { courseId: 'small', station: 'cold' }),
      fact('starPlate', 9.1, { courseId: 'big', station: 'sauce' }),
    ]);
    expect(lines[0]?.courseId).toBe('big');
    expect(lines[1]?.courseId).toBe('small');
  });

  it('weights a station the player pushed above one that merely ran hot', () => {
    // Same magnitude: attention is the only thing that can separate them.
    const lines = tellEvening([
      fact('overload', 2, { station: 'cold', courseId: null }),
      fact('push', 2, { station: 'sauce', courseId: null }),
    ]);
    expect(lines[0]?.station).toBe('sauce');
  });

  it('tells an empty station even though it deviates by nothing', () => {
    const lines = tellEvening([fact('emptyStation', 0, { station: 'dessert' })]);
    expect(lines).toHaveLength(1);
    expect(lines[0]?.templateId.startsWith('emptyStation')).toBe(true);
  });
});

describe('the repetition budget', () => {
  it('demotes a template already told this season', () => {
    const spent = fact('defect', -3, { courseId: 'told', station: 'cold' });
    const fresh = fact('starPlate', 2, { courseId: 'new', station: 'sauce' });

    // Untouched budget: the bigger deviation wins.
    expect(tellEvening([spent, fresh])[0]?.courseId).toBe('told');

    // With the defect's template already spent, novelty 0.35 drops 3 to 1.05 and
    // the smaller but unheard line goes first.
    const used = [templateIdOf(spent)];
    expect(tellEvening([spent, fresh], used)[0]?.courseId).toBe('new');
  });

  it('never says the same template twice in one evening', () => {
    const three = ['a', 'b', 'c'].map((id) =>
      fact('defect', -5, { courseId: id, station: 'fire', eveningIndex: 3 }),
    );
    const lines = tellEvening(three);
    expect(new Set(lines.map((line) => line.templateId)).size).toBe(lines.length);
  });
});

describe('every template the narrator can pick exists in the dictionary', () => {
  const kinds: NarratorFactKind[] = [
    'defect',
    'starPlate',
    'emptyStation',
    'overload',
    'crowding',
    'push',
  ];

  it('resolves for every kind and every variant', () => {
    const ids = new Set<string>();
    for (const kind of kinds) {
      // Vary the hash source until both variants of each kind have been produced.
      for (let evening = 0; evening < 40; evening += 1) {
        ids.add(templateIdOf(fact(kind, -1, { eveningIndex: evening })));
      }
    }
    expect(ids.size).toBeGreaterThanOrEqual(kinds.length);
    for (const id of ids) {
      expect(cs, `narrator.${id} is missing from cs.ts`).toHaveProperty([`narrator.${id}`]);
    }
  });

  /**
   * Neither cooks nor the player have a gender anywhere in the data, so any Czech
   * past participle addressed to them is a coin flip: "přitlačil jsi" is simply
   * wrong for half the audience and for Bartáková on the first evening of the
   * game. The whole dictionary is checked, not just the narrator — the report card
   * shipped with exactly this mistake and it was the browser that caught it.
   */
  it('no Czech string addresses the player with a gendered participle', () => {
    const gendered = /\b\w+(il|ila|ilo|el|ela|elo|al|ala|alo)\s+(jsi|jsem|jste)\b/;
    let checked = 0;
    for (const [key, value] of Object.entries(cs)) {
      checked += 1;
      expect(value, `${key} agrees with a gender the data does not have`).not.toMatch(gendered);
    }
    expect(checked, 'the dictionary was not read').toBeGreaterThan(300);
  });
});
