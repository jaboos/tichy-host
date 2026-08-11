/** The six, as a list. Tapping one opens its card. PRD §6.4 */
import { t } from '../i18n';
import { useGame } from '../store/gameStore';
import CookRow from '../components/CookRow';

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
          <CookRow key={cook.id} cook={cook} onOpenCard={() => openCookCard(cook.id)} />
        ))}
      </div>
    </>
  );
}
