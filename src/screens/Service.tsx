/**
 * The reveal. PRD §3.1 FR-2 — a replay, nothing more.
 *
 * The result was computed and saved before this screen mounted (CLAUDE.md rule 7),
 * so the cascade cannot change anything and closing the tab mid-way loses nothing.
 * Tapping anywhere skips to the end; `prefers-reduced-motion` shows the finished
 * state immediately.
 */
import { useEffect, useState } from 'react';

import { C } from '../engine/constants';
import { formatNumber, formatSigned, t } from '../i18n';
import { useGame } from '../store/gameStore';
import Docket from '../components/Docket';

const STAGGER_MS = 80;

export default function Service(): React.JSX.Element | null {
  const result = useGame((s) => s.lastResult);
  const finishReveal = useGame((s) => s.finishReveal);
  const reducedMotion = useGame((s) => s.reducedMotion);

  const total = result?.plates.length ?? 0;
  const skipAnimation =
    reducedMotion ||
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const [shown, setShown] = useState(skipAnimation ? total : 0);

  useEffect(() => {
    if (skipAnimation || shown >= total) return;
    const timer = setTimeout(() => setShown((n) => n + 1), STAGGER_MS);
    return () => clearTimeout(timer);
  }, [shown, total, skipAnimation]);

  if (result === null) return null;
  const done = shown >= total;

  // Reveal order affects display only; it never touches the computed data.
  const visible = result.plates.slice(0, shown);

  return (
    <div onClick={() => setShown(total)} role="presentation">
      <header className="spread">
        <h1 className="display" style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>
          {t('service.title')}
        </h1>
        <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
          {t('bar.title')} {formatNumber(result.bar, 1)}
        </span>
      </header>

      <div className="stack" style={{ marginTop: 12, gap: 6 }}>
        {visible.map((plate, index) => (
          <Docket
            key={`${plate.courseId}-${plate.wave}-${index}`}
            plate={plate}
            index={index}
            animate={!skipAnimation}
          />
        ))}
      </div>

      <div className="card" style={{ marginTop: 14 }} aria-live="polite">
        <div className="spread">
          <span className="label">{t('service.total')}</span>
          <span className="mono brass" style={{ fontSize: '19px' }}>
            {formatSigned(result.avgQ - result.bar, 1)}
          </span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('service.defects')}</span>
          <span className="mono" style={{ color: result.defects > 0 ? 'var(--bad)' : 'var(--ok)' }}>
            {done ? result.defects : '—'}
          </span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('service.stars')}</span>
          <span className="mono brass">{done ? result.starPlates : '—'}</span>
        </div>
      </div>

      <button
        type="button"
        className="cta tap"
        onClick={done ? finishReveal : () => setShown(total)}
      >
        {done ? t('service.done') : t('service.skip')}
        <span className="cta__note">
          {shown} / {C.season.coursesPerMenu * C.season.wavesPerEvening}
        </span>
      </button>
    </div>
  );
}
