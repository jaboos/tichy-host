/**
 * Sunday. PRD FR-11 — a must-have, not polish.
 *
 * A visit is confirmed by the end of the same week, and the card lists exactly
 * those six plates against that day's bar, with the retroactive anchor: what the
 * suspicion was at the time, and what was pushed. Playing a whole season without
 * this produced one recorded visit the player was never told about, so the
 * learning loop for the only outcome that matters was forty evenings long.
 *
 * The plates show absolute quality here rather than a deviation, because that is
 * the shape FR-11 specifies and because the bar of a past evening is itself worth
 * seeing — it is the number the season was judged against.
 */
import { C } from '../engine/constants';
import { getCourse } from '../data/courses';
import { formatNumber, formatPercent, t } from '../i18n';
import { useGame } from '../store/gameStore';
import type { Visit } from '../engine/types';

function VisitCard({ visit, index }: { visit: Visit; index: number }): React.JSX.Element {
  const worst = visit.plates.reduce<number | null>((gap, plate) => {
    if (plate.outcome !== 'defect' || plate.q === null) return gap;
    const short = plate.bar - plate.q;
    return gap === null || short > gap ? short : gap;
  }, null);

  return (
    <div className="card" style={{ animation: 'vstup var(--dur-docket) var(--ease-out) both' }}>
      <div className="spread" style={{ alignItems: 'baseline' }}>
        <span className="h2">{t('report.title')}</span>
        <span className="mono muted" style={{ fontSize: 'var(--fs-micro)' }}>
          {t('report.subtitle', {
            n: index + 1,
            evening: visit.eveningIndex + 1,
            wave: visit.wave === 0 ? t('service.wave1') : t('service.wave2'),
          })}
        </span>
      </div>

      <p className="quote" style={{ marginTop: 10, fontSize: 17, color: 'var(--ink)' }}>
        {t('report.confirmed')}
      </p>

      {/* The six plates, in service order, each against the bar of that evening. */}
      <div className="stack" style={{ marginTop: 14, gap: 6 }}>
        {visit.plates.map((plate, i) => {
          const defect = plate.outcome === 'defect';
          const star = plate.outcome === 'star';
          return (
            <div
              key={`${plate.courseId}-${i}`}
              className="spread"
              style={{
                alignItems: 'baseline',
                borderBottom: '1px solid var(--line)',
                paddingBottom: 5,
                animation: `vstup var(--dur-base) var(--ease-out) calc(var(--stagger) * ${i}) both`,
              }}
            >
              {/* The dish, not just the station: "Oheň 11,8" three times teaches
                  nothing, "Candát 11,8" is the thing to cook differently. */}
              <span style={{ minWidth: 0 }}>
                <span
                  className="display"
                  style={{ display: 'block', fontSize: 'var(--fs-body)', color: 'var(--ink)' }}
                >
                  {t(getCourse(plate.courseId).nameKey)}
                </span>
                <span className="label" style={{ fontSize: 'var(--fs-micro)' }}>
                  {t(`station.${plate.station}`)}
                </span>
              </span>
              <span className="row" style={{ gap: 8, alignItems: 'baseline' }}>
                {star ? <span style={{ color: 'var(--brass-hi)' }}>★</span> : null}
                <span
                  className="mono"
                  style={{
                    fontSize: 'var(--fs-num-sm)',
                    color: defect ? 'var(--bad)' : star ? 'var(--brass)' : 'var(--ink)',
                  }}
                >
                  {plate.q === null ? t('pas.noHands') : formatNumber(plate.q, 1)}
                </span>
                {defect ? (
                  <span
                    className="mono bad"
                    style={{ fontSize: 'var(--fs-micro)', letterSpacing: 'var(--ls-label)' }}
                  >
                    {t('outcome.belowBar')}
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>

      <div className="stack" style={{ marginTop: 14, gap: 8 }}>
        <div className="spread">
          <span className="label">{t('report.barThatDay')}</span>
          <span className="mono">{formatNumber(visit.plates[0]?.bar ?? 0, 1)}</span>
        </div>
        <div className="spread">
          <span className="label">{t('report.suspicionThen')}</span>
          <span className="mono">{formatPercent(visit.suspicionAtTime)}</span>
        </div>
      </div>

      <p className="quote" style={{ marginTop: 12, fontSize: 'var(--fs-body)' }}>
        {visit.pushedStation === null
          ? t('report.pushedNothing')
          : t('report.pushedThen', { stationAt: t(`station.${visit.pushedStation}.at`) })}{' '}
        {worst === null ? t('report.clean') : t('report.shortBy', { gap: formatNumber(worst, 1) })}
      </p>
    </div>
  );
}

export default function ReportCard(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const acknowledgeReport = useGame((s) => s.acknowledgeReport);
  if (game === null) return null;

  const fresh = game.visits
    .map((visit, index) => ({ visit, index }))
    .filter((entry) => !entry.visit.confirmed);

  const belowSoFar = game.visits
    .flatMap((visit) => visit.plates)
    .filter((plate) => plate.outcome === 'defect');

  return (
    <>
      {fresh.length === 0 ? (
        <p className="quote" style={{ marginTop: 20 }}>
          {t('report.noVisit')}
        </p>
      ) : (
        <div className="stack" style={{ marginTop: 6, gap: 12 }}>
          {fresh.map((entry) => (
            <VisitCard key={entry.index} visit={entry.visit} index={entry.index} />
          ))}
        </div>
      )}

      <div className="dock">
        <div className="verdict-line" style={{ '--dot': 'var(--warn)' } as React.CSSProperties}>
          {t('report.belowSoFar', {
            n: belowSoFar.length,
            total: C.inspector.visitsPerSeason * C.inspector.platesPerVisit,
          })}
        </div>
        <button type="button" className="cta" onClick={acknowledgeReport}>
          {t('report.next')}
        </button>
      </div>
    </>
  );
}
