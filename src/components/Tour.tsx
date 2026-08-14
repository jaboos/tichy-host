/**
 * Four bubbles over the real Pas, pointing at the four things a first evening
 * needs. Not a thirteenth concept — it explains the twelve that exist and then
 * never appears again.
 *
 * It sits on the live screen rather than on pictures of one, on purpose: the
 * numbers under the spotlight are the player's own, so "the bar is 13.1
 * tonight" is true while they are reading it.
 *
 * Anchors are `data-tour` attributes on the Pas. A missing anchor skips its step
 * rather than pointing the bubble at the corner of the page — the tour is
 * scaffolding, and scaffolding must never be the thing that breaks the screen.
 */
import { useCallback, useEffect, useState } from 'react';

import { C } from '../engine/constants';
import { type TKey, t } from '../i18n';

const STEPS = ['suspicion', 'bar', 'stations', 'start'] as const;

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

  const close = useCallback(() => {
    remember();
    setStep(-1);
  }, []);

  useEffect(() => {
    if (step < 0 || step >= STEPS.length) return undefined;

    let raf = 0;
    const measure = (): void => {
      const anchor = document.querySelector(`[data-tour="${STEPS[step] ?? ''}"]`);
      if (anchor === null) {
        // The Pas has not rendered this one — move on rather than stall.
        setStep((current) => (current >= STEPS.length - 1 ? -1 : current + 1));
        return;
      }
      anchor.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      raf = window.requestAnimationFrame(() => {
        const box = anchor.getBoundingClientRect();
        setSpot({ top: box.top, left: box.left, width: box.width, height: box.height });
      });
    };

    // One beat after the screen settles, then again on anything that moves it.
    const timer = window.setTimeout(measure, 140);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(timer);
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step]);

  if (step < 0 || step >= STEPS.length || spot === null) return null;

  const name = STEPS[step] ?? '';
  const last = step === STEPS.length - 1;
  // Below the spotlight, unless that would put the bubble off the bottom.
  const below = spot.top + spot.height < window.innerHeight * 0.62;
  const place = below
    ? { top: spot.top + spot.height + 18 }
    : { bottom: window.innerHeight - spot.top + 18 };

  return (
    <div
      className="tour"
      role="dialog"
      aria-modal="true"
      aria-label={t(`tour.${name}.title` as TKey)}
    >
      <div
        className="tour__hole"
        style={{
          top: spot.top - 8,
          left: spot.left - 8,
          width: spot.width + 16,
          height: spot.height + 16,
        }}
      />
      <div className="tour__bubble" style={place}>
        <p className="tour__step">{t('tour.of', { n: step + 1, total: STEPS.length })}</p>
        <h2 className="h2">{t(`tour.${name}.title` as TKey)}</h2>
        <p className="tour__body">{t(`tour.${name}.body` as TKey)}</p>
        <div className="tour__row">
          <button
            type="button"
            className="cta"
            data-track={`tour-next-${name}`}
            onClick={() => (last ? close() : setStep(step + 1))}
          >
            {last ? t('tour.done') : t('tour.next')}
          </button>
          {last ? null : (
            <button type="button" className="btn-ghost" data-track="tour-skip" onClick={close}>
              {t('tour.skip')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
