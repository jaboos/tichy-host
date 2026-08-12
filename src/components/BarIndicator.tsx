/**
 * The bar. Mandatory on every gameplay screen (PRD §3.3 FR-5); tapping it expands
 * the full breakdown, because a bar the player cannot decompose is an unsolvable
 * puzzle.
 *
 * The header carries one derived figure beside the number: the star threshold,
 * `bar + C.outcome.starPlateOffset`. The visual direction put a "target bar" there
 * instead — the engine has no such quantity, and a number the game does not
 * compute is a lie told with a decimal point (CLAUDE.md rule 6).
 *
 * The six lines below are the six terms `computeBarBreakdown` actually returns.
 * Wear is not among them; it goes into plate quality, never into the bar.
 */
import { useState } from 'react';

import { C } from '../engine/constants';
import { computeBarBreakdown } from '../engine/bar';
import { formatNumber, formatSigned, t } from '../i18n';
import Glossary from './Glossary';
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
    <div className="spread" key={label} style={{ alignItems: 'baseline', padding: '5px 0' }}>
      <span className="muted" style={{ fontSize: 'var(--fs-small)' }}>
        {label}
      </span>
      <span className="mono" style={{ fontSize: 'var(--fs-num-sm)' }}>
        {formatSigned(value, 1)}
      </span>
    </div>
  );

  return (
    <div className="card" style={{ padding: '12px 14px' }}>
      {/* The label carries the toggle, the hint carries the glossary. Nesting a
          button inside a button would be invalid, so the row is a plain flex. */}
      <div className="spread">
        <button
          type="button"
          className="row"
          style={{ gap: 10, alignItems: 'baseline' }}
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={t('bar.title')}
        >
          <span className="label">{t('bar.title')}</span>
          <span
            className="mono"
            style={{
              fontSize: 'var(--fs-num-lg)',
              lineHeight: 1,
              letterSpacing: 'var(--ls-mono)',
              color: 'var(--ink)',
              animation: 'tik var(--dur-count) var(--ease-out) both',
            }}
          >
            {formatNumber(b.total, 1)}
          </span>
        </button>
        <div className="row" style={{ gap: 2 }}>
          <span className="mono muted" style={{ fontSize: 'var(--fs-micro)' }}>
            {t('bar.starFrom', {
              n: formatNumber(b.total + C.outcome.starPlateOffset, 1),
            })}
          </span>
          <Glossary of="latka" />
        </div>
      </div>

      {open ? (
        <div
          style={{
            marginTop: 12,
            borderTop: '1px solid var(--line)',
            paddingTop: 10,
            overflow: 'hidden',
            animation: 'rozlozeni var(--dur-base) var(--ease-out) both',
          }}
        >
          <div className="spread" style={{ alignItems: 'baseline', padding: '5px 0' }}>
            <span className="muted" style={{ fontSize: 'var(--fs-small)' }}>
              {t('bar.base')}
            </span>
            <span className="mono muted" style={{ fontSize: 'var(--fs-num-sm)' }}>
              {formatNumber(b.base, 1)}
            </span>
          </div>
          {line(t('bar.ambition'), b.ambition)}
          {line(t('bar.week'), b.week)}
          {line(t('bar.reputation'), b.reputation)}
          {line(t('bar.season'), b.season)}
          {line(t('bar.harmony'), b.harmony)}

          <div
            className="row"
            style={{ gap: 8, marginTop: 6, paddingTop: 8, borderTop: '1px dashed var(--line)' }}
          >
            <span
              className="brass"
              aria-hidden="true"
              style={{
                fontSize: 'var(--fs-small)',
                animation: 'hvezdaVstup var(--dur-base) var(--ease-drop) both',
              }}
            >
              ★
            </span>
            <span className="muted" style={{ fontSize: 'var(--fs-small)' }}>
              {t('bar.belowIsDefect')}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
