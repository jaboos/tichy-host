/**
 * One plate on the pass rail. PRD §3.1 FR-2 and §6.6: a docket shows the
 * DEVIATION from tonight's bar, never the absolute quality — the absolute number
 * would mean nothing without the bar next to it.
 *
 * A plate with no number at all is a station that could not cook it (§9 cases 1,
 * 2 and 8): struck through, and honest about having no figure.
 */
import { formatSigned, t } from '../i18n';
import { getCourse } from '../data/courses';
import type { Plate } from '../engine/types';

interface Props {
  plate: Plate;
  index: number;
  animate: boolean;
}

export default function Docket({ plate, index, animate }: Props): React.JSX.Element {
  const course = getCourse(plate.courseId);
  const defect = plate.outcome === 'defect';
  const star = plate.outcome === 'star';
  const deviation = plate.q === null ? null : plate.q - plate.bar;

  return (
    <div
      className="card"
      style={{
        padding: '9px 11px',
        borderRadius: 'var(--radius-docket)',
        borderColor: star ? 'var(--brass-a55)' : defect ? 'var(--bad-a45)' : 'var(--line)',
        position: 'relative',
        animation: animate ? `najezd var(--dur-docket) var(--ease-out) both` : undefined,
        animationDelay: animate ? `${index * 80}ms` : undefined,
        transform: defect ? 'translateX(10px) rotate(-3.2deg)' : undefined,
        opacity: defect ? 0.75 : 1,
      }}
    >
      <div className="spread">
        <div style={{ minWidth: 0 }}>
          <div
            className="display"
            style={{
              fontSize: 'var(--fs-dish)',
              textDecoration: defect ? 'line-through' : undefined,
              color: defect ? 'var(--bad)' : undefined,
            }}
          >
            {t(course.nameKey)}
          </div>
          <div className="label" style={{ marginTop: 2 }}>
            {t(`station.${plate.station}`)} ·{' '}
            {plate.wave === 0 ? t('service.wave1') : t('service.wave2')}
          </div>
        </div>

        <div className="row" style={{ gap: 6 }}>
          {star ? (
            <span
              className="brass"
              aria-label={t('outcome.star')}
              style={{
                fontSize: '17px',
                animation: animate ? 'razba var(--dur-base) var(--ease-out) both' : undefined,
              }}
            >
              ★
            </span>
          ) : null}
          <span
            className="mono"
            style={{
              fontSize: '15px',
              color: defect ? 'var(--bad)' : star ? 'var(--brass)' : 'var(--ok)',
            }}
          >
            {deviation === null ? t('pas.noHands') : formatSigned(deviation, 1)}
          </span>
          {defect && deviation !== null ? (
            <span className="label bad">{t('outcome.belowBar')}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
