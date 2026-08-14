/**
 * What the player did, as opposed to what they say they did.
 *
 * Two generic signals and a handful of game-specific ones. The generic pair
 * earns its place because this UI has already shipped a screen that looked alive
 * and was three-quarters disabled — a rage click is exactly the shape that bug
 * makes in data. The game-specific ones are worth more, because no off-the-shelf
 * tool can know that the interesting question here is whether anybody changes an
 * assignment *after* reading the load percentage.
 *
 * Everything is buffered and posted in batches. A request per click would be
 * both rude and useless.
 */
import { C } from '../engine/constants';
import { type EventRow, postEvents } from './client';
import { isEnabled } from './config';
import { sessionId } from './session';

export type EventName =
  | 'rage_click'
  | 'dead_click'
  | 'help_open'
  | 'pas_dwell'
  | 'assignment_changed_after_load'
  | 'push_used'
  | 'service_started'
  | 'evening_finished'
  | 'session_end'
  | 'feedback_prompt_shown'
  | 'feedback_prompt_declined'
  | 'tour_step'
  | 'tour_skipped'
  | 'tour_done';

interface Context {
  seed: string | null;
  eveningIndex: number | null;
  screen: string | null;
  lang: string;
}

let context: () => Context = () => ({ seed: null, eveningIndex: null, screen: null, lang: 'cs' });

/**
 * The app hands over a way to read the current game, so this file never imports
 * the store — which would leave the store depending on telemetry in turn.
 */
export function setContextProvider(provider: () => Context): void {
  context = provider;
}

let buffer: EventRow[] = [];
let sent = 0;

/** One session cannot post more than this, however long somebody sits there. */
const SESSION_CAP = 300;

export function trackEvent(name: EventName, target?: string | null, value?: number | null): void {
  if (!isEnabled() || sent >= SESSION_CAP) return;
  const now = context();
  buffer.push({
    session_id: sessionId(),
    name,
    target: target ?? null,
    value: value ?? null,
    seed: now.seed,
    evening_index: now.eveningIndex,
    screen: now.screen,
    lang: now.lang,
  });
  sent += 1;
  if (buffer.length >= C.feedback.maxBatch) flushEvents();
}

export function flushEvents(): void {
  if (buffer.length === 0) return;
  const batch = buffer;
  buffer = [];
  postEvents(batch);
}

/** A short, stable label for whatever was clicked. Capped at the column width. */
function describe(target: EventTarget | null): string {
  if (!(target instanceof Element)) return 'unknown';
  const tagged = target.closest<HTMLElement>('[data-track]');
  const explicit = tagged?.dataset['track'];
  if (explicit !== undefined) return explicit.slice(0, 120);

  const actionable = target.closest('button, a, [role="button"], input, select, textarea');
  const el = actionable ?? target;
  const cls = el.className;
  const first = typeof cls === 'string' && cls.trim() !== '' ? cls.trim().split(/\s+/)[0] : '';
  const disabled = el.matches(':disabled, [aria-disabled="true"]') ? '[disabled]' : '';
  return `${el.tagName.toLowerCase()}${first === '' ? '' : `.${first}`}${disabled}`.slice(0, 120);
}

interface Tap {
  t: number;
  x: number;
  y: number;
  /** Same place is not enough. A stacked list of options puts different buttons
   *  within the radius of each other, and answering four questions briskly is
   *  not rage — hammering one control that will not respond is. */
  el: EventTarget | null;
}

export function startTelemetry(): () => void {
  if (!isEnabled()) return () => undefined;

  let lastMutation = performance.now();
  const observer = new MutationObserver(() => {
    lastMutation = performance.now();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });

  let taps: Tap[] = [];

  const onClick = (event: MouseEvent): void => {
    const now = performance.now();

    // Rage: enough taps, close together, in the same small place.
    taps = taps.filter((tap) => now - tap.t < C.feedback.rageWindowMs);
    taps.push({ t: now, x: event.clientX, y: event.clientY, el: event.target });
    const near = taps.filter(
      (tap) =>
        tap.el === event.target &&
        Math.hypot(tap.x - event.clientX, tap.y - event.clientY) <= C.feedback.rageRadiusPx,
    );
    if (near.length >= C.feedback.rageClicks) {
      trackEvent('rage_click', describe(event.target), near.length);
      taps = [];
    }

    // Dead: nothing on the page changed in response. Measured rather than
    // inferred from the element type, because a button that does nothing is the
    // most interesting dead click there is.
    const clickedAt = now;
    const label = describe(event.target);
    window.setTimeout(() => {
      if (lastMutation <= clickedAt) trackEvent('dead_click', label);
    }, C.feedback.deadClickMs);
  };

  // Fired from both, because the first ten sessions produced not one
  // `session_end`: visibilitychange covers backgrounding a tab, and pagehide is
  // the only thing that fires when a tab is simply closed. Which screen a
  // session ends on is the most useful number here, and it was missing.
  let ended = false;
  const finish = (): void => {
    if (ended) return;
    ended = true;
    trackEvent('session_end');
    flushEvents();
  };
  const onHide = (): void => {
    if (document.visibilityState === 'hidden') finish();
  };

  document.addEventListener('click', onClick, true);
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', finish);
  const timer = window.setInterval(flushEvents, C.feedback.flushIntervalMs);

  return () => {
    observer.disconnect();
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('visibilitychange', onHide);
    window.removeEventListener('pagehide', finish);
    window.clearInterval(timer);
    flushEvents();
  };
}
