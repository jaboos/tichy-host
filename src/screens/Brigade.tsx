/** The six, as a list. Tapping one opens its card. PRD §6.4 */
import { getTrait } from '../data/traits';
import { formatNumber, t } from '../i18n';
import { useGame } from '../store/gameStore';
import CookTriptych from '../components/CookTriptych';

export default function Brigade(): React.JSX.Element | null {
  const game = useGame((s) => s.game);
  const openCookCard = useGame((s) => s.openCookCard);
  if (game === null) return null;

  return (
    <>
      <h1 className="display" style={{ fontSize: 'var(--fs-h2)', margin: 0 }}>
        {t('brigade.title')}
      </h1>
      <div className="stack" style={{ marginTop: 12 }}>
        {game.cooks.map((cook) => (
          <button
            key={cook.id}
            type="button"
            className="card"
            style={{ textAlign: 'left', padding: 10 }}
            onClick={() => openCookCard(cook.id)}
          >
            <div className="spread">
              <div>
                <div className="display" style={{ fontSize: 'var(--fs-dish)' }}>
                  {cook.firstName} {cook.lastName}
                </div>
                <div className="muted" style={{ fontSize: 'var(--fs-small)' }}>
                  {t(`station.${cook.homeStation}`)} · {t(getTrait(cook.traitId).nameKey)} ·{' '}
                  {t('cook.wear')} {formatNumber(cook.wear, 1)}
                </div>
              </div>
              <div style={{ width: 150 }}>
                <CookTriptych cook={cook} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
