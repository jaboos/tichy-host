/**
 * One station. PRD §3.1 FR-1 item 4.
 *
 * A station card must always NAME the people standing at it. Playtested
 * regression: the cards showed `4/2,0` and nothing else, so the screen about
 * people had no people on it — and because the name chips from `Pas.dc.html` were
 * missing, there was no target to tap and a cook could not be unassigned at all.
 *
 * The helper lives INSIDE this card, never as a separate card floating under the
 * grid, so the 2 × 2 grid stays exactly four cards of equal height.
 */
import { formatNumber, t } from '../i18n';
import type { StationSetup } from '../engine/plate';
import type { Cook, Station } from '../engine/types';

interface Props {
  setup: StationSetup;
  station: Station;
  /** Opens that cook's own picker — the mockup gesture does something sensible. */
  onPickCook: (cookId: string) => void;
}

function NameChip({
  cook,
  roleKey,
  onPick,
}: {
  cook: Cook;
  roleKey: 'pas.lead' | 'pas.helper';
  onPick: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      className="chip tap"
      style={{ justifyContent: 'space-between', width: '100%', gap: 6 }}
      onClick={onPick}
    >
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cook.lastName}</span>
      <span className="label" style={{ fontSize: 'var(--fs-micro)' }}>
        {t(roleKey)}
      </span>
    </button>
  );
}

export default function StationDisk({ setup, station, onPickCook }: Props): React.JSX.Element {
  const ratio = setup.capacity > 0 ? setup.load / setup.capacity : Number.POSITIVE_INFINITY;
  const overloaded = setup.overload > 0;
  const tone =
    !setup.viable || overloaded ? 'var(--bad)' : ratio > 0.8 ? 'var(--warn)' : 'var(--ok)';
  const percent = Number.isFinite(ratio) ? Math.round(ratio * 100) : 999;

  return (
    <section
      className="card"
      style={{
        padding: 10,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        height: '100%',
      }}
      aria-label={t(`station.${station}`)}
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

      <div
        style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}
      >
        <div className="label">{t(`station.${station}`)}</div>

        {setup.lead === null ? (
          <div className="chip chip--bad" style={{ justifyContent: 'center' }}>
            {t('pas.noHands')}
          </div>
        ) : (
          <NameChip
            cook={setup.lead}
            roleKey="pas.lead"
            onPick={() => onPickCook(setup.lead!.id)}
          />
        )}

        {setup.helper === null ? (
          <div
            className="chip muted"
            style={{
              justifyContent: 'center',
              borderStyle: 'dashed',
              opacity: 0.7,
            }}
          >
            {t('pas.addHelper')}
          </div>
        ) : (
          <NameChip
            cook={setup.helper}
            roleKey="pas.helper"
            onPick={() => onPickCook(setup.helper!.id)}
          />
        )}

        <div style={{ marginTop: 'auto' }}>
          <div className="row" style={{ alignItems: 'baseline', gap: 6 }}>
            <span className="mono" style={{ fontSize: '19px', color: tone }}>
              {setup.viable ? `${percent}%` : '—'}
            </span>
          </div>
          {/* Labelled, never a bare `4/2,0` (FR-1 item 4) — but the words sit
              above the numbers rather than between them, so the figure stops
              wrapping mid-phrase in a half-width card. */}
          <div className="label" style={{ fontSize: 'var(--fs-micro)', marginTop: 3 }}>
            {t('pas.load')} / {t('pas.capacity')}
          </div>
          <div className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
            {formatNumber(setup.load, 0)} / {formatNumber(setup.capacity, 1)}
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

          {overloaded ? (
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
      </div>
    </section>
  );
}
