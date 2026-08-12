/**
 * One plate on the pass rail. PRD §3.1 FR-2 and §6.6: a docket shows the
 * DEVIATION from tonight's bar, never the absolute quality — the absolute number
 * would mean nothing without the bar next to it.
 *
 * A plate with no number at all is a station that could not cook it (§9 cases 1,
 * 2 and 8): struck through, and honest about having no figure.
 *
 * Two animations, in order: `najezd` slides the docket in from the right one
 * `--stagger` after the last one, and only once it has landed does `spad` drop a
 * plate that came in under the bar. A defect is something you watch fall.
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

  const arrive = `calc(var(--stagger) * ${index})`;
  const landed = `calc(var(--stagger) * ${index} + var(--dur-docket))`;

  return (
    <div
      style={{
        animation: animate ? `najezd var(--dur-docket) var(--ease-out) ${arrive} both` : undefined,
      }}
    >
      <div
        className="card"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          borderRadius: 'var(--radius-docket)',
          background: star
            ? 'linear-gradient(180deg, rgba(216,162,74,.10), var(--card))'
            : undefined,
          borderColor: star ? 'var(--brass)' : defect ? 'var(--bad-a45)' : 'var(--line)',
          animation: defect && animate ? `spad 260ms var(--ease-drop) ${landed} both` : undefined,
          transform: defect && !animate ? 'translateY(9px) rotate(-2.4deg)' : undefined,
          opacity: defect && !animate ? 0.78 : undefined,
        }}
      >
        {/* The stub that clips the docket to the rail. */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: -17,
            top: '50%',
            width: 17,
            height: 1,
            background: star ? 'var(--brass)' : defect ? 'var(--bad-a45)' : 'var(--line)',
          }}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="display"
            style={{
              fontSize: 15,
              lineHeight: 1.2,
              textDecoration: defect ? 'line-through' : undefined,
              color: defect ? 'var(--ink-muted)' : 'var(--ink)',
            }}
          >
            {t(course.nameKey)}
          </div>
          <div
            className="mono muted"
            style={{
              marginTop: 3,
              fontSize: 'var(--fs-micro)',
              letterSpacing: 'var(--ls-label)',
              textTransform: 'uppercase',
            }}
          >
            {t(`station.${plate.station}`)} ·{' '}
            {plate.wave === 0 ? t('service.wave1') : t('service.wave2')}
          </div>
        </div>

        {star ? (
          <span
            aria-label={t('outcome.star')}
            style={{
              flex: 'none',
              fontSize: 15,
              color: 'var(--brass-hi)',
              animation: animate
                ? `hvezdaVstup var(--dur-base) var(--ease-drop) ${landed} both`
                : undefined,
            }}
          >
            ★
          </span>
        ) : null}

        <span
          className="mono"
          style={{
            flex: 'none',
            fontSize: 20,
            letterSpacing: '-.02em',
            color: defect ? 'var(--bad)' : star ? 'var(--brass-hi)' : 'var(--ok)',
            textDecoration: defect ? 'line-through' : undefined,
          }}
        >
          {deviation === null ? t('pas.noHands') : formatSigned(deviation, 1)}
        </span>

        {defect && deviation !== null ? (
          <span
            className="mono bad"
            style={{
              flex: 'none',
              fontSize: 'var(--fs-micro)',
              letterSpacing: 'var(--ls-label)',
            }}
          >
            {t('outcome.belowBar')}
          </span>
        ) : null}

        {/* Read aloud, the number means nothing on its own: "+0,9" could be money,
            wear or a rating. The outcome is said in a word, for ears only. */}
        <span className="sr-only">
          {t(defect ? 'outcome.defect' : star ? 'outcome.star' : 'outcome.passed')}
        </span>
      </div>
    </div>
  );
}
