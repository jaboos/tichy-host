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

/** Screens with a fixed CTA pinned to the bottom. */
const WITH_CTA = new Set([
  'onboarding',
  'pas',
  'service',
  'consequence',
  'monday',
  'menu',
  'verdict',
]);

/**
 * Measured heights of the two things that can be pinned to the bottom. The CTA
 * and the tab bar used to occupy the same space — the CTA sat on top of the nav
 * and over the last row of content. Now the frame reserves room for whatever is
 * actually there, and the CTA offsets itself above the nav.
 */
const NAV_HEIGHT = 56;
const CTA_HEIGHT = 86;

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

  const bottom = {
    '--bottom-nav': `${WITHOUT_TABS.has(screen) ? 0 : NAV_HEIGHT}px`,
    '--bottom-cta': `${WITH_CTA.has(screen) ? CTA_HEIGHT : 0}px`,
  } as React.CSSProperties;

  return (
    <main className="frame" style={bottom}>
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
