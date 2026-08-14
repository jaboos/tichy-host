/**
 * One station, and the control the whole Pas turns on. PRD §3.1 FR-1 item 4 and
 * FR-1a as amended.
 *
 * The card names the people standing at it and carries their wear, so the two
 * things a staffing decision needs — who is here and how worn they are — sit next
 * to the load figure that decides whether it matters. Tapping a place opens the
 * list of people who could stand there; the card stays visible above it, which is
 * the whole point of moving assignment here from the cook rows.
 *
 * When the station is overloaded the *card* breathes red — `zar` is a box-shadow
 * animation, so nothing sits on top of the content to do it.
 */
import { C } from '../engine/constants';
import { cookLast, formatNumber, t } from '../i18n';
import { slotEquals, type SlotRef } from '../store/gameStore';
import type { StationSetup } from '../engine/plate';
import type { Cook, CookRole, Station } from '../engine/types';

interface Props {
  setup: StationSetup;
  station: Station;
  openSlot: SlotRef | null;
  /** True when tonight's intervention is aimed here. */
  targeted?: boolean;
  onOpenSlot: (slot: SlotRef) => void;
}

function wearTone(wear: number): string {
  if (wear >= C.wear.warningThreshold) return 'var(--bad)';
  return wear >= C.wear.max * 0.6 ? 'var(--warn)' : 'var(--ok)';
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
  const empty = cook === null;
  const tone = empty ? 'var(--line)' : wearTone(cook.wear);
  const nearCap = cook !== null && cook.wear >= C.wear.warningThreshold;
  const who = empty ? t(role === 'lead' ? 'pas.noHands' : 'pas.addHelper') : cookLast(cook.id);
  const wearSaid = empty ? t('common.none') : `${t('common.wear')} ${formatNumber(cook.wear, 1)}`;

  return (
    <button
      type="button"
      onClick={onOpen}
      data-tour={role === 'lead' ? 'slot-lead' : 'slot-helper'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width: '100%',
        textAlign: 'left',
      }}
      // The name goes in the label. Without it a screen reader announced
      // "Studená · vedoucí" and never said who was standing there — the one fact
      // the whole station-first rewrite exists to put on the card.
      aria-label={`${t(`station.${station}`)} · ${t(role === 'lead' ? 'pas.lead' : 'pas.helper')} · ${who} · ${wearSaid}`}
    >
      <span className="spread" style={{ gap: 6, width: '100%', alignItems: 'baseline' }}>
        <span
          style={{
            fontSize: 'var(--fs-small)',
            color: empty ? 'var(--ink-muted)' : active ? 'var(--brass)' : 'var(--ink)',
            border: empty ? '1px dashed var(--line)' : 'none',
            borderRadius: 'var(--radius-chip)',
            padding: empty ? '2px 7px' : 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            // The dashed slot breathes while it waits to be filled.
            animation: empty ? 'cekani 2.6s var(--ease-out) infinite' : undefined,
          }}
        >
          {empty ? (role === 'lead' ? t('pas.noHands') : t('pas.addHelper')) : cookLast(cook.id)}
        </span>
        {/* No aria-label here: it replaced the figure with the bare word
            "opotřebení" and the number was never read out. The button's own label
            says both. */}
        <span className="mono" style={{ fontSize: 'var(--fs-micro)', color: tone, flex: 'none' }}>
          {empty ? t('common.none') : formatNumber(cook.wear, 1)}
          {nearCap ? ' !' : ''}
        </span>
      </span>

      {/* Wear sits with the name, because that is where its consequence lands. */}
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          height: 3,
          borderRadius: 'var(--radius-pill)',
          background: 'var(--line)',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            display: 'block',
            width: empty ? '0%' : `${(cook.wear / C.wear.max) * 100}%`,
            height: '100%',
            background: tone,
          }}
        />
      </span>
    </button>
  );
}

export default function StationDisk({
  setup,
  station,
  openSlot,
  targeted = false,
  onOpenSlot,
}: Props): React.JSX.Element {
  const ratio = setup.capacity > 0 ? setup.load / setup.capacity : Number.POSITIVE_INFINITY;
  const overloaded = setup.overload > 0;
  const tone =
    !setup.viable || overloaded ? 'var(--bad)' : ratio > 0.8 ? 'var(--warn)' : 'var(--ink)';
  const percent = Number.isFinite(ratio) ? Math.round(ratio * 100) : 0;
  const touched = openSlot !== null && openSlot.station === station;

  return (
    <section
      className={touched || targeted ? 'card card--lifted' : 'card'}
      style={{
        position: 'relative',
        minHeight: 158,
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        padding: '11px 12px 10px',
        borderColor: overloaded ? 'var(--bad-a45)' : targeted ? 'var(--brass)' : undefined,
        animation: overloaded ? 'zar 2.2s var(--ease-out) infinite' : undefined,
      }}
      aria-label={t(`station.${station}`)}
    >
      <div className="spread" style={{ alignItems: 'flex-start', gap: 6 }}>
        <div style={{ minWidth: 0 }}>
          <div className="label">{t('common.station')}</div>
          <div
            className="display"
            style={{ fontSize: 'var(--fs-dish)', lineHeight: 1.1, marginTop: 2 }}
          >
            {t(`station.${station}`)}
          </div>
        </div>
        <div
          className="mono"
          style={{
            flex: 'none',
            fontSize: 'var(--fs-num)',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            letterSpacing: '-.02em',
            color: tone,
            animation: 'tik var(--dur-count) var(--ease-out) both',
          }}
        >
          {setup.viable ? `${percent} %` : t('common.none')}
        </div>
      </div>

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

      <div
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--line)',
          paddingTop: 7,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div
          className="label"
          style={{ fontSize: 'var(--fs-micro)', letterSpacing: '.06em', whiteSpace: 'nowrap' }}
        >
          {t('pas.load')} / {t('pas.capacity')}
        </div>
        <div
          className="mono"
          style={{ fontSize: 'var(--fs-num-sm)', whiteSpace: 'nowrap', color: tone }}
        >
          {formatNumber(setup.load, 1)} / {formatNumber(setup.capacity, 1)}
        </div>
      </div>

      {overloaded ? (
        <div
          className="mono"
          style={{
            position: 'absolute',
            top: -7,
            right: 8,
            background: 'var(--bad)',
            color: '#fff3ef',
            fontSize: 'var(--fs-micro)',
            letterSpacing: 'var(--ls-label)',
            padding: '3px 7px',
            borderRadius: 'var(--radius-chip)',
            boxShadow: 'var(--shadow-lift)',
            animation: 'razba var(--dur-base) var(--ease-drop) both',
          }}
        >
          {t('pas.overloaded')}
        </div>
      ) : null}

      {targeted ? (
        <div
          className="mono"
          style={{
            position: 'absolute',
            bottom: -7,
            left: 10,
            background: 'var(--brass)',
            color: '#14110c',
            fontSize: 'var(--fs-micro)',
            letterSpacing: 'var(--ls-label)',
            padding: '3px 7px',
            borderRadius: 'var(--radius-chip)',
          }}
        >
          ✓ {t('pas.here')}
        </div>
      ) : null}
    </section>
  );
}
