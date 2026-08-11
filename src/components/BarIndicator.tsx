/**
 * The bar. Mandatory on every gameplay screen (PRD §3.3 FR-5); tapping it expands
 * the full breakdown, because a bar the player cannot decompose is an unsolvable
 * puzzle.
 */
import { useState } from 'react';

import { C } from '../engine/constants';
import { computeBarBreakdown } from '../engine/bar';
import { formatNumber, formatSigned, t } from '../i18n';
import type { Course } from '../engine/types';

interface Props {
  menu: readonly Course[];
  weekIndex: number;
  reputation: number;
  seasonNumber: number;
}

export default function BarIndicator({
  menu,
  weekIndex,
  reputation,
  seasonNumber,
}: Props): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const b = computeBarBreakdown(menu, weekIndex, reputation, seasonNumber);

  const line = (label: string, value: number): React.JSX.Element => (
    <div className="spread" key={label}>
      <span className="muted" style={{ fontSize: 'var(--fs-small)' }}>
        {label}
      </span>
      <span className="mono" style={{ fontSize: 'var(--fs-small)' }}>
        {formatSigned(value, 1)}
      </span>
    </div>
  );

  return (
    <div className="card" style={{ padding: '10px 12px' }}>
      <button
        type="button"
        className="spread tap"
        style={{ width: '100%' }}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="label">{t('bar.title')}</span>
        <span className="row">
          <span className="mono brass" style={{ fontSize: '20px' }}>
            {formatNumber(b.total, 1)}
          </span>
          <span className="muted" style={{ fontSize: 'var(--fs-small)' }}>
            {open ? '▴' : '▾'}
          </span>
        </span>
      </button>

      {open ? (
        <div style={{ marginTop: 8 }}>
          <div className="spread">
            <span className="muted" style={{ fontSize: 'var(--fs-small)' }}>
              {t('bar.base')}
            </span>
            <span className="mono" style={{ fontSize: 'var(--fs-small)' }}>
              {formatNumber(b.base, 1)}
            </span>
          </div>
          {line(t('bar.ambition'), b.ambition)}
          {line(t('bar.week'), b.week)}
          {line(t('bar.reputation'), b.reputation)}
          {line(t('bar.season'), b.season)}
          {line(t('bar.harmony'), b.harmony)}
          <hr className="divider" style={{ margin: '8px 0' }} />
          <div className="spread">
            <span className="label">{t('bar.total')}</span>
            <span className="mono brass">{formatNumber(b.total, 1)}</span>
          </div>
          <p className="quote" style={{ marginTop: 8, fontSize: 'var(--fs-small)' }}>
            {t('bar.explain', { star: formatNumber(C.outcome.starPlateOffset, 1) })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
