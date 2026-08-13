/**
 * The reveal. PRD §3.1 FR-2 — a replay, nothing more.
 *
 * The result was computed and saved before this screen mounted (CLAUDE.md rule 7),
 * so the cascade cannot change anything and closing the tab mid-way loses nothing.
 * Tapping anywhere skips to the end; `prefers-reduced-motion` and the "straight to
 * the result" button on the Pas both show the finished board immediately.
 *
 * Dockets clip onto a steel rail down the left edge and arrive one `--stagger`
 * apart. That interval had two homes — a `STAGGER_MS = 80` here and `--stagger` in
 * tokens.css — and they had already drifted. The CSS owns it now.
 */
import { useEffect, useState } from 'react';

import { C } from '../engine/constants';
import { formatNumber, formatSigned, t } from '../i18n';
import { useGame } from '../store/gameStore';
import Docket from '../components/Docket';

/**
 * The one place `--stagger` is read. Falling back to 0 rather than to a number is
 * deliberate: under jsdom the stylesheet is not loaded, and a hardcoded fallback
 * would quietly become a second source of truth again.
 */
function staggerMs(): number {
  if (typeof window === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--stagger');
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function Service(): React.JSX.Element | null {
  const result = useGame((s) => s.lastResult);
  const finishReveal = useGame((s) => s.finishReveal);
  const reducedMotion = useGame((s) => s.reducedMotion);
  const skipReveal = useGame((s) => s.skipReveal);

  const total = result?.plates.length ?? 0;
  const skipAnimation =
    reducedMotion ||
    skipReveal ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const [shown, setShown] = useState(skipAnimation ? total : 0);

  useEffect(() => {
    if (skipAnimation || shown >= total) return;
    const timer = setTimeout(() => setShown((n) => n + 1), staggerMs());
    return () => clearTimeout(timer);
  }, [shown, total, skipAnimation]);

  if (result === null) return null;
  const done = shown >= total;

  // Reveal order affects display only; it never touches the computed data.
  const deviation = result.avgQ - result.bar;

  return (
    <div onClick={() => setShown(total)} role="presentation">
      <header className="spread" style={{ alignItems: 'baseline' }}>
        <div className="row" style={{ gap: 9, alignItems: 'baseline' }}>
          <span className="label">{t('bar.title')}</span>
          <span className="mono" style={{ fontSize: 22 }}>
            {formatNumber(result.bar, 1)}
          </span>
        </div>
        <span
          className="mono muted"
          style={{ fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-label)' }}
        >
          {t('service.plates', { n: C.season.coursesPerMenu * C.season.wavesPerEvening })}
        </span>
      </header>

      {/* The rail is what the dockets hang from — it is why they enter from the
          right and why a defect visibly falls off it. */}
      <div style={{ position: 'relative', marginTop: 14, paddingLeft: 16 }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 9,
            borderRadius: 3,
            background: 'var(--rail)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lift)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              width: 22,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.5), transparent)',
              animation: skipAnimation ? undefined : 'zablesk 5s var(--ease-out) infinite',
            }}
          />
        </div>

        {/* Every plate is in the DOM from the first frame; the cascade only
            uncovers them. Slicing the list instead made the page grow twelve
            times and shifted everything below it — §8.3 asks for none of that. */}
        <div className="stack" style={{ gap: 8 }}>
          {result.plates.map((plate, index) => (
            <Docket
              key={`${plate.courseId}-${plate.wave}-${index}`}
              plate={plate}
              arrived={index < shown}
              animate={!skipAnimation}
            />
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }} aria-live="polite">
        <div className="spread">
          <span className="label">{t('service.defects')}</span>
          <span className="mono" style={{ color: result.defects > 0 ? 'var(--bad)' : 'var(--ok)' }}>
            {done ? result.defects : t('common.none')}
          </span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('service.stars')}</span>
          <span className="mono brass">{done ? result.starPlates : t('common.none')}</span>
        </div>
      </div>

      <div className="dock">
        <div>
          <div className="label" style={{ fontSize: 'var(--fs-micro)' }}>
            {t('service.avgDeviation')}
          </div>
          <div
            className="mono"
            style={{
              marginTop: 2,
              fontSize: 'var(--fs-num)',
              color: deviation >= 0 ? 'var(--ok)' : 'var(--bad)',
              animation: 'tik var(--dur-count) var(--ease-out) both',
            }}
          >
            {done ? formatSigned(deviation, 2) : t('common.none')}
          </div>
        </div>
        <button type="button" className="cta" onClick={done ? finishReveal : () => setShown(total)}>
          {done ? t('service.done') : t('service.skip')}
          <span className="cta__note">
            {shown} / {C.season.coursesPerMenu * C.season.wavesPerEvening}
          </span>
        </button>
      </div>
    </div>
  );
}
