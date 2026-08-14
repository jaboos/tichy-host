/**
 * Nine bubbles over the real Pas: what the numbers mean, then how to move
 * people between stations, then the one call an evening allows, then how to
 * commit. Not a thirteenth concept — it explains the twelve that exist, and it
 * can be replayed from the header at any time.
 *
 * It sits on the live screen rather than on pictures of one, on purpose: the
 * numbers under the spotlight are the player's own, so "the bar is 13.1
 * tonight" is true while they are reading it.
 *
 * Anchors are `data-tour` attributes. Three of them — the picker and its release
 * chip — only exist once a slot is open, so a missing anchor makes the step WAIT
 * with its instruction on screen rather than skip. The waiting is the teaching.
 * Nothing ever blocks a click, so the tour can guide but never trap.
 */
import { useCallback, useEffect, useState } from 'react';

import { C } from '../engine/constants';
import { type TKey, t } from '../i18n';
import { trackEvent } from '../telemetry/events';

/**
 * Read top to bottom, this is a first evening: what the numbers mean, then how
 * to move people, then how to spend the one call, then how to commit.
 *
 * `slot-lead`, `picker` and `picker-release` only exist once a slot is open, so
 * those steps wait for their anchor instead of skipping it — waiting is what
 * makes the sequence feel like instruction rather than a slideshow.
 */
const STEPS = [
  'suspicion',
  'bar',
  'stations',
  'slot-lead',
  'picker',
  'picker-release',
  'slot-helper',
  'intervention',
  'start',
] as const;

/** Dispatch on `window` to run the tutorial again from anywhere. */
export const OPEN_EVENT = 'tour:open';

export function openTour(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * Module state rather than a prop, because the only consumer is the feedback
 * ask, which is a sibling. Caught in the browser: five minutes of walking the
 * tutorial is still five minutes of play, so the ask fired on top of a bubble
 * and the screen had two dialogs on it at once.
 */
let running = false;

export function tourIsRunning(): boolean {
  return running;
}

interface Spot {
  top: number;
  left: number;
  width: number;
  height: number;
}

function seen(): boolean {
  try {
    return window.localStorage.getItem(C.storage.tourKey) === '1';
  } catch {
    return true; // Storage denied: rather no tour at all than one on every load.
  }
}

function remember(): void {
  try {
    window.localStorage.setItem(C.storage.tourKey, '1');
  } catch {
    // It may run once more. That is the harmless direction to fail in.
  }
}

export default function Tour(): React.JSX.Element | null {
  const [step, setStep] = useState<number>(() => (seen() ? -1 : 0));
  const [spot, setSpot] = useState<Spot | null>(null);

  // Which step a tutorial dies on was the question the first ten sessions could
  // not answer, because nothing recorded it.
  useEffect(() => {
    const at = STEPS[step];
    if (at !== undefined) trackEvent('tour_step', at, step + 1);
  }, [step]);

  // After commit, never during render: reassigning module state while rendering
  // is what breaks under concurrent React, and eslint is right to refuse it.
  useEffect(() => {
    running = step >= 0 && step < STEPS.length;
    return () => {
      running = false;
    };
  }, [step]);

  const close = useCallback((completed: boolean, at: string) => {
    remember();
    trackEvent(completed ? 'tour_done' : 'tour_skipped', at);
    setStep(-1);
  }, []);

  // Re-runnable from the header, at any time, from any screen state.
  useEffect(() => {
    const again = (): void => {
      setSpot(null);
      setStep(0);
    };
    window.addEventListener(OPEN_EVENT, again);
    return () => window.removeEventListener(OPEN_EVENT, again);
  }, []);

  useEffect(() => {
    if (step < 0 || step >= STEPS.length) return undefined;

    let raf = 0;
    // Whether the NEXT step's anchor was already on screen when this one began.
    // If it was not, and it appears, the player has just done the thing this
    // step asked for — so the tutorial follows them instead of making them
    // press Next to catch up with their own click.
    const nextName = STEPS[step + 1];
    const nextWasThere =
      nextName === undefined || document.querySelector(`[data-tour="${nextName}"]`) !== null;

    const measure = (): void => {
      if (
        !nextWasThere &&
        nextName !== undefined &&
        document.querySelector(`[data-tour="${nextName}"]`) !== null
      ) {
        setStep(step + 1);
        return;
      }

      const anchor = document.querySelector(`[data-tour="${STEPS[step] ?? ''}"]`);
      if (anchor === null) {
        // Not on screen yet, because this step is telling the player to make it
        // appear. Keep the bubble and drop the spotlight rather than skipping —
        // the waiting IS the instruction.
        setSpot(null);
        return;
      }
      anchor.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      raf = window.requestAnimationFrame(() => {
        const box = anchor.getBoundingClientRect();
        setSpot({ top: box.top, left: box.left, width: box.width, height: box.height });
      });
    };

    measure();
    // Polled rather than observed: the anchor may be mounted by a click that
    // happens seconds from now, and a MutationObserver over the whole Pas would
    // fire on every wear figure that ticks.
    const poll = window.setInterval(measure, 250);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearInterval(poll);
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  if (step < 0 || step >= STEPS.length) return null;

  const name = STEPS[step] ?? '';
  const last = step === STEPS.length - 1;
  /**
   * Below the anchor when the bubble fits there; otherwise pinned to the bottom.
   *
   * It is never placed *above*, which is what an earlier version did: with a
   * tall anchor like the cook list, `bottom: innerHeight - spot.top` pushed the
   * bubble's own heading off the top of the screen. A height threshold only
   * moved the boundary — the list measured 410px against a 422px cutoff and
   * still broke. Two placements with a fits-check cannot fail that way.
   */
  const ROOM = 260;
  const below = spot !== null && spot.top + spot.height + 18 + ROOM < window.innerHeight;
  const place = below && spot !== null ? { top: spot.top + spot.height + 18 } : { bottom: 16 };

  return (
    <div
      className="tour"
      role="dialog"
      aria-modal="true"
      aria-label={t(`tour.${name}.title` as TKey)}
    >
      {spot === null ? null : (
        <div
          className="tour__hole"
          style={{
            top: spot.top - 8,
            left: spot.left - 8,
            width: spot.width + 16,
            height: spot.height + 16,
          }}
        />
      )}
      <div className="tour__bubble" style={place}>
        <p className="tour__step">{t('tour.of', { n: step + 1, total: STEPS.length })}</p>
        <h2 className="h2">{t(`tour.${name}.title` as TKey)}</h2>
        <p className="tour__body">{t(`tour.${name}.body` as TKey)}</p>
        {spot === null ? <p className="tour__wait">{t('tour.waiting')}</p> : null}
        <div className="tour__row">
          <button
            type="button"
            className="cta"
            data-track={`tour-next-${name}`}
            onClick={() => (last ? close(true, name) : setStep(step + 1))}
          >
            {last ? t('tour.done') : t('tour.next')}
          </button>
          {last ? null : (
            <button
              type="button"
              className="btn-ghost"
              data-track="tour-skip"
              onClick={() => close(false, name)}
            >
              {t('tour.skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
