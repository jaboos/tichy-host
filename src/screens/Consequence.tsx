/**
 * One line and the deltas. PRD §3.1 FR-3, built from the same card as the Pas
 * (§6.7) — no mockup needed and none exists.
 *
 * Silence is information (§3.11): an evening where nothing went wrong says so in
 * one sentence rather than inventing drama.
 */
import { formatCurrency, formatNumber, formatSigned, t } from '../i18n';
import { useGame } from '../store/gameStore';
import BrassDivider from '../components/BrassDivider';

export default function Consequence(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const result = useGame((s) => s.lastResult);
  const nextEvening = useGame((s) => s.nextEvening);
  if (game === null || result === null) return null;

  const lines: string[] = [];
  if (result.defects > 0) lines.push(t('consequence.defectLine', { n: result.defects }));
  if (result.starPlates > 0) lines.push(t('consequence.starLine', { n: result.starPlates }));
  if (lines.length === 0) lines.push(t('consequence.quiet'));

  return (
    <>
      <h1 className="display" style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>
        {t('consequence.title')}
      </h1>

      <div className="card" style={{ marginTop: 12 }}>
        {lines.map((line) => (
          <p className="quote" key={line} style={{ marginBottom: 6 }}>
            {line}
          </p>
        ))}

        <BrassDivider />

        <div className="spread">
          <span className="label">{t('consequence.reputation')}</span>
          <span className="mono">{formatNumber(game.reputation, 1)}</span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('consequence.cash')}</span>
          <span className="mono">{formatCurrency(game.cash)}</span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('service.total')}</span>
          <span className="mono">{formatSigned(result.avgQ - result.bar, 1)}</span>
        </div>
      </div>

      <button type="button" className="cta tap" onClick={nextEvening}>
        {t('consequence.next')}
      </button>
    </>
  );
}
