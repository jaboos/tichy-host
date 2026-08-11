/**
 * One station's load. PRD §3.1 FR-1: a colour ramp green → amber → red, and when
 * the station is overloaded a breathing glow plus the PŘETÍŽENO badge.
 *
 * This is the element the playtest gate is about — ten seconds on this screen and
 * more than half the room should point at the station that is about to fail.
 */
import { formatNumber, t } from '../i18n';
import type { StationSetup } from '../engine/plate';
import type { Station } from '../engine/types';

interface Props {
  setup: StationSetup;
  station: Station;
  onSelect?: () => void;
  selected?: boolean;
}

export default function StationDisk({
  setup,
  station,
  onSelect,
  selected = false,
}: Props): React.JSX.Element {
  const ratio = setup.capacity > 0 ? setup.load / setup.capacity : Number.POSITIVE_INFINITY;
  const overloaded = setup.overload > 0;
  const tone =
    !setup.viable || overloaded ? 'var(--bad)' : ratio > 0.8 ? 'var(--warn)' : 'var(--ok)';
  const percent = Number.isFinite(ratio) ? Math.round(ratio * 100) : 999;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={selected ? 'card card--lifted' : 'card'}
      style={{ padding: 10, textAlign: 'left', position: 'relative', overflow: 'hidden' }}
      aria-label={`${t(`station.${station}`)} ${percent}%`}
    >
      {overloaded ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: '-30%',
            background: 'radial-gradient(circle, rgba(201,80,63,.55), transparent 62%)',
            animation: 'zar 1.9s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      ) : null}

      <div style={{ position: 'relative' }}>
        <div className="label">{t(`station.${station}`)}</div>
        <div className="row" style={{ marginTop: 6, alignItems: 'baseline' }}>
          <span className="mono" style={{ fontSize: '19px', color: tone }}>
            {setup.viable ? `${percent}%` : '—'}
          </span>
          <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
            {formatNumber(setup.load, 0)}/{formatNumber(setup.capacity, 1)}
          </span>
        </div>

        <div
          aria-hidden="true"
          style={{
            marginTop: 6,
            height: 4,
            borderRadius: 2,
            background: 'var(--line)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, Number.isFinite(ratio) ? ratio * 100 : 100)}%`,
              height: '100%',
              background: tone,
            }}
          />
        </div>

        {!setup.viable ? (
          <div className="chip chip--bad" style={{ marginTop: 7, display: 'inline-block' }}>
            {t('pas.noHands')}
          </div>
        ) : overloaded ? (
          <div
            className="chip chip--bad"
            style={{
              marginTop: 7,
              display: 'inline-block',
              animation: 'puls 1.9s ease-in-out infinite',
            }}
          >
            {t('pas.overloaded')}
          </div>
        ) : null}
      </div>
    </button>
  );
}
