/**
 * Session identity and the play clock.
 *
 * Deliberately outside `src/engine/` — every function here reads a wall clock or
 * `window`, and the engine is forbidden both. Nothing in this file can influence
 * the simulation; it only observes how long someone has been at it.
 *
 * The session id is random per browser *session*, kept in `sessionStorage`. It
 * identifies a sitting, not a person and not a device: close the tab and the
 * next visit is a stranger. That is what keeps this cookieless.
 */
import { C } from '../engine/constants';

/** Storage that never throws — Safari private mode denies writes outright. */
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A denied write means the prompt asks again next time. Losing that is
    // strictly better than a quota error taking the game down with it.
  }
}

let cachedSession: string | null = null;

export function sessionId(): string {
  if (cachedSession !== null) return cachedSession;
  let id: string;
  try {
    id = window.sessionStorage.getItem(C.storage.sessionKey) ?? crypto.randomUUID();
    window.sessionStorage.setItem(C.storage.sessionKey, id);
  } catch {
    id = crypto.randomUUID();
  }
  cachedSession = id;
  return id;
}

interface Clock {
  ms: number;
}

export function playedMs(): number {
  return readJson<Clock>(C.storage.clockKey, { ms: 0 }).ms;
}

/**
 * Counts only while the tab is visible. Wall-clock time would call someone who
 * opened the game and went to lunch a fifteen-minute player, and then ask them
 * about an evening they never saw.
 */
export function startClock(counts: () => boolean = () => true): () => void {
  let timer: ReturnType<typeof setInterval> | undefined;

  const tick = (): void => {
    // Sitting on the title screen is not playing. Somebody left it open five
    // minutes and the game asked them how the game was going.
    if (!counts()) return;
    writeJson(C.storage.clockKey, { ms: playedMs() + C.feedback.clockTickMs });
  };

  const sync = (): void => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
    if (document.visibilityState === 'visible') {
      timer = setInterval(tick, C.feedback.clockTickMs);
    }
  };

  sync();
  document.addEventListener('visibilitychange', sync);

  return () => {
    if (timer !== undefined) clearInterval(timer);
    document.removeEventListener('visibilitychange', sync);
  };
}

interface PromptState {
  /** How many times the ask has been shown, ever, on this browser. */
  shown: number;
  /** Epoch ms before which it must stay quiet. */
  until: number;
}

const NO_PROMPTS: PromptState = { shown: 0, until: 0 };

export function promptState(): PromptState {
  return readJson<PromptState>(C.storage.promptKey, NO_PROMPTS);
}

export function notePromptShown(): void {
  const { shown, until } = promptState();
  writeJson(C.storage.promptKey, { shown: shown + 1, until });
}

/** "Not now" is an answer. It buys a day of silence. */
export function snoozePrompt(): void {
  const { shown } = promptState();
  writeJson(C.storage.promptKey, { shown, until: Date.now() + C.feedback.snoozeMs });
}

/** Answered: never ask again. */
export function silencePrompt(): void {
  writeJson(C.storage.promptKey, {
    shown: C.feedback.maxPrompts,
    until: Number.MAX_SAFE_INTEGER,
  });
}

/**
 * True when the ask has earned its interruption: enough active play for the next
 * threshold, still under the lifetime cap, and past any snooze.
 */
export function promptIsDue(): boolean {
  const { shown, until } = promptState();
  if (shown >= C.feedback.maxPrompts) return false;
  if (Date.now() < until) return false;
  const threshold = shown === 0 ? C.feedback.firstPromptMs : C.feedback.secondPromptMs;
  return playedMs() >= threshold;
}
