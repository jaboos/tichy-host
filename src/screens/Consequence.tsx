/**
 * One line and the deltas. PRD §3.1 FR-3.
 *
 * Silence is information (§3.11): an evening where nothing went wrong says so in
 * one sentence rather than inventing drama. The card sits alone in the column
 * because this is a beat, not a dashboard.
 */
import { formatCurrency, formatNumber, formatSigned, t } from '../i18n';
import { narratorText, useGame } from '../store/gameStore';

export default function Consequence(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const result = useGame((s) => s.lastResult);
  const nextEvening = useGame((s) => s.nextEvening);
  if (game === null || result === null) return null;

  // The narrator, not a counter. `Vad dnes: 6` told the player a number they had
  // just watched arrive twelve times; these three lines say which plates and why.
  // An evening with nothing worth saying says nothing — silence is information.
  const lines = narratorText(game, result);
  if (lines.length === 0) lines.push(t('consequence.quiet'));

  const deviation = result.avgQ - result.bar;

  const figure = (label: string, value: string, note: string, tone: string): React.JSX.Element => (
    <div className="spread" key={label} style={{ alignItems: 'baseline' }}>
      <span className="label">{label}</span>
      <span className="row" style={{ gap: 9, alignItems: 'baseline' }}>
        <span className="mono" style={{ fontSize: 19 }}>
          {value}
        </span>
        <span className="mono" style={{ fontSize: 'var(--fs-small)', color: tone }}>
          {note}
        </span>
      </span>
    </div>
  );

  return (
    <>
      <div className="spread" style={{ paddingTop: 6 }}>
        <span className="h2 muted">{t('consequence.title')}</span>
      </div>

      <div
        className="card"
        style={{
          marginTop: 24,
          padding: '20px 18px',
          animation: 'vstup var(--dur-docket) var(--ease-out) both',
        }}
      >
        <div className="stack" style={{ gap: 12 }}>
          {lines.map((line, index) => (
            <p
              className="quote"
              key={line}
              style={{
                fontSize: 17,
                lineHeight: 1.45,
                color: 'var(--ink)',
                animation: `otisk var(--dur-base) var(--ease-out) ${index * 120}ms both`,
              }}
            >
              {line}
            </p>
          ))}
        </div>

        <div style={{ margin: '18px 0 0', height: 1, background: 'var(--line)' }} />

        <div className="stack" style={{ marginTop: 16, gap: 12 }}>
          {figure(
            t('consequence.reputation'),
            formatNumber(game.reputation, 1),
            '',
            'var(--ink-muted)',
          )}
          {figure(t('consequence.cash'), formatCurrency(game.cash), '', 'var(--ink-muted)')}
          {/* No note here: the defect count is already the first line above, and
              printing it twice made the card read like two different findings. */}
          {figure(t('service.avgDeviation'), formatSigned(deviation, 2), '', 'var(--ink-muted)')}
        </div>
      </div>

      <div className="dock">
        <button type="button" className="cta" onClick={nextEvening}>
          {t('consequence.next')}
        </button>
      </div>
    </>
  );
}
