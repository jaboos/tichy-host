/** Pas · Menu · Kalendář · Kádr. PRD §6.4. */
import { t } from '../i18n';
import { useGame, type Screen } from '../store/gameStore';

const TABS: ReadonlyArray<{
  screen: Screen;
  key: 'nav.pas' | 'nav.menu' | 'nav.calendar' | 'nav.brigade';
}> = [
  { screen: 'pas', key: 'nav.pas' },
  { screen: 'menu', key: 'nav.menu' },
  { screen: 'calendar', key: 'nav.calendar' },
  { screen: 'brigade', key: 'nav.brigade' },
];

export default function TabBar(): React.JSX.Element {
  const screen = useGame((s) => s.screen);
  const goto = useGame((s) => s.goto);

  return (
    <nav
      className="row"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(var(--col-width), 100vw)',
        justifyContent: 'space-around',
        padding: '8px 0 max(8px, env(safe-area-inset-bottom))',
        background: 'var(--bg)',
        borderTop: '1px solid var(--line)',
        zIndex: 10,
      }}
    >
      {TABS.map((tab) => (
        <button
          key={tab.screen}
          type="button"
          className="tap label"
          style={{
            color: screen === tab.screen ? 'var(--brass)' : 'var(--ink-muted)',
            padding: '0 12px',
          }}
          onClick={() => goto(tab.screen)}
          aria-current={screen === tab.screen ? 'page' : undefined}
        >
          {t(tab.key)}
        </button>
      ))}
    </nav>
  );
}
