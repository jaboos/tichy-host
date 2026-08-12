/**
 * Who stands in one place on one station. PRD §3.1 FR-1a as amended.
 *
 * It sits full-width directly under the station grid rather than inside the
 * half-width card, so the card it belongs to stays visible above it while you
 * read — which is the reason assignment moved here in the first place.
 *
 * Every row carries the consequence worked out in advance: the effective hand at
 * THIS station with the ±1 already applied, the wear, where the cook stands now,
 * what the station's load becomes, and — in red — the station that would be left
 * without hands. Nothing is disabled and nothing is hidden; the game shows both
 * sides and the player decides, exactly as it does for a push.
 */
import { formatNumber, t } from '../i18n';
import type { SlotCandidate, SlotRef } from '../store/gameStore';

interface Props {
  slot: SlotRef;
  candidates: readonly SlotCandidate[];
  occupied: boolean;
  onChoose: (cookId: string | null) => void;
  onCancel: () => void;
}

export default function SlotPicker({
  slot,
  candidates,
  occupied,
  onChoose,
  onCancel,
}: Props): React.JSX.Element {
  return (
    <div
      className="card card--lifted"
      // The list opens below the fold and the sticky dock covers it, so tapping a
      // place looked like nothing happened. Centre it, because 'nearest' parks it
      // under the dock — the dock is outside the scroll calculation.
      // Optional call: jsdom has no scrollIntoView, and the render tests mount
      // this for real rather than stubbing it.
      ref={(el) => el?.scrollIntoView?.({ block: 'center' })}
      style={{ marginTop: 8 }}
    >
      <div className="label">
        {t('pas.whoOnSlot', {
          station: t(`station.${slot.station}.at`),
          role: t(slot.role === 'lead' ? 'pas.lead' : 'pas.helper'),
        })}
      </div>

      <div className="stack" style={{ marginTop: 8, gap: 6 }}>
        {candidates.map((candidate) => (
          <button
            key={candidate.cook.id}
            type="button"
            className={candidate.current ? 'chip chip--brass tap' : 'chip tap'}
            style={{ flexDirection: 'column', alignItems: 'stretch', gap: 3, width: '100%' }}
            onClick={() => onChoose(candidate.cook.id)}
          >
            <span className="spread" style={{ width: '100%', gap: 8 }}>
              <span className="display" style={{ fontSize: 'var(--fs-body)', color: 'var(--ink)' }}>
                {candidate.cook.lastName}
              </span>
              <span className="mono" style={{ fontSize: 'var(--fs-small)' }}>
                {t('cook.hand')} {candidate.effHand} · {t('cook.wear')}{' '}
                {formatNumber(candidate.cook.wear, 1)}
              </span>
            </span>

            {candidate.current ? (
              <span className="label" style={{ fontSize: 'var(--fs-micro)' }}>
                {t('pas.here')}
              </span>
            ) : (
              <>
                <span className="mono muted" style={{ fontSize: 'var(--fs-small)' }}>
                  {candidate.fromStation === null
                    ? t('pas.resting')
                    : t(`station.${candidate.fromStation}.from`)}
                  {' · '}
                  {t('pas.impactLine', {
                    station: t(`station.${slot.station}`),
                    before: `${candidate.percentBefore} %`,
                    after: `${candidate.percentAfter} %`,
                  })}
                </span>
                {candidate.emptiedStation === null ? null : (
                  <span className="mono bad" style={{ fontSize: 'var(--fs-small)' }}>
                    {t('pas.leavesNoHands', {
                      station: t(`station.${candidate.emptiedStation}`),
                    })}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      <div className="row" style={{ marginTop: 10, gap: 6 }}>
        {occupied ? (
          <button type="button" className="chip tap" onClick={() => onChoose(null)}>
            {t('pas.releaseSlot')}
          </button>
        ) : null}
        <button type="button" className="chip tap" onClick={onCancel}>
          {t('iv.cancel')}
        </button>
      </div>
    </div>
  );
}
