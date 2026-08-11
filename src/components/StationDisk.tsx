/**
 * One station, and the control the whole Pas turns on. PRD §3.1 FR-1 item 4 and
 * FR-1a as amended.
 *
 * The card names the people standing at it and carries their wear, so the two
 * things a staffing decision needs — who is here and how worn they are — sit next
 * to the load figure that decides whether it matters. Tapping a place opens the
 * list of people who could stand there; the card stays visible above it, which is
 * the whole point of moving assignment here from the cook rows.
 */
import { C } from '../engine/constants';
import { formatNumber, t } from '../i18n';
import { slotEquals, type SlotRef } from '../store/gameStore';
import type { StationSetup } from '../engine/plate';
import type { Cook, CookRole, Station } from '../engine/types';

interface Props {
  setup: StationSetup;
  station: Station;
  openSlot: SlotRef | null;
  onOpenSlot: (slot: SlotRef) => void;
}

function Slot({
  cook,
  station,
  role,
  active,
  onOpen,
}: {
  cook: Cook | null;
  station: Station;
  role: CookRole;
  active: boolean;
  onOpen: () => void;
}): React.JSX.Element {
  const nearCap = cook !== null && cook.wear >= C.wear.warningThreshold;
  const empty = cook === null;
  const tone = nearCap ? 'var(--bad)' : 'var(--ink)';

  return (
    <button
      type="button"
      onClick={onOpen}
      className={active ? 'chip chip--brass tap' : empty ? 'chip tap' : 'chip tap'}
      style={{
        width: '100%',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 3,
        borderStyle: empty ? 'dashed' : 'solid',
        borderColor: nearCap ? 'var(--bad-a45)' : undefined,
        opacity: empty ? 0.75 : 1,
      }}
      aria-label={`${t(`station.${station}`)} · ${t(role === 'lead' ? 'pas.lead' : 'pas.helper')}`}
    >
      <span className="spread" style={{ gap: 6, width: '100%' }}>
        <span style={{ color: tone, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {empty ? (role === 'lead' ? t('pas.noHands') : t('pas.addHelper')) : cook.lastName}
          {nearCap ? ' !' : ''}
        </span>
        <span className="label" style={{ fontSize: 'var(--fs-micro)' }}>
          {t(role === 'lead' ? 'pas.lead' : 'pas.helper')}
        </span>
      </span>

      {/* Wear sits with the name, because that is where its consequence lands. */}
      {cook === null ? null : (
        <span
          aria-hidden="true"
          style={{ display: 'block', height: 3, borderRadius: 2, background: 'var(--line)' }}
        >
          <span
            style={{
              display: 'block',
              width: `${(cook.wear / C.wear.max) * 100}%`,
              height: '100%',
              borderRadius: 2,
              background: nearCap
                ? 'var(--bad)'
                : cook.wear >= C.wear.max * 0.6
                  ? 'var(--warn)'
                  : 'var(--ok)',
            }}
          />
        </span>
      )}
    </button>
  );
}

export default function StationDisk({
  setup,
  station,
  openSlot,
  onOpenSlot,
}: Props): React.JSX.Element {
  const ratio = setup.capacity > 0 ? setup.load / setup.capacity : Number.POSITIVE_INFINITY;
  const overloaded = setup.overload > 0;
  const tone =
    !setup.viable || overloaded ? 'var(--bad)' : ratio > 0.8 ? 'var(--warn)' : 'var(--ok)';
  const percent = Number.isFinite(ratio) ? Math.round(ratio * 100) : 0;
  const touched = openSlot !== null && openSlot.station === station;

  return (
    <section
      className={touched ? 'card card--lifted' : 'card'}
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

        <Slot
          cook={setup.lead}
          station={station}
          role="lead"
          active={slotEquals(openSlot, { station, role: 'lead' })}
          onOpen={() => onOpenSlot({ station, role: 'lead' })}
        />
        <Slot
          cook={setup.helper}
          station={station}
          role="helper"
          active={slotEquals(openSlot, { station, role: 'helper' })}
          onOpen={() => onOpenSlot({ station, role: 'helper' })}
        />

        <div style={{ marginTop: 'auto' }}>
          <span className="mono" style={{ fontSize: '19px', color: tone }}>
            {setup.viable ? `${percent}%` : '—'}
          </span>
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
