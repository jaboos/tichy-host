/**
 * The i18n mechanism. PRD §7 Phase 1 step 6, FR-16, CLAUDE.md rule 9.
 *
 * Hand-rolled on purpose: two languages and ~600 keys do not justify a library
 * (PRD §2.1). What matters is that `TKey` is derived from `cs`, so a missing or
 * misspelled key is a compile error rather than a `??? missing key ???` on screen.
 *
 * Language is module state, not React state, so the engine, the narrator and the
 * chronicle exporter can all call `t()` without a hook. Components subscribe
 * through `subscribe()` in Phase 3; switching mid-season never touches game state.
 */
import { cs, type TKey } from './cs';
import { en } from './en';
import type { Lang } from '../engine/types';

export type { TKey };
export type TParams = Record<string, string | number>;

const DICTIONARIES: Record<Lang, Record<TKey, string>> = { cs, en };

/** BCP-47 tags, for Intl. Czech uses a decimal comma; English a point. */
const LOCALES: Record<Lang, string> = { cs: 'cs-CZ', en: 'en-GB' };

let current: Lang = 'cs';
const listeners = new Set<(lang: Lang) => void>();

export function getLang(): Lang {
  return current;
}

/** Switching is instant and loses nothing — PRD §9 case 16. */
export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  for (const listener of listeners) listener(lang);
}

/** Returns an unsubscribe function. Used by the React binding in Phase 3. */
export function subscribe(listener: (lang: Lang) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const PLACEHOLDER = /\{(\w+)\}/g;

/**
 * Translate. `lang` overrides the current language — the chronicle needs it,
 * because a chronicle keeps the language it was generated in (FR-16).
 *
 * A key missing from the active dictionary falls back to Czech rather than to the
 * raw key, so a half-finished translation degrades into a readable game.
 */
export function t(key: TKey, params?: TParams, lang: Lang = current): string {
  const template = DICTIONARIES[lang][key] ?? cs[key];
  if (params === undefined) return template;
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];
    return value === undefined ? match : String(value);
  });
}

/** `12,3` in Czech, `12.3` in English. PRD FR-16. */
export function formatNumber(value: number, decimals = 1, lang: Lang = current): string {
  return new Intl.NumberFormat(LOCALES[lang], {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/** Signed, for deviations from the bar: `+1,4` / `−0,6`. */
export function formatSigned(value: number, decimals = 1, lang: Lang = current): string {
  const formatted = formatNumber(Math.abs(value), decimals, lang);
  return `${value < 0 ? '−' : '+'}${formatted}`;
}

export function formatPercent(fraction: number, lang: Lang = current): string {
  return new Intl.NumberFormat(LOCALES[lang], {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(fraction);
}

export function formatCurrency(value: number, lang: Lang = current): string {
  return new Intl.NumberFormat(LOCALES[lang], {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0,
  }).format(value);
}

export { cs, en };
