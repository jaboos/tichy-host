/**
 * localStorage — PRD §3.10 FR-14, §4.3, §9 case 13.
 *
 * Three rules, in order of importance: never crash, never silently wipe, and
 * always keep the RNG state so a reload cannot re-roll a service. Anything that
 * cannot be read or migrated is archived under the backup key before the game
 * starts fresh, so a corrupt save is recoverable by hand rather than gone.
 */

import { C } from '../engine/constants';
import type { ChronicleEntry, GameState, Lang, Prefs, SaveEnvelope } from '../engine/types';

export function isStorageAvailable(): boolean {
  try {
    const probe = '__tichy_host_probe__';
    localStorage.setItem(probe, probe);
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // A full or disabled store must not take the game down with it.
    return false;
  }
}

function archive(raw: string): void {
  try {
    localStorage.setItem(C.storage.backupKey, raw);
  } catch {
    /* If even the archive fails there is nothing further to try. */
  }
}

/**
 * Structural check rather than a type assertion: a save is player data and may be
 * anything at all by the time it comes back.
 */
function looksLikeGame(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const game = value as Partial<GameState>;
  return (
    typeof game.seed === 'string' &&
    typeof game.rngState === 'number' &&
    typeof game.eveningIndex === 'number' &&
    Array.isArray(game.cooks) &&
    // Every cook must carry its declined name forms; a save from before they
    // existed is archived and restarted rather than rendering "undefined".
    game.cooks.every(
      (cook: unknown) =>
        typeof cook === 'object' &&
        cook !== null &&
        typeof (cook as { lastNameIns?: unknown }).lastNameIns === 'string',
    ) &&
    Array.isArray(game.catalogue) &&
    Array.isArray(game.menu) &&
    Array.isArray(game.visitEvenings) &&
    Array.isArray(game.visits) &&
    Array.isArray(game.history) &&
    typeof game.cash === 'number' &&
    typeof game.reputation === 'number'
  );
}

/**
 * Bring an older save forward. There is only one schema version so far, so this
 * is a hook with a shape rather than a ladder — but the shape matters: an
 * unmigratable save returns null and is archived, never dropped.
 */
export function migrate(envelope: SaveEnvelope): GameState | null {
  if (envelope.game === null) return null;
  if (envelope.version === C.storage.version) {
    return looksLikeGame(envelope.game) ? envelope.game : null;
  }
  return null;
}

export function loadGame(): GameState | null {
  const raw = readRaw(C.storage.gameKey);
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    archive(raw);
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || !('version' in parsed)) {
    archive(raw);
    return null;
  }

  const migrated = migrate(parsed as SaveEnvelope);
  if (migrated === null && (parsed as SaveEnvelope).game !== null) archive(raw);
  return migrated;
}

/** Called after every evening, with the RNG state already inside `game`. */
export function saveGame(game: GameState | null): boolean {
  const envelope: SaveEnvelope = { version: C.storage.version, game };
  return write(C.storage.gameKey, envelope);
}

export function clearGame(): void {
  saveGame(null);
}

const DEFAULT_PREFS: Prefs = { lang: 'cs', reducedMotion: false };

export function loadPrefs(): Prefs {
  const raw = readRaw(C.storage.prefsKey);
  if (raw === null) return { ...DEFAULT_PREFS };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_PREFS };
    const prefs = parsed as Partial<Prefs>;
    return {
      lang: prefs.lang === 'en' || prefs.lang === 'cs' ? prefs.lang : DEFAULT_PREFS.lang,
      reducedMotion:
        typeof prefs.reducedMotion === 'boolean'
          ? prefs.reducedMotion
          : DEFAULT_PREFS.reducedMotion,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: Prefs): void {
  write(C.storage.prefsKey, prefs);
}

export function loadChronicles(): ChronicleEntry[] {
  const raw = readRaw(C.storage.chronicleKey);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChronicleEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendChronicle(entry: ChronicleEntry): void {
  write(C.storage.chronicleKey, [...loadChronicles(), entry]);
}

/** The language the player last chose, before any game exists. */
export function preferredLang(): Lang {
  return loadPrefs().lang;
}
