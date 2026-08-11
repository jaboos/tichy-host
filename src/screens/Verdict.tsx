/**
 * End of season. PRD §3.8 FR-12.
 *
 * Phase 3 shows the result honestly; the Lambert letter on cream paper, the wax
 * seal and the chronicle are Phase 4 (§7).
 */
import { C } from '../engine/constants';
import { isBankrupt } from '../engine/economy';
import { formatCurrency, formatNumber, t } from '../i18n';
import { useGame } from '../store/gameStore';
import BrassDivider from '../components/BrassDivider';

export default function Verdict(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const goto = useGame((s) => s.goto);
  if (game === null) return null;

  const plates = game.visits.flatMap((visit) => visit.plates);
  const below = plates.filter((plate) => plate.outcome === 'defect').length;
  const starsKey = (['verdict.stars0', 'verdict.stars1', 'verdict.stars2'] as const)[game.stars];

  return (
    <>
      <h1 className="display" style={{ fontSize: 'var(--fs-title)', margin: 0 }}>
        {t('verdict.title')}
      </h1>

      <div className="brass" style={{ fontSize: '44px', letterSpacing: '.1em', marginTop: 10 }}>
        {game.stars === 0 ? '—' : '★'.repeat(game.stars)}
      </div>
      <p className="quote" style={{ marginTop: 4 }}>
        {t(starsKey ?? 'verdict.stars0')}
      </p>

      {isBankrupt(game.cash) ? (
        <p className="bad" style={{ fontSize: 'var(--fs-small)' }}>
          {t('verdict.bankrupt')}
        </p>
      ) : null}

      <BrassDivider />
      <div className="card">
        <div className="spread">
          <span className="label">{t('verdict.plates')}</span>
        </div>
        <div className="mono" style={{ marginTop: 6 }}>
          {t('verdict.plates', {
            n: below,
            total: C.inspector.visitsPerSeason * C.inspector.platesPerVisit,
          })}
        </div>
        <div className="spread" style={{ marginTop: 10 }}>
          <span className="label">{t('common.reputation')}</span>
          <span className="mono">{formatNumber(game.reputation, 1)}</span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('common.cash')}</span>
          <span className="mono">{formatCurrency(game.cash)}</span>
        </div>
        <div className="spread" style={{ marginTop: 6 }}>
          <span className="label">{t('app.seedLabel')}</span>
          <span className="mono brass">{game.seed}</span>
        </div>
      </div>

      <button type="button" className="cta tap" onClick={() => goto('onboarding')}>
        {t('verdict.again')}
      </button>
    </>
  );
}
