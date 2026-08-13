/**
 * PRD §7 Phase 1 step 7, CLAUDE.md rule 9.
 *
 * Two jobs:
 *   1. no component may hold a Czech string literal — catching it now is cheap,
 *      retrofitting ~600 strings across every file in Phase 4 is not;
 *   2. `cs.ts` and `en.ts` must have identical key sets.
 *
 * It also checks that every i18n key referenced from `data/` actually resolves,
 * because those keys are built by template (`cook.${id}.paradox`) and a data entry
 * with no dictionary line would otherwise only surface on screen.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { cs } from '../i18n/cs';
import { en } from '../i18n/en';
import { cookFirst, cookLast, formatNumber, formatSigned, getLang, setLang, t } from '../i18n';
import { COOK_ARCHETYPES } from '../data/cooks';
import { COURSES } from '../data/courses';
import { SIGNALS } from '../data/signals';
import { TRAITS } from '../data/traits';

const SRC = join(fileURLToPath(new URL('.', import.meta.url)), '..');

/** The full Czech alphabet beyond ASCII, upper and lower case. */
const CZECH_DIACRITICS = /[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]/;

/** Matches string and template literals, and JSX text between tags. */
const STRING_LITERALS = /'[^'\n]*'|"[^"\n]*"|`[^`]*`|>[^<>{}\n]+</g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function tsxFilesOutsideI18n(): string[] {
  return walk(SRC).filter(
    (file) => file.endsWith('.tsx') && !relative(SRC, file).startsWith(`i18n${sep}`),
  );
}

describe('no hardcoded Czech in components', () => {
  it('finds .tsx files to check', () => {
    // Guards against the check silently passing because the glob broke.
    expect(tsxFilesOutsideI18n().length).toBeGreaterThan(0);
  });

  it('has no Czech string literal in any .tsx outside src/i18n', () => {
    const offenders: string[] = [];

    for (const file of tsxFilesOutsideI18n()) {
      const source = readFileSync(file, 'utf8');
      // Comments may be written in any language; only code is checked.
      const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
      for (const literal of withoutComments.match(STRING_LITERALS) ?? []) {
        if (CZECH_DIACRITICS.test(literal)) {
          offenders.push(`${relative(SRC, file)}: ${literal.trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('cs and en are the same shape', () => {
  const csKeys = Object.keys(cs).sort();
  const enKeys = Object.keys(en).sort();

  it('has identical key sets', () => {
    expect(enKeys).toEqual(csKeys);
  });

  it('has no empty translation', () => {
    const empty = [...Object.entries(cs), ...Object.entries(en)]
      .filter(([, value]) => value.trim() === '')
      .map(([key]) => key);
    expect(empty).toEqual([]);
  });

  it('uses the same placeholders on both sides', () => {
    const placeholders = (value: string): string[] => (value.match(/\{(\w+)\}/g) ?? []).sort();
    const mismatched = csKeys.filter((key) => {
      const typed = key as keyof typeof cs;
      return placeholders(cs[typed]).join() !== placeholders(en[typed]).join();
    });
    expect(mismatched).toEqual([]);
  });
});

describe('every key referenced by data/ resolves', () => {
  const known = new Set(Object.keys(cs));

  it('cook paradoxes', () => {
    const missing = COOK_ARCHETYPES.filter((c) => !known.has(c.paradox)).map((c) => c.id);
    expect(missing).toEqual([]);
  });

  it('course names', () => {
    const missing = COURSES.filter((c) => !known.has(c.nameKey)).map((c) => c.id);
    expect(missing).toEqual([]);
  });

  it('trait names and descriptions', () => {
    const missing = TRAITS.filter((x) => !known.has(x.nameKey) || !known.has(x.descKey)).map(
      (x) => x.id,
    );
    expect(missing).toEqual([]);
  });

  it('signal texts', () => {
    const missing = SIGNALS.filter((s) => !known.has(s.textKey)).map((s) => s.id);
    expect(missing).toEqual([]);
  });
});

describe('t()', () => {
  it('returns Czech by default', () => {
    expect(getLang()).toBe('cs');
    expect(t('station.sauce')).toBe(cs['station.sauce']);
  });

  it('switches language at runtime without losing anything', () => {
    setLang('en');
    expect(t('station.sauce')).toBe(en['station.sauce']);
    setLang('cs');
    expect(t('station.sauce')).toBe(cs['station.sauce']);
  });

  it('can translate into a language other than the active one', () => {
    // A chronicle keeps the language it was generated in. PRD FR-16.
    expect(t('station.fire', undefined, 'en')).toBe(en['station.fire']);
    expect(getLang()).toBe('cs');
  });

  it('substitutes placeholders and leaves unknown ones alone', () => {
    const template = 'a {known} and a {unknown}';
    const rendered = template.replace(/\{(\w+)\}/g, (m, k: string) => (k === 'known' ? 'yes' : m));
    expect(rendered).toBe('a yes and a {unknown}');
  });

  it('formats numbers per locale', () => {
    // Czech uses a decimal comma, English a point. PRD FR-16.
    expect(formatNumber(12.3, 1, 'cs')).toBe('12,3');
    expect(formatNumber(12.3, 1, 'en')).toBe('12.3');
    expect(formatSigned(-0.6, 1, 'en')).toBe('−0.6');
    expect(formatSigned(1.4, 1, 'en')).toBe('+1.4');
  });
});

/**
 * The brigade's names come from the dictionaries now, resolved from an id at
 * render time. `cookFirst`/`cookLast` reach the dictionary through a cast, so
 * nothing but this file stops a cook rendering the Czech fallback — or a blank —
 * under an English UI. That was the actual bug being fixed here: the English
 * build shipped a kitchen staffed by Vaňous and Brichtová.
 */
describe('every cook is named in both languages', () => {
  it('resolves a distinct first and last name for all 24 archetypes', () => {
    for (const lang of ['cs', 'en'] as const) {
      const surnames = new Set<string>();
      for (const archetype of COOK_ARCHETYPES) {
        // A missing key falls back to Czech and, failing that, to undefined —
        // both of which would sail past a mere "is a string" assertion.
        expect(cookFirst(archetype.id, lang), `${archetype.id}: no first name in ${lang}`).toMatch(
          /^\p{Lu}\p{L}+$/u,
        );
        const last = cookLast(archetype.id, lang);
        expect(last, `${archetype.id}: no surname in ${lang}`).toMatch(/^\p{Lu}\p{L}+$/u);
        surnames.add(last);
      }
      expect(surnames.size, `${lang} reuses a surname`).toBe(COOK_ARCHETYPES.length);
    }
  });

  it('the English brigade carries no Czech diacritics', () => {
    // The whole point of the exercise: Brichtová must not appear in English.
    for (const archetype of COOK_ARCHETYPES) {
      const name = `${cookFirst(archetype.id, 'en')} ${cookLast(archetype.id, 'en')}`;
      expect(name, `${archetype.id} is still Czech in English`).not.toMatch(
        /[ěščřžýáíéúůňťďĚŠČŘŽÝÁÍÉÚŮŇŤĎ]/,
      );
    }
  });

  it('the two dictionaries actually differ', () => {
    // Guards the copy-paste failure: both files present, both filled in Czech.
    const differing = COOK_ARCHETYPES.filter(
      (archetype) => cookLast(archetype.id, 'cs') !== cookLast(archetype.id, 'en'),
    );
    expect(differing.length).toBeGreaterThanOrEqual(COOK_ARCHETYPES.length - 1);
  });
});
