/**
 * The rules that decide whether a player gets interrupted.
 *
 * This is the part of the feedback feature that can go wrong quietly. A broken
 * form throws something somebody notices; a broken gate asks a stranger for
 * their opinion every twenty seconds, and the first report of that is a
 * downvoted Reddit thread. So the gate is tested and the markup is not.
 */
import { beforeEach, describe, expect, it } from 'vitest';

const store = new Map<string, string>();
const shim: Storage = {
  getItem: (key) => store.get(key) ?? null,
  setItem: (key, value) => void store.set(key, value),
  removeItem: (key) => void store.delete(key),
  clear: () => store.clear(),
  key: () => null,
  get length() {
    return store.size;
  },
};
(globalThis as unknown as { window: unknown }).window = { localStorage: shim };
(globalThis as unknown as { localStorage: Storage }).localStorage = shim;

const { C } = await import('../engine/constants');
const { notePromptShown, playedMs, promptIsDue, silencePrompt, snoozePrompt } =
  await import('../telemetry/session');

/** Puts a given amount of active play on the clock. */
function played(ms: number): void {
  store.set(C.storage.clockKey, JSON.stringify({ ms }));
}

describe('the feedback prompt earns its interruption', () => {
  beforeEach(() => {
    store.clear();
  });

  it('stays quiet on a fresh browser', () => {
    expect(playedMs()).toBe(0);
    expect(promptIsDue()).toBe(false);
  });

  it('stays quiet one second short of five minutes', () => {
    played(C.feedback.firstPromptMs - 1000);
    expect(promptIsDue()).toBe(false);
  });

  it('asks once five minutes of play are on the clock', () => {
    played(C.feedback.firstPromptMs);
    expect(promptIsDue()).toBe(true);
  });

  it('does not ask again at six minutes — the second ask waits for fifteen', () => {
    played(C.feedback.firstPromptMs);
    notePromptShown();
    played(6 * 60 * 1000);
    expect(promptIsDue()).toBe(false);

    played(C.feedback.secondPromptMs);
    expect(promptIsDue()).toBe(true);
  });

  it('"not now" buys a day of silence even with the time on the clock', () => {
    played(C.feedback.secondPromptMs);
    snoozePrompt();
    expect(promptIsDue()).toBe(false);

    // Wind the snooze back to a second ago and it is due again.
    const state = JSON.parse(store.get(C.storage.promptKey) ?? '{}') as Record<string, number>;
    store.set(
      C.storage.promptKey,
      JSON.stringify({ shown: state['shown'] ?? 0, until: Date.now() - 1000 }),
    );
    expect(promptIsDue()).toBe(true);
  });

  it('never asks a third time, however long somebody plays', () => {
    played(C.feedback.secondPromptMs);
    notePromptShown();
    notePromptShown();
    played(10 * 60 * 60 * 1000);
    expect(promptIsDue()).toBe(false);
  });

  it('goes silent for good once the form has been sent', () => {
    played(C.feedback.secondPromptMs);
    silencePrompt();
    expect(promptIsDue()).toBe(false);
  });

  it('survives storage that refuses to be read', () => {
    store.set(C.storage.promptKey, '{ not json');
    played(C.feedback.firstPromptMs);
    // A corrupt record must not throw into the render, and must not be read as
    // "already asked twice" either — that would silence a real player.
    expect(() => promptIsDue()).not.toThrow();
    expect(promptIsDue()).toBe(true);
  });
});

/**
 * Postgres has a check constraint on each closed question. A value the UI can
 * produce but the column rejects fails at insert time, in production, on a
 * stranger's browser — so the two lists are held against each other here.
 */
describe('every offered answer has words in both languages', () => {
  const ALLOWED: Record<string, readonly string[]> = {
    'fb.q1': ['finished', 'bored', 'stuck', 'broken', 'no_time'],
    'fb.q2': ['used', 'saw', 'never', 'unseen'],
    'fb.q3': ['expected', 'better', 'worse', 'coinflip', 'not_far'],
    'fb.q4': ['deliberate', 'curious', 'saw', 'unknown'],
  };

  it('resolves all eighteen options in cs and en', async () => {
    const { cs } = await import('../i18n/cs');
    const { en } = await import('../i18n/en');

    let checked = 0;
    for (const [question, options] of Object.entries(ALLOWED)) {
      expect(cs, `${question} itself is missing`).toHaveProperty([question]);
      for (const option of options) {
        const key = `${question}.${option}`;
        expect(cs, `${key} missing from cs.ts`).toHaveProperty([key]);
        expect(en, `${key} missing from en.ts`).toHaveProperty([key]);
        checked += 1;
      }
    }
    expect(checked, 'the option lists were empty').toBe(18);
  });
});
