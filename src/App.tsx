import { useEffect } from 'react';

import { t } from './i18n';
import { useGame } from './store/gameStore';
import TabBar from './components/TabBar';
import Brigade from './screens/Brigade';
import Calendar from './screens/Calendar';
import Consequence from './screens/Consequence';
import CookCard from './screens/CookCard';
import Menu from './screens/Menu';
import MondayPlan from './screens/MondayPlan';
import Onboarding from './screens/Onboarding';
import Pas from './screens/Pas';
import Service from './screens/Service';
import Verdict from './screens/Verdict';

/** Screens where the tab bar would be a way to walk out of a decision. */
const WITHOUT_TABS = new Set(['onboarding', 'service', 'consequence', 'monday', 'verdict']);

/**
 * The shell. CLAUDE.md rule 9: no component holds a literal — every string here
 * and below goes through `t()`, and `tests/i18n.test.ts` fails the build if one
 * slips in.
 */
export default function App(): React.JSX.Element {
  const screen = useGame((s) => s.screen);
  const boot = useGame((s) => s.boot);
  const lang = useGame((s) => s.lang);
  const setLang = useGame((s) => s.setLang);

  // Restoring a save is a side effect and belongs here, not in the engine.
  useEffect(() => {
    boot();
  }, [boot]);

  const body = (): React.JSX.Element | null => {
    switch (screen) {
      case 'onboarding':
        return <Onboarding />;
      case 'pas':
        return <Pas />;
      case 'service':
        return <Service />;
      case 'consequence':
        return <Consequence />;
      case 'monday':
        return <MondayPlan />;
      case 'menu':
        return <Menu />;
      case 'calendar':
        return <Calendar />;
      case 'brigade':
        return <Brigade />;
      case 'cook':
        return <CookCard />;
      case 'verdict':
        return <Verdict />;
      default:
        return null;
    }
  };

  return (
    <main className="frame">
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="chip"
          onClick={() => setLang(lang === 'cs' ? 'en' : 'cs')}
          lang={lang === 'cs' ? 'en' : 'cs'}
        >
          {lang === 'cs' ? t('lang.switch') : t('lang.switchBack')}
        </button>
      </div>
      {body()}
      {WITHOUT_TABS.has(screen) ? null : <TabBar />}
    </main>
  );
}
